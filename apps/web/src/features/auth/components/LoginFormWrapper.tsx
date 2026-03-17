import { redirect } from 'next/navigation';

import { getSession } from '@/lib/session';

import LoginForm from './LoginForm';
import { loginSchema } from './schema';

export default function LoginFormWrapper() {
  const handleLogin = async (_prevState: unknown, formData: FormData) => {
    'use server';

    const parsed = loginSchema.safeParse({
      email: formData.get('email'),
      password: formData.get('password'),
    });

    if (!parsed.success) {
      return { error: parsed.error.issues.map((i) => i.message) };
    }

    let res: Response;
    try {
      res = await fetch(`${process.env.AUTH_SERVICE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-bff-secret': process.env.BFF_SHARED_SECRET!,
        },
        body: JSON.stringify({ email: parsed.data.email, password: parsed.data.password }),
      });
    } catch {
      return { error: 'Authentication service unavailable' };
    }

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return { error: (body.message as string | undefined) ?? 'Invalid email or password' };
    }

    const body = await res.json();

    const session = await getSession();
    session.isLoggedIn = true;
    session.userId = body.user.id as string;
    session.role = body.user.role as number;
    session.accessToken = body.access_token as string;
    session.refreshToken = body.refresh_token as string;
    session.accessTokenExpiresAt = Math.floor(Date.now() / 1000) + (body.expires_in as number);
    await session.save();

    redirect('/items');
  };

  return (
    <div className="w-full max-w-md">
      <LoginForm handleLogin={handleLogin} />
    </div>
  );
}
