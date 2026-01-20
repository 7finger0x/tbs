import { describe, it, expect, beforeEach, vi } from 'vitest';
import { checkRateLimit } from './rate-limit';
import type { NextRequest } from 'next/server';

// Mock NextRequest
function createMockRequest(ip?: string, forwardedFor?: string): NextRequest {
  const headers = new Headers();
  if (forwardedFor) {
    headers.set('x-forwarded-for', forwardedFor);
  }
  if (ip) {
    headers.set('x-real-ip', ip);
  }

  return {
    ip: ip || '127.0.0.1',
    headers,
    nextUrl: new URL('http://localhost/api/test'),
  } as unknown as NextRequest;
}

describe('checkRateLimit', () => {
  beforeEach(() => {
    // Clear rate limit store by accessing internal state
    // Note: In a real implementation, you might want to export a reset function
    vi.clearAllTimers();
  });

  it('should allow first request', () => {
    const request = createMockRequest();
    const result = checkRateLimit(request);

    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(99);
    expect(result.resetTime).toBeGreaterThan(Date.now());
  });

  it('should allow requests within limit', () => {
    const request = createMockRequest('127.0.0.1');

    // Make 50 requests
    for (let i = 0; i < 50; i++) {
      const result = checkRateLimit(request);
      expect(result.allowed).toBe(true);
    }

    // 51st request should still be allowed
    const result = checkRateLimit(request);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(49);
  });

  it('should reject requests exceeding limit', () => {
    const request = createMockRequest('127.0.0.2');

    // Make 100 requests (at limit)
    for (let i = 0; i < 100; i++) {
      checkRateLimit(request);
    }

    // 101st request should be rejected
    const result = checkRateLimit(request);
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
    expect(result.retryAfter).toBeDefined();
  });

  it('should use forwarded-for header when available', () => {
    const request = createMockRequest(undefined, '192.168.1.1, 10.0.0.1');
    const result1 = checkRateLimit(request);

    // Same forwarded-for should be rate limited together
    const request2 = createMockRequest(undefined, '192.168.1.1, 10.0.0.1');
    const result2 = checkRateLimit(request2);

    expect(result1.allowed).toBe(true);
    expect(result2.allowed).toBe(true);
    expect(result2.remaining).toBeLessThan(result1.remaining);
  });

  it('should use x-real-ip header when available', () => {
    const request = createMockRequest('192.168.1.2');
    const result = checkRateLimit(request);

    expect(result.allowed).toBe(true);
  });

  it('should track different IPs separately', () => {
    const request1 = createMockRequest('127.0.0.10');
    const request2 = createMockRequest('127.0.0.11');

    // Exhaust limit for first IP
    for (let i = 0; i < 100; i++) {
      checkRateLimit(request1);
    }

    // Second IP should still have full limit
    const result = checkRateLimit(request2);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(99);
  });
});
