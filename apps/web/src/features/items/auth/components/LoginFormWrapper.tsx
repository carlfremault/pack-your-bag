import { AuthError } from 'next-auth';

import { signIn } from '@/lib/auth';

import LoginForm from './LoginForm';
import { loginSchema } from './schema';

export default function LoginFormWrapper() {
  const handleLogin = async (_prevState: unknown, formData: FormData) => {
    'use server';
    try {
      const parsed = loginSchema.safeParse({
        email: formData.get('email'),
        password: formData.get('password'),
      });

      if (!parsed.success) {
        return { error: parsed.error.issues.map((i) => i.message) };
      }

      await signIn('credentials', {
        email: parsed.data.email,
        password: parsed.data.password,

        redirectTo: '/items',
      });

      return null;
    } catch (e) {
      if (e instanceof AuthError) {
        return { error: (e as AuthError & { code?: string }).code ?? 'Something went wrong' };
      }
      throw e; // re-throw so redirect works
    }
  };

  return (
    <div className="w-full max-w-md">
      <LoginForm handleLogin={handleLogin} />
    </div>
  );
}
