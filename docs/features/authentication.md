# User Authentication

## Overview

Sarawak News uses **NextAuth.js (Auth.js v5)** for user authentication. Users can register and login with username/password credentials.

## Features

- Username/password registration
- Secure login with bcrypt password hashing
- Session management with JWT
- Protected routes and actions
- User profile display

## Pages

| Route | Purpose |
|-------|---------|
| `/auth/login` | User login form |
| `/auth/register` | User registration form |

## How It Works

### Registration Flow

```
1. User fills registration form
   │
2. POST /api/auth/register
   │
3. Validate username & password
   │
4. Hash password with bcrypt
   │
5. Insert into users table
   │
6. Redirect to login page
```

### Login Flow

```
1. User enters credentials
   │
2. NextAuth handles /api/auth/signin
   │
3. CredentialsProvider validates
   │
   ├── Fetch user by username
   ├── Compare password with bcrypt
   └── Return user object or null
   │
4. Create JWT session
   │
5. Set session cookie
   │
6. Redirect to home page
```

## Configuration

### NextAuth Setup

**File:** `lib/auth.ts`

```typescript
import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        // Validate credentials
        const user = getUserByUsername(credentials.username);
        if (!user) return null;

        const valid = await bcrypt.compare(
          credentials.password,
          user.password_hash
        );
        if (!valid) return null;

        return {
          id: user.id.toString(),
          name: user.display_name,
          email: user.email
        };
      }
    })
  ],
  pages: {
    signIn: '/auth/login'  // Custom login page
  },
  callbacks: {
    session({ session, token }) {
      if (token?.sub) {
        session.user.id = token.sub;
      }
      return session;
    }
  }
});
```

### Environment Variables

Required in `.env.local`:

```
AUTH_SECRET=your-random-secret-at-least-32-characters
```

Generate with:
```bash
openssl rand -base64 32
```

## Database Schema

**File:** `lib/db.ts`

```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  display_name TEXT NOT NULL,
  is_admin INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

## Using Authentication

### Check Session (Server Component)

```typescript
import { auth } from '@/lib/auth';

export default async function Page() {
  const session = await auth();

  if (!session) {
    return <p>Please login</p>;
  }

  return <p>Welcome, {session.user.name}!</p>;
}
```

### Check Session (Client Component)

```typescript
'use client';
import { useSession } from 'next-auth/react';

export default function Component() {
  const { data: session, status } = useSession();

  if (status === 'loading') return <p>Loading...</p>;
  if (!session) return <p>Not logged in</p>;

  return <p>Welcome, {session.user.name}!</p>;
}
```

### Protect API Routes

```typescript
import { auth } from '@/lib/auth';

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // User is authenticated
  const userId = session.user.id;
  // ... handle request
}
```

### Sign In/Out

```typescript
import { signIn, signOut } from 'next-auth/react';

// Login
await signIn('credentials', {
  username: 'john',
  password: 'secret',
  redirectTo: '/'
});

// Logout
await signOut({ redirectTo: '/' });
```

## Session Provider

Wrap your app with SessionProvider for client-side session access:

**File:** `components/Providers.tsx`

```typescript
'use client';
import { SessionProvider } from 'next-auth/react';

export function Providers({ children }) {
  return (
    <SessionProvider>
      {children}
    </SessionProvider>
  );
}
```

**File:** `app/layout.tsx`

```typescript
import { Providers } from '@/components/Providers';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

## Protected Actions

Some actions require authentication:

| Action | Auth Required |
|--------|---------------|
| View news | No |
| Click article | No |
| Add comment | Yes |
| Like comment | Yes |
| Save bookmark | Yes |

## Security Considerations

1. **Password hashing:** Uses bcrypt with salt rounds
2. **Session tokens:** JWT with configurable expiry
3. **CSRF protection:** Built into NextAuth
4. **Secure cookies:** httpOnly, secure flags
5. **Rate limiting:** Consider adding for login attempts

## Difference from Admin Auth

| Feature | User Auth (NextAuth) | Admin Auth (Custom) |
|---------|---------------------|---------------------|
| Purpose | Regular users | Administrators |
| Method | OAuth + Credentials | Username/password only |
| Session | JWT in cookie | Simple token in cookie |
| Database | users table | Environment variables |
| URL | /auth/login | /admin/login |
