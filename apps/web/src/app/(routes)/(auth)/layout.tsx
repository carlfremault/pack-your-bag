import { UnAuthenticatedHeader } from '@repo/react-common/header';

export default async function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex h-screen flex-col">
      <UnAuthenticatedHeader />
      <main className="flex min-h-0 flex-1 items-center justify-center">{children}</main>
    </div>
  );
}
