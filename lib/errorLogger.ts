import { NextRequest } from 'next/server';
import { addErrorLog, ErrorLevel, ErrorType } from './db';
import * as Sentry from '@sentry/nextjs';

interface LogErrorOptions {
  level: ErrorLevel;
  type: ErrorType;
  message: string;
  error?: Error;
  endpoint?: string;
  userId?: number;
  request?: NextRequest;
}

/**
 * Core error logging function
 * Logs to both local database and Sentry (if configured)
 */
export function logError(options: LogErrorOptions): void {
  const { level, type, message, error, endpoint, userId, request } = options;

  // Extract request info if available
  let ipAddress: string | undefined;
  let userAgent: string | undefined;
  let requestBody: string | undefined;

  if (request) {
    ipAddress = request.headers.get('x-forwarded-for') ||
                request.headers.get('x-real-ip') ||
                'unknown';
    userAgent = request.headers.get('user-agent') || undefined;
  }

  // Log to local database
  try {
    addErrorLog({
      level,
      type,
      message,
      stackTrace: error?.stack,
      endpoint,
      userId,
      ipAddress,
      userAgent,
      requestBody
    });
  } catch (dbError) {
    // If database logging fails, at least log to console
    console.error('Failed to log error to database:', dbError);
    console.error('Original error:', { level, type, message, error });
  }

  // Log to Sentry if configured
  if (process.env.SENTRY_DSN) {
    const sentryLevel = level === 'error' ? 'error' : level === 'warning' ? 'warning' : 'info';

    Sentry.withScope((scope) => {
      scope.setLevel(sentryLevel);
      scope.setTag('error_type', type);
      scope.setTag('endpoint', endpoint || 'unknown');

      if (userId) {
        scope.setUser({ id: userId.toString() });
      }

      if (ipAddress) {
        scope.setExtra('ip_address', ipAddress);
      }

      if (userAgent) {
        scope.setExtra('user_agent', userAgent);
      }

      if (error) {
        Sentry.captureException(error);
      } else {
        Sentry.captureMessage(message, sentryLevel);
      }
    });
  }

  // Also log to console for development
  const logMethod = level === 'error' ? console.error : level === 'warning' ? console.warn : console.info;
  logMethod(`[${type.toUpperCase()}] ${message}`, error?.stack || '');
}

/**
 * Convenience function for API errors
 */
export function logApiError(
  endpoint: string,
  error: Error,
  request?: NextRequest,
  userId?: number
): void {
  logError({
    level: 'error',
    type: 'api',
    message: error.message || 'API Error',
    error,
    endpoint,
    userId,
    request
  });
}

/**
 * Convenience function for database errors
 */
export function logDbError(operation: string, error: Error): void {
  logError({
    level: 'error',
    type: 'database',
    message: `Database error during ${operation}: ${error.message}`,
    error
  });
}

/**
 * Convenience function for authentication errors
 */
export function logAuthError(
  message: string,
  userId?: number,
  request?: NextRequest
): void {
  logError({
    level: 'warning',
    type: 'auth',
    message,
    userId,
    request
  });
}

/**
 * Convenience function for RSS/feed errors
 */
export function logRssError(
  feedName: string,
  error: Error
): void {
  logError({
    level: 'warning',
    type: 'rss',
    message: `RSS feed error for ${feedName}: ${error.message}`,
    error
  });
}

/**
 * Convenience function for validation errors
 */
export function logValidationError(
  message: string,
  endpoint?: string,
  request?: NextRequest
): void {
  logError({
    level: 'info',
    type: 'validation',
    message,
    endpoint,
    request
  });
}

/**
 * Convenience function for general warnings
 */
export function logWarning(
  message: string,
  type: ErrorType = 'other'
): void {
  logError({
    level: 'warning',
    type,
    message
  });
}

/**
 * Convenience function for info logs
 */
export function logInfo(
  message: string,
  type: ErrorType = 'other'
): void {
  logError({
    level: 'info',
    type,
    message
  });
}
