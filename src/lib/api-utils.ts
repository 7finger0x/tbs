/**
 * API utility functions for standardized responses
 */

export class Errors {
  static WALLET_REQUIRED() {
    return {
      code: 'WALLET_REQUIRED',
      message: 'Valid Ethereum address is required',
    };
  }

  static INTERNAL_SERVER_ERROR() {
    return {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An internal server error occurred',
    };
  }

  static NOT_FOUND(resource?: string) {
    return {
      code: 'NOT_FOUND',
      message: resource ? `${resource} not found` : 'Resource not found',
    };
  }

  static INVALID_INPUT(message?: string) {
    return {
      code: 'INVALID_INPUT',
      message: message || 'Invalid input provided',
    };
  }
}

/**
 * Standard success response wrapper
 */
export function success<T>(data: T) {
  return {
    success: true,
    data,
  };
}

/**
 * Standard error response wrapper
 */
export function error(error: { code: string; message: string; retryAfter?: number }) {
  return {
    success: false,
    error,
  };
}
