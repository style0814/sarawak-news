import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { verifyUser, getUserById, consumeRateLimit } from './db';

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        username: { label: 'Username or Email', type: 'text' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials, request) {
        try {
          if (!credentials?.username || !credentials?.password) {
            return null;
          }

          const ip = request?.headers?.get?.('x-forwarded-for')?.split(',')[0]?.trim()
            || request?.headers?.get?.('x-real-ip')
            || request?.headers?.get?.('cf-connecting-ip')
            || 'unknown';
          const identifier = String(credentials.username).toLowerCase();

          const ipLimit = consumeRateLimit(`login-ip:${ip}`, 25, 15 * 60);
          if (!ipLimit.allowed) {
            return null;
          }
          const identifierLimit = consumeRateLimit(`login-id:${identifier}`, 10, 15 * 60);
          if (!identifierLimit.allowed) {
            return null;
          }

          const user = await verifyUser(
            credentials.username as string,
            credentials.password as string
          );

          if (!user) {
            return null;
          }

          return {
            id: String(user.id),
            name: user.display_name,
            email: user.email
          };
        } catch (error) {
          console.error('Auth error:', error);
          return null;
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      try {
        if (session.user && token.id) {
          session.user.id = token.id as string;
          // Get fresh user data
          const user = getUserById(parseInt(token.id as string, 10));
          if (user) {
            session.user.name = user.display_name;
          }
        }
      } catch (error) {
        console.error('Session callback error:', error);
      }
      return session;
    }
  },
  pages: {
    signIn: '/auth/login'
  },
  session: {
    strategy: 'jwt'
  },
  trustHost: true
});
