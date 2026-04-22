'use client';

import { createContext, useContext, useState } from 'react';
import { createPortal } from 'react-dom';

// ------------------------------------------------------------
// Sidebar Context
// ------------------------------------------------------------

type SidebarContextValue = {
  target: HTMLDivElement | null;
  setTarget: (node: HTMLDivElement | null) => void;
};

const SidebarPortalContext = createContext<SidebarContextValue | null>(null);

const useSidebar = () => {
  const ctx = useContext(SidebarPortalContext);
  if (!ctx) throw new Error('Sidebar components must be used within <Sidebar.Root>');
  return ctx;
};

// ------------------------------------------------------------
// Sidebar Root
// ------------------------------------------------------------

export const SidebarProvider = ({ children }: { children: React.ReactNode }) => {
  const [target, setTarget] = useState<HTMLDivElement | null>(null);

  return (
    <SidebarPortalContext.Provider value={{ target, setTarget }}>
      {children}
    </SidebarPortalContext.Provider>
  );
};

// ------------------------------------------------------------
// Sidebar Slot
// ------------------------------------------------------------

export const SidebarSlot = () => {
  const { setTarget } = useSidebar();
  return <div ref={setTarget} className="w-full" />;
};

// ------------------------------------------------------------
// Sidebar Portal
// ------------------------------------------------------------

export const SidebarPortal = ({ children }: { children: React.ReactNode }) => {
  const { target } = useSidebar();
  if (!target) return null;
  return createPortal(children, target);
};
