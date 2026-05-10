'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { MdOutlineClose } from 'react-icons/md';
import { usePathname } from 'next/navigation';

import { Button, FloatingActionButton } from '@repo/react-common/button';

import classNames from 'classnames';

import { PUBLIC_PATHS } from '@/lib/constants';

import ActionNavLinks from './ActionNavLinks';

export function MobileNavDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const pathname = usePathname();
  const isPublicPath = PUBLIC_PATHS.some((p) => pathname.startsWith(p));

  const open = () => {
    // Timeout could be pending when the user quickly re-opens the drawer
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setIsVisible(true);
    requestAnimationFrame(() => setIsOpen(true));
  };

  const close = useCallback(() => {
    setIsOpen(false);
    closeTimeoutRef.current = setTimeout(() => {
      setIsVisible(false);
      closeTimeoutRef.current = null;
    }, 300);
  }, []);

  useEffect(() => {
    // Timeout could be pending when the component unmounts
    return () => {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        close();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen, close]);

  const scrimClassName = classNames(
    'fixed inset-0 z-20 bg-primary-ring/50 transition-opacity duration-300',
    isOpen ? 'opacity-100' : 'opacity-0',
  );

  const drawerClassName = classNames(
    'bg-surface border-primary-ring fixed right-0 bottom-0 left-0 z-30 flex h-3/5 flex-col gap-4 rounded-t-2xl border-t p-4 shadow-xl transition-transform duration-300 ease-in-out',
    isOpen ? 'translate-y-0' : 'translate-y-full',
  );

  if (isPublicPath) {
    return null;
  }

  return (
    <>
      <FloatingActionButton onClick={open} />
      {isVisible ? (
        <>
          <div className={scrimClassName} onClick={close} aria-hidden="true" />
          <div role="dialog" aria-modal="true" className={drawerClassName}>
            <div className="flex justify-end">
              <Button variant="unstyledIcon" onClick={close} aria-label="Close drawer">
                <MdOutlineClose size={24} />
              </Button>
            </div>
            <div className="flex flex-col gap-4">
              <ActionNavLinks onNavigate={close} />
            </div>
          </div>
        </>
      ) : null}
    </>
  );
}
