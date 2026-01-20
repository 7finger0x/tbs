import type { NextResponse } from 'next/server';

/**
 * Add CORS headers to API response
 */
export function addCorsHeaders(
  response: NextResponse,
  origin: string | null
): NextResponse {
  // Allow requests from same origin or configured origins
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['*'];
  const originHeader = origin || '*';
  
  const allowedOrigin = 
    allowedOrigins.includes('*') || allowedOrigins.includes(originHeader)
      ? originHeader
      : allowedOrigins[0] || '*';

  response.headers.set('Access-Control-Allow-Origin', allowedOrigin);
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  response.headers.set('Access-Control-Max-Age', '86400');

  return response;
}
