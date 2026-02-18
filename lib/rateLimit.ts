import { consumeRateLimit, RateLimitResult } from './db';

function normalizeIp(ip: string | null | undefined): string {
  if (!ip) return 'unknown';
  const first = ip.split(',')[0]?.trim();
  return first || 'unknown';
}

export function getClientIp(request: Request): string {
  return normalizeIp(
    request.headers.get('x-forwarded-for')
    || request.headers.get('x-real-ip')
    || request.headers.get('cf-connecting-ip')
  );
}

export function rateLimitByIp(
  request: Request,
  scope: string,
  limit: number,
  windowSeconds: number
): RateLimitResult {
  const ip = getClientIp(request);
  return consumeRateLimit(`ip:${scope}:${ip}`, limit, windowSeconds);
}

export function rateLimitByKey(
  scope: string,
  key: string,
  limit: number,
  windowSeconds: number
): RateLimitResult {
  return consumeRateLimit(`key:${scope}:${key.toLowerCase()}`, limit, windowSeconds);
}
