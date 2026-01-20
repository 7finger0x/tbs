/**
 * Production-ready logger with environment-based log levels
 * Centralizes all logging to allow for easier debugging and monitoring
 */

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
}

const LOG_LEVEL = process.env.NODE_ENV === 'production' ? LogLevel.WARN : LogLevel.DEBUG;

interface LogContext {
  [key: string]: unknown;
}

interface SecurityEvent {
  type: string;
  path?: string;
  ip?: string;
  details?: Record<string, unknown>;
}

class Logger {
  private shouldLog(level: LogLevel): boolean {
    return level <= LOG_LEVEL;
  }

  private formatMessage(level: string, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` ${JSON.stringify(context)}` : '';
    return `[${timestamp}] [${level}] ${message}${contextStr}`;
  }

  error(message: string, error?: unknown, context?: LogContext): void {
    if (!this.shouldLog(LogLevel.ERROR)) return;

    const errorDetails = error instanceof Error
      ? { message: error.message, stack: error.stack }
      : { error: String(error) };

    // In production, you might want to send this to a logging service
    console.error(this.formatMessage('ERROR', message, { ...context, ...errorDetails }));
  }

  warn(message: string, context?: LogContext): void {
    if (!this.shouldLog(LogLevel.WARN)) return;
    console.warn(this.formatMessage('WARN', message, context));
  }

  info(message: string, context?: LogContext): void {
    if (!this.shouldLog(LogLevel.INFO)) return;
    console.log(this.formatMessage('INFO', message, context));
  }

  debug(message: string, context?: LogContext): void {
    if (!this.shouldLog(LogLevel.DEBUG)) return;
    console.log(this.formatMessage('DEBUG', message, context));
  }

  security(event: SecurityEvent): void {
    // Security events are always logged regardless of level
    console.warn(this.formatMessage('SECURITY', event.type, {
      path: event.path,
      ip: event.ip,
      details: event.details,
    }));
  }
}

export const logger = new Logger();
