import NextAuth, { CredentialsSignin, type NextAuthResult } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';

class InvalidCredentialsError extends CredentialsSignin {
  constructor(message: string) {
    super(message);
    this.message = message;
    this.code = message;
  }
}

const result = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        let res: Response;
        try {
          res = await fetch(`${process.env.AUTH_SERVICE_URL}/auth/login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-bff-secret': process.env.BFF_SHARED_SECRET!,
            },

            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          });
        } catch {
          throw new InvalidCredentialsError('Authentication service unavailable');
        }

        const body = await res.json();

        if (!res.ok) throw new InvalidCredentialsError(body.message ?? 'Invalid email or password');

        return {
          id: body.user.id,
          accessToken: body.access_token,
          refreshToken: body.refresh_token,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.accessToken = user.accessToken;
        token.refreshToken = user.refreshToken;
      }
      return token;
    },
    session({ session, token }) {
      session.accessToken = token.accessToken as string;
      return session;
    },
  },
});

export const auth: NextAuthResult['auth'] = result.auth;
export const handlers: NextAuthResult['handlers'] = result.handlers;
export const signIn: NextAuthResult['signIn'] = result.signIn;
export const signOut: NextAuthResult['signOut'] = result.signOut;
