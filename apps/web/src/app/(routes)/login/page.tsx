import LoginForm from '@/features/auth/components/LoginForm';

export default function Page() {
  return (
    <main className="flex h-full items-center justify-center">
      <div className="bg-surface border-primary-ring w-full max-w-md rounded-md border p-4 shadow-sm">
        <LoginForm />
      </div>
    </main>
  );
}
