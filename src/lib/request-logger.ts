/**
 * Request logging utility for API endpoints
 */

interface SecurityEvent {
  type: string;
  path: string;
  ip: string;
  details?: Record<string, unknown>;
}

interface ErrorContext {
  [key: string]: unknown;
}

/**
 * Request logger for API endpoints
 */
export const RequestLogger = {
  logSecurityEvent(event: SecurityEvent): void {
    console.warn('[SECURITY]', {
      type: event.type,
      path: event.path,
      ip: event.ip,
      details: event.details,
      timestamp: new Date().toISOString(),
    });
  },

  logError(message: string, error: unknown, context?: ErrorContext): void {
    console.error('[ERROR]', {
      message,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      context,
      timestamp: new Date().toISOString(),
    });
  },

  logWarning(message: string, context?: ErrorContext): void {
    console.warn('[WARNING]', {
      message,
      context,
      timestamp: new Date().toISOString(),
    });
  },

  logInfo(message: string, context?: ErrorContext): void {
    console.log('[INFO]', {
      message,
      context,
      timestamp: new Date().toISOString(),
    });
  },
};
