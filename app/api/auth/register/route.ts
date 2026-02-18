import { NextRequest, NextResponse } from 'next/server';
import { createUser } from '@/lib/db';
import { rateLimitByIp, rateLimitByKey } from '@/lib/rateLimit';

// Input validation
function validateInput(data: { username: string; email: string; password: string; display_name: string }) {
  const errors: string[] = [];

  // Username: 3-20 chars, alphanumeric and underscores only
  if (!/^[a-zA-Z0-9_]{3,20}$/.test(data.username)) {
    errors.push('Username must be 3-20 characters, alphanumeric and underscores only');
  }

  // Email validation
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.push('Invalid email format');
  }

  // Password: minimum 6 characters
  if (data.password.length < 6) {
    errors.push('Password must be at least 6 characters');
  }

  // Display name: 2-50 chars
  if (data.display_name.length < 2 || data.display_name.length > 50) {
    errors.push('Display name must be 2-50 characters');
  }

  return errors;
}

// Sanitize input to prevent XSS
function sanitize(str: string): string {
  return str
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .trim();
}

export async function POST(request: NextRequest) {
  try {
    const ipLimit = rateLimitByIp(request, 'register', 10, 15 * 60);
    if (!ipLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many registration attempts. Please try again later.' },
        { status: 429, headers: { 'Retry-After': String(ipLimit.retryAfter) } }
      );
    }

    const body = await request.json();
    const { username, email, password, display_name } = body;

    if (!username || !email || !password || !display_name) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Validate input
    const errors = validateInput({ username, email, password, display_name });
    if (errors.length > 0) {
      return NextResponse.json(
        { error: errors.join(', ') },
        { status: 400 }
      );
    }

    const emailLimit = rateLimitByKey('register-email', email, 3, 60 * 60);
    if (!emailLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many attempts for this email. Please try again later.' },
        { status: 429, headers: { 'Retry-After': String(emailLimit.retryAfter) } }
      );
    }

    const usernameLimit = rateLimitByKey('register-username', username, 3, 60 * 60);
    if (!usernameLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many attempts for this username. Please try again later.' },
        { status: 429, headers: { 'Retry-After': String(usernameLimit.retryAfter) } }
      );
    }

    // Create user with sanitized display name
    const user = await createUser({
      username: username.toLowerCase(),
      email: email.toLowerCase(),
      password,
      display_name: sanitize(display_name)
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Username or email already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        display_name: user.display_name
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Registration failed' },
      { status: 500 }
    );
  }
}
