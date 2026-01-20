import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { Errors, success, error } from '@/lib/api-utils';
import { addCorsHeaders } from '@/lib/cors';
import { RequestLogger } from '@/lib/request-logger';
import { calculateReputation } from '@/lib/scoring/calculator';
import { upsertReputation } from '@/lib/db/queries';
import { normalizeAddress } from '@/lib/utils';
import { checkRateLimit } from '@/lib/rate-limit';
import type { Address } from 'viem';

const addressSchema = z.object({
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address'),
});

/**
 * GET /api/reputation/[address]
 * 
 * Returns reputation score and tier for an address
 * Uses cached data when available, triggers recalculation if needed
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  // Check rate limit
  const rateLimit = checkRateLimit(request);
  if (!rateLimit.allowed) {
    const response = NextResponse.json(
      error({
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Rate limit exceeded. Please try again later.',
        retryAfter: rateLimit.retryAfter,
      }),
      {
        status: 429,
        headers: {
          'Retry-After': String(rateLimit.retryAfter),
          'X-RateLimit-Limit': '100',
          'X-RateLimit-Remaining': String(rateLimit.remaining),
          'X-RateLimit-Reset': String(Math.ceil(rateLimit.resetTime / 1000)),
        },
      }
    );
    addCorsHeaders(response, request.headers.get('origin'));
    return response;
  }

  try {
    const { address } = await params;

    // Validate address format
    const validationResult = addressSchema.safeParse({ address });
    if (!validationResult.success) {
      RequestLogger.logSecurityEvent({
        type: 'invalid_input',
        path: request.nextUrl.pathname,
        ip: request.headers.get('x-forwarded-for') || 'unknown',
        details: { validationErrors: validationResult.error.issues },
      });
      const response = NextResponse.json(
        error(Errors.WALLET_REQUIRED()),
        { status: 400 }
      );
      addCorsHeaders(response, request.headers.get('origin'));
      return response;
    }

    const normalizedAddress = normalizeAddress(address as Address);

    try {

      // Get or create user and check for cached reputation
      const { getUserByAddress, createUser } = await import('@/lib/db/queries');
      let user = await getUserByAddress(normalizedAddress);
      
      if (!user) {
        user = await createUser(normalizedAddress);
      }

      const linkedWallets = user.wallets.map((w) => w.address);

      // Check if we should use cached data (based on query param and cache age)
      const useCache = request.nextUrl.searchParams.get('cache') !== 'false';
      const cacheMaxAgeMs = 5 * 60 * 1000; // 5 minutes
      
      if (useCache && user.reputation) {
        const cacheAge = Date.now() - user.reputation.lastCalculated.getTime();
        
        if (cacheAge < cacheMaxAgeMs) {
          // Return cached reputation data
          const response = NextResponse.json(success({
            address: normalizedAddress,
            totalScore: user.reputation.totalScore,
            tier: user.reputation.tier,
            metrics: [
              { name: 'Base Tenure', score: user.reputation.baseTenureScore, weight: 15, maxScore: 150 },
              { name: 'Zora Mints', score: user.reputation.zoraMintsScore, weight: 12, maxScore: 120 },
              { name: 'Timeliness', score: user.reputation.timelinessScore, weight: 8, maxScore: 80 },
              { name: 'Farcaster', score: user.reputation.farcasterScore, weight: 15, maxScore: 150 },
              { name: 'Builder', score: user.reputation.builderScore, weight: 20, maxScore: 200 },
              { name: 'Creator', score: user.reputation.creatorScore, weight: 10, maxScore: 100 },
              { name: 'Onchain Summer', score: user.reputation.onchainSummerScore, weight: 8, maxScore: 80 },
              { name: 'Hackathon', score: user.reputation.hackathonScore, weight: 7, maxScore: 70 },
              { name: 'Early Adopter', score: user.reputation.earlyAdopterScore, weight: 5, maxScore: 50 },
            ],
            lastCalculated: user.reputation.lastCalculated.toISOString(),
            cached: true,
          }));
          // Add rate limit headers
          response.headers.set('X-RateLimit-Limit', '100');
          response.headers.set('X-RateLimit-Remaining', String(rateLimit.remaining));
          response.headers.set('X-RateLimit-Reset', String(Math.ceil(rateLimit.resetTime / 1000)));
          addCorsHeaders(response, request.headers.get('origin'));
          return response;
        }
      }

      // Calculate reputation (will use transaction cache internally)
      const reputationData = await calculateReputation({
        address: normalizedAddress,
        linkedWallets,
      });

      // Persist reputation to database
      await upsertReputation(user.id, reputationData);
      
      const response = NextResponse.json(success({
        address: normalizedAddress,
        totalScore: reputationData.totalScore,
        tier: reputationData.tier,
        metrics: reputationData.metrics,
        lastCalculated: reputationData.lastCalculated.toISOString(),
      }));
      // Add rate limit headers
      response.headers.set('X-RateLimit-Limit', '100');
      response.headers.set('X-RateLimit-Remaining', String(rateLimit.remaining));
      response.headers.set('X-RateLimit-Reset', String(Math.ceil(rateLimit.resetTime / 1000)));
      addCorsHeaders(response, request.headers.get('origin'));
      return response;

    } catch (calcError) {
      RequestLogger.logError('Reputation calculation failed', calcError, {
        address: normalizedAddress,
        path: request.nextUrl.pathname,
      });
      const response = NextResponse.json(
        error(Errors.INTERNAL_SERVER_ERROR()),
        { status: 500 }
      );
      addCorsHeaders(response, request.headers.get('origin'));
      return response;
    }

  } catch (err) {
    RequestLogger.logError('Reputation endpoint error', err, {
      path: request.nextUrl.pathname,
    });
    const response = NextResponse.json(
      error(Errors.INTERNAL_SERVER_ERROR()),
      { status: 500 }
    );
    addCorsHeaders(response, request.headers.get('origin'));
    return response;
  }
}
