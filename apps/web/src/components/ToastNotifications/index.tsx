'use client';

import { Suspense, useEffect, useRef } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import { useBreakpoint } from '@repo/react-common/hooks';

import { SESSION_EXPIRED_MESSAGE } from '@/lib/constants';

function ToastTrigger() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const lastToastReasonRef = useRef<string | null>(null);

  useEffect(() => {
    const reason = searchParams.get('reason') ?? searchParams.get('toast');
    if (!reason || lastToastReasonRef.current === pathname + reason) return;

    if (reason === 'session_expired') {
      toast.error(SESSION_EXPIRED_MESSAGE);
      lastToastReasonRef.current = pathname + reason;
    } else {
      return;
    }

    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.delete('reason');
    nextParams.delete('toast');
    const nextQuery = nextParams.toString();

    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false });
  }, [pathname, router, searchParams]);

  return null;
}

export function ToastNotifications() {
  const { isDesktop } = useBreakpoint();
  const position = isDesktop ? 'bottom-center' : 'top-center';

  return (
    <>
      <Suspense fallback={null}>
        <ToastTrigger />
      </Suspense>
      <Toaster
        position={position}
        toastOptions={{
          success: {
            duration: 5000,
          },
          error: {
            duration: 6000,
          },
          style: { border: '1px solid var(--info-ring)' },
          ariaProps: {
            role: 'status',
            'aria-live': 'polite',
          },
        }}
        containerStyle={{ zIndex: 9999 }}
      />
    </>
  );
}
