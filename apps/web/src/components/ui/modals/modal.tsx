import { createContext, useContext, useState } from 'react';
import { createPortal } from 'react-dom';
import { MdClose } from 'react-icons/md';

import Button from '@/components/ui/buttons/button';
import { ButtonColor, ButtonSize } from '@/types/ui-types';

// Modal Context

type ModalContextValue = {
  open: () => void;
  close: () => void;
  dialogEl: HTMLDialogElement | null;
  modalKey: number;
};

const ModalContext = createContext<ModalContextValue | null>(null);

const useModal = () => {
  const ctx = useContext(ModalContext);
  if (!ctx) throw new Error('Modal components must be used within <Modal.Root>');
  return ctx;
};

// Modal Root

function ModalRoot({ children }: { children: React.ReactNode }) {
  const [modalKey, setModalKey] = useState(0);

  const [dialogEl, setDialogEl] = useState<HTMLDialogElement | null>(null);

  const open = () => dialogEl?.showModal();
  const close = () => {
    dialogEl?.close();
  };
  const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    if (e.target === dialogEl) close();
  };
  const handleNativeClose = () => setModalKey((prev) => prev + 1);

  return (
    <ModalContext.Provider value={{ open, close, dialogEl, modalKey }}>
      {children}
      <dialog
        ref={setDialogEl}
        onClick={handleBackdropClick}
        onClose={handleNativeClose}
        className="m-auto w-1/2 max-w-xl rounded-lg p-8 shadow-lg backdrop:bg-black/40"
      />
    </ModalContext.Provider>
  );
}

// Modal Trigger

type TriggerProps = {
  children: React.ReactNode;
  color?: ButtonColor;
  size?: ButtonSize;
};

function ModalTrigger({ children, color = 'primary', size = 'medium' }: TriggerProps) {
  const { open } = useModal();

  return (
    <Button className="self-start" onClick={open} color={color} size={size}>
      {children}
    </Button>
  );
}

// Modal Content

type ContentProps = {
  title?: string;
  children: React.ReactNode | ((close: () => void) => React.ReactNode);
};

function ModalContent({ title, children }: ContentProps) {
  const { close, dialogEl, modalKey } = useModal();

  if (!dialogEl) return null;

  return createPortal(
    <div className="flex flex-col gap-4" key={modalKey}>
      <div className="flex w-full justify-between">
        {title && (
          <h2 id="modal-title" className="text-center text-2xl font-bold">
            {title}
          </h2>
        )}
        <Button className="ml-auto" onClick={close} color="transparent" aria-label="Close modal">
          <MdClose color="black" />
        </Button>
      </div>
      {typeof children === 'function' ? children(close) : children}
    </div>,
    dialogEl,
  );
}

export const Modal = {
  Root: ModalRoot,
  Trigger: ModalTrigger,
  Content: ModalContent,
};
