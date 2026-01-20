import 'server-only';
import type { NextRequest } from 'next/server';

/**
 * Rate Limiting Utility
 * Implements sliding window rate limiting (100 requests per minute per IP)
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory store for rate limiting
// In production, consider using Redis or similar for distributed systems
const rateLimitStore = new Map<string, RateLimitEntry>();

// Configuration
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 100; // 100 requests per minute

/**
 * Get client identifier (IP address)
 * Handles proxy headers for production environments
 */
function getClientIdentifier(request: NextRequest): string {
  // Check for forwarded IP (when behind proxy/load balancer)
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    // Take the first IP if multiple are present
    return forwardedFor.split(',')[0]?.trim() || 'unknown';
  }

  // Check for real IP
  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  // Fallback to connection IP (may not work in serverless)
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
}

/**
 * Clean up expired entries from the rate limit store
 * Runs periodically to prevent memory leaks
 */
function cleanupExpiredEntries(): void {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}

// Cleanup every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupExpiredEntries, 5 * 60 * 1000);
}

/**
 * Check if request is within rate limit
 * @returns Object with allowed status, remaining requests, and reset time
 */
export function checkRateLimit(request: NextRequest): {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
} {
  const clientId = getClientIdentifier(request);
  const now = Date.now();

  // Cleanup expired entries occasionally (10% chance to avoid overhead)
  if (Math.random() < 0.1) {
    cleanupExpiredEntries();
  }

  const entry = rateLimitStore.get(clientId);

  if (!entry || entry.resetTime < now) {
    // Create new entry or reset expired entry
    const resetTime = now + RATE_LIMIT_WINDOW_MS;
    rateLimitStore.set(clientId, {
      count: 1,
      resetTime,
    });

    return {
      allowed: true,
      remaining: RATE_LIMIT_MAX_REQUESTS - 1,
      resetTime,
    };
  }

  // Entry exists and is within window
  if (entry.count >= RATE_LIMIT_MAX_REQUESTS) {
    // Rate limit exceeded
    const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
    return {
      allowed: false,
      remaining: 0,
      resetTime: entry.resetTime,
      retryAfter,
    };
  }

  // Increment count
  entry.count++;
  rateLimitStore.set(clientId, entry);

  return {
    allowed: true,
    remaining: RATE_LIMIT_MAX_REQUESTS - entry.count,
    resetTime: entry.resetTime,
  };
}

/**
 * Rate limit middleware for API routes
 * Returns error response if rate limit exceeded
 */
export function withRateLimit(
  handler: (request: NextRequest, ...args: unknown[]) => Promise<Response>
) {
  return async (request: NextRequest, ...args: unknown[]): Promise<Response> => {
    const rateLimit = checkRateLimit(request);

    if (!rateLimit.allowed) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Rate limit exceeded. Please try again later.',
          retryAfter: rateLimit.retryAfter,
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': String(rateLimit.retryAfter),
            'X-RateLimit-Limit': String(RATE_LIMIT_MAX_REQUESTS),
            'X-RateLimit-Remaining': String(rateLimit.remaining),
            'X-RateLimit-Reset': String(Math.ceil(rateLimit.resetTime / 1000)),
          },
        }
      );
    }

    // Call the handler and add rate limit headers to response
    const response = await handler(request, ...args);

    // Add rate limit headers to successful responses
    if (response instanceof Response) {
      response.headers.set('X-RateLimit-Limit', String(RATE_LIMIT_MAX_REQUESTS));
      response.headers.set('X-RateLimit-Remaining', String(rateLimit.remaining));
      response.headers.set(
        'X-RateLimit-Reset',
        String(Math.ceil(rateLimit.resetTime / 1000))
      );
    }

    return response;
  };
}
