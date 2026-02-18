import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'superadmin';
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH?.trim() || '';

const ADMIN_SESSION_NAME = 'admin_session';
const ADMIN_SESSION_SECRET = process.env.ADMIN_SESSION_SECRET?.trim() || process.env.AUTH_SECRET?.trim() || '';
const ADMIN_SESSION_MAX_AGE_SECONDS = 60 * 60 * 8; // 8 hours

function hasValidPasswordHash(): boolean {
  if (!ADMIN_PASSWORD_HASH || ADMIN_PASSWORD_HASH === 'your-bcrypt-hash-here') {
    return false;
  }
  return /^\$2[aby]\$\d{2}\$/.test(ADMIN_PASSWORD_HASH);
}

function hasValidSessionSecret(): boolean {
  return ADMIN_SESSION_SECRET.length >= 16;
}

// Simple session token generation
function generateSessionToken(): string {
  if (!hasValidSessionSecret()) {
    throw new Error('Admin session secret is not configured');
  }
  const timestampMs = Date.now();
  const nonce = crypto.randomBytes(16).toString('hex');
  const payload = `${timestampMs}.${nonce}`;
  const signature = crypto
    .createHmac('sha256', ADMIN_SESSION_SECRET)
    .update(payload)
    .digest('base64url');
  return `${payload}.${signature}`;
}

// Verify session token
function isValidSessionToken(token: string): boolean {
  if (!token || !hasValidSessionSecret()) return false;

  const lastDot = token.lastIndexOf('.');
  if (lastDot <= 0) return false;

  const payload = token.slice(0, lastDot);
  const signature = token.slice(lastDot + 1);
  if (!payload || !signature) return false;

  const expectedSignature = crypto
    .createHmac('sha256', ADMIN_SESSION_SECRET)
    .update(payload)
    .digest('base64url');

  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);
  if (actualBuffer.length !== expectedBuffer.length) return false;
  if (!crypto.timingSafeEqual(actualBuffer, expectedBuffer)) return false;

  const [timestampRaw] = payload.split('.');
  const timestampMs = Number(timestampRaw);
  if (!Number.isFinite(timestampMs)) return false;
  const ageMs = Date.now() - timestampMs;
  return ageMs >= 0 && ageMs <= ADMIN_SESSION_MAX_AGE_SECONDS * 1000;
}

// Verify admin password
export async function verifyAdminPassword(username: string, password: string): Promise<boolean> {
  if (!hasValidPasswordHash()) {
    return false;
  }

  if (username !== ADMIN_USERNAME) {
    return false;
  }

  try {
    return await bcrypt.compare(password, ADMIN_PASSWORD_HASH);
  } catch {
    return false;
  }
}

// Create admin session
export async function createAdminSession(): Promise<string> {
  if (!hasValidSessionSecret()) {
    throw new Error('Admin session secret is not configured');
  }

  const token = generateSessionToken();
  const cookieStore = await cookies();

  cookieStore.set(ADMIN_SESSION_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: ADMIN_SESSION_MAX_AGE_SECONDS,
    path: '/'
  });

  return token;
}

// Check admin session
export async function checkAdminSession(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(ADMIN_SESSION_NAME);

    if (!sessionCookie?.value) {
      return false;
    }

    return isValidSessionToken(sessionCookie.value);
  } catch {
    return false;
  }
}

// Clear admin session
export async function clearAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_SESSION_NAME);
}

// Get admin username for display
export function getAdminUsername(): string {
  return ADMIN_USERNAME;
}

export function isAdminAuthConfigured(): boolean {
  return hasValidPasswordHash() && hasValidSessionSecret();
}

// Get admin session info
export async function getAdminSession(): Promise<{ userId: number; username: string } | null> {
  const isAuthenticated = await checkAdminSession();
  if (!isAuthenticated) {
    return null;
  }
  // For simplified admin system, return userId 1 for the superadmin
  return {
    userId: 1,
    username: ADMIN_USERNAME
  };
}
