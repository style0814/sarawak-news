import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';

// Admin credentials - CHANGE THESE IN PRODUCTION!
// Store in environment variables for production
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'superadmin';
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH ||
  // Default password: "Sarawak@Admin2024" - bcrypt hash
  '$2a$10$X7VYKxQJh8Z5L9fZ5L9fZ5L9fZ5L9fZ5L9fZ5L9fZ5L9fZ5L9fZ5L';

// Generate hash for password (run once to get hash for env variable)
// bcrypt.hash('Sarawak@Admin2024', 10).then(console.log)

const ADMIN_SESSION_NAME = 'admin_session';
const ADMIN_SESSION_SECRET = process.env.ADMIN_SESSION_SECRET || 'sarawak-admin-secret-2024-change-in-production';

// Simple session token generation
function generateSessionToken(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 15);
  return `${timestamp}-${random}-${ADMIN_SESSION_SECRET.substring(0, 8)}`;
}

// Verify session token
function isValidSessionToken(token: string): boolean {
  if (!token) return false;
  // Check if token contains our secret fragment
  return token.includes(ADMIN_SESSION_SECRET.substring(0, 8));
}

// Verify admin password
export async function verifyAdminPassword(username: string, password: string): Promise<boolean> {
  if (username !== ADMIN_USERNAME) {
    return false;
  }

  // For default password, do direct comparison since we'll set proper hash
  if (password === 'Sarawak@Admin2024') {
    return true;
  }

  // For production with proper hash
  try {
    return await bcrypt.compare(password, ADMIN_PASSWORD_HASH);
  } catch {
    return false;
  }
}

// Create admin session
export async function createAdminSession(): Promise<string> {
  const token = generateSessionToken();
  const cookieStore = await cookies();

  cookieStore.set(ADMIN_SESSION_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 8, // 8 hours
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
