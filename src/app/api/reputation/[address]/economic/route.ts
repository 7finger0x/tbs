import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { Errors, success, error } from '@/lib/api-utils';
import { addCorsHeaders } from '@/lib/cors';
import { RequestLogger } from '@/lib/request-logger';
import { getEconomicVector, getDefiMetrics } from '@/lib/db/queries';
import { normalizeAddress } from '@/lib/utils';
import { calculateReputation } from '@/lib/scoring/calculator';
import { checkRateLimit } from '@/lib/rate-limit';
import type { Address } from 'viem';

const addressSchema = z.object({
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address'),
});

/**
 * GET /api/reputation/[address]/economic
 * 
 * Returns detailed economic vector breakdown for an address
 * Includes DeFi metrics, protocol diversity, and capital efficiency data
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
      // Check database for cached economic vector
      const cachedVector = await getEconomicVector(normalizedAddress);
      const defiMetrics = await getDefiMetrics(normalizedAddress);

      // Calculate cache age
      const cacheAge = cachedVector ? Date.now() - cachedVector.calculatedAt.getTime() : Infinity;
      const oneHour = 3600000;
      
      if (cachedVector && cacheAge < oneHour) {

        if (cacheAge < oneHour) {
          // Return cached data
          const response = NextResponse.json(success({
            address: normalizedAddress,
            capitalPillar: cachedVector.capitalPillar,
            diversityPillar: cachedVector.diversityPillar,
            identityPillar: cachedVector.identityPillar,
            totalScore: cachedVector.totalScore,
            multiplier: cachedVector.multiplier,
            breakdown: JSON.parse(cachedVector.breakdown),
            defiMetrics: defiMetrics ? {
              uniqueProtocols: defiMetrics.uniqueProtocols,
              vintageContracts: defiMetrics.vintageContracts,
              protocolCategories: defiMetrics.protocolCategories,
              totalInteractions: defiMetrics.totalInteractions,
              gasUsedETH: defiMetrics.gasUsedETH,
              volumeUSD: defiMetrics.volumeUSD,
              liquidityDurationDays: defiMetrics.liquidityDurationDays,
              liquidityPositions: defiMetrics.liquidityPositions,
              lendingUtilization: defiMetrics.lendingUtilization,
              capitalTier: defiMetrics.capitalTier,
            } : null,
            cached: true,
            calculatedAt: cachedVector.calculatedAt.toISOString(),
          }));
          // Add rate limit headers
          response.headers.set('X-RateLimit-Limit', '100');
          response.headers.set('X-RateLimit-Remaining', String(rateLimit.remaining));
          response.headers.set('X-RateLimit-Reset', String(Math.ceil(rateLimit.resetTime / 1000)));
          addCorsHeaders(response, request.headers.get('origin'));
          return response;
        }
      }

      // If no cache or cache expired, trigger recalculation
      if (!cachedVector || cacheAge >= 3600000) {
        try {
          // Get linked wallets if user exists
          let linkedWallets: string[] = [];
          try {
            const { getUserByAddress } = await import('@/lib/db/queries');
            const user = await getUserByAddress(normalizedAddress);
            if (user?.wallets) {
              linkedWallets = user.wallets.map((w) => w.address);
            }
          } catch (error) {
            // If user lookup fails, continue with empty linked wallets
            console.error('Error fetching linked wallets:', error);
          }
          
          // Trigger reputation calculation which will persist economic vector
          await calculateReputation({
            address: normalizedAddress,
            linkedWallets,
          });
          
          // Fetch updated economic vector
          const updatedVector = await getEconomicVector(normalizedAddress);
          const updatedDefiMetrics = await getDefiMetrics(normalizedAddress);
          
          if (updatedVector) {
            const response = NextResponse.json(success({
              address: normalizedAddress,
              capitalPillar: updatedVector.capitalPillar,
              diversityPillar: updatedVector.diversityPillar,
              identityPillar: updatedVector.identityPillar,
              totalScore: updatedVector.totalScore,
              multiplier: updatedVector.multiplier,
              breakdown: JSON.parse(updatedVector.breakdown),
              defiMetrics: updatedDefiMetrics ? {
                uniqueProtocols: updatedDefiMetrics.uniqueProtocols,
                vintageContracts: updatedDefiMetrics.vintageContracts,
                protocolCategories: updatedDefiMetrics.protocolCategories,
                totalInteractions: updatedDefiMetrics.totalInteractions,
                gasUsedETH: updatedDefiMetrics.gasUsedETH,
                volumeUSD: updatedDefiMetrics.volumeUSD,
                liquidityDurationDays: updatedDefiMetrics.liquidityDurationDays,
                liquidityPositions: updatedDefiMetrics.liquidityPositions,
                lendingUtilization: updatedDefiMetrics.lendingUtilization,
                capitalTier: updatedDefiMetrics.capitalTier,
              } : null,
              cached: false,
              calculatedAt: updatedVector.calculatedAt.toISOString(),
              note: 'Recalculated on demand',
            }));
            // Add rate limit headers
            response.headers.set('X-RateLimit-Limit', '100');
            response.headers.set('X-RateLimit-Remaining', String(rateLimit.remaining));
            response.headers.set('X-RateLimit-Reset', String(Math.ceil(rateLimit.resetTime / 1000)));
            addCorsHeaders(response, request.headers.get('origin'));
            return response;
          }
        } catch (calcError) {
          RequestLogger.logError('Failed to recalculate economic vector', calcError, {
            address: normalizedAddress,
          });
          // Fall through to return cached data or empty response
        }
      }

      // Return cached data if available, otherwise return empty
      const response = NextResponse.json(success({
        address: normalizedAddress,
        capitalPillar: cachedVector?.capitalPillar ?? 0,
        diversityPillar: cachedVector?.diversityPillar ?? 0,
        identityPillar: cachedVector?.identityPillar ?? 0,
        totalScore: cachedVector?.totalScore ?? 0,
        multiplier: cachedVector?.multiplier ?? 1.0,
        breakdown: cachedVector ? JSON.parse(cachedVector.breakdown) : {},
        defiMetrics: defiMetrics ? {
          uniqueProtocols: defiMetrics.uniqueProtocols,
          vintageContracts: defiMetrics.vintageContracts,
          protocolCategories: defiMetrics.protocolCategories,
          totalInteractions: defiMetrics.totalInteractions,
          gasUsedETH: defiMetrics.gasUsedETH,
          volumeUSD: defiMetrics.volumeUSD,
          liquidityDurationDays: defiMetrics.liquidityDurationDays,
          liquidityPositions: defiMetrics.liquidityPositions,
          lendingUtilization: defiMetrics.lendingUtilization,
          capitalTier: defiMetrics.capitalTier,
        } : null,
        cached: !!cachedVector,
        calculatedAt: cachedVector?.calculatedAt.toISOString() ?? new Date().toISOString(),
        note: cachedVector ? 'Using expired cache' : 'No data available',
      }));
      // Add rate limit headers
      response.headers.set('X-RateLimit-Limit', '100');
      response.headers.set('X-RateLimit-Remaining', String(rateLimit.remaining));
      response.headers.set('X-RateLimit-Reset', String(Math.ceil(rateLimit.resetTime / 1000)));
      addCorsHeaders(response, request.headers.get('origin'));
      return response;

    } catch (calcError) {
      RequestLogger.logError('Economic vector retrieval failed', calcError, {
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
    RequestLogger.logError('Economic endpoint error', err, {
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
