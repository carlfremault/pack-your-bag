import { createContext, useCallback, useContext, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { MdClose } from 'react-icons/md';

import { Button, ButtonColor, ButtonSize, ButtonVariant } from '@repo/react-common/button';

import classNames from 'classnames';

// ------------------------------------------------------------
// Modal Context
// ------------------------------------------------------------

type ModalContextValue = {
  isOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
};

const ModalContext = createContext<ModalContextValue | null>(null);

const useModal = () => {
  const ctx = useContext(ModalContext);
  if (!ctx) throw new Error('Modal components must be used within <Modal.Root>');
  return ctx;
};

// ------------------------------------------------------------
// Modal Root
// ------------------------------------------------------------

type RootProps = {
  open?: boolean;
  onOpenChange?: (isOpen: boolean) => void;
  children: React.ReactNode;
};

function ModalRoot(props: RootProps) {
  const { open: controlledOpen, onOpenChange, children } = props;

  // State
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : uncontrolledOpen;

  // Ref to restore focus when the modal closes
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Actions
  const openModal = () => {
    if (isControlled) {
      onOpenChange?.(true);
      return;
    }
    setUncontrolledOpen(true);
  };

  const closeModal = useCallback(() => {
    if (isControlled) {
      onOpenChange?.(false);
      return;
    }
    setUncontrolledOpen(false);
  }, [isControlled, onOpenChange]);

  // Effects
  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeModal();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen, closeModal]);

  // Save focus target on open; restore it on close
  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement;
    } else {
      previousFocusRef.current?.focus();
      previousFocusRef.current = null;
    }
  }, [isOpen]);

  return (
    <ModalContext.Provider value={{ isOpen, openModal, closeModal }}>
      {children}
    </ModalContext.Provider>
  );
}

// ------------------------------------------------------------
// Modal Trigger
// ------------------------------------------------------------

type TriggerProps = {
  color?: ButtonColor;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  children: React.ReactNode;
};

function ModalTrigger(props: TriggerProps) {
  const { color = 'primary', variant = 'solid', size = 'medium', className, children } = props;

  const { openModal } = useModal();

  return (
    <Button className={className} onClick={openModal} color={color} variant={variant} size={size}>
      {children}
    </Button>
  );
}

// ------------------------------------------------------------
// Modal Content
// ------------------------------------------------------------

type ContentProps = {
  title?: string;
  titleColor?: 'primary' | 'danger';
  className?: string;
  ariaLabel?: string;
  role?: 'dialog' | 'alertdialog';
  ariaDescribedBy?: string;
  children: React.ReactNode | ((close: () => void) => React.ReactNode);
};

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function ModalContent(props: ContentProps) {
  const {
    title,
    titleColor = 'primary',
    className,
    ariaLabel = 'Modal dialog',
    role = 'dialog',
    ariaDescribedBy,
    children,
  } = props;

  const { isOpen, closeModal } = useModal();
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);

  // Initial focus + focus trap
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    // Move focus into the modal
    const firstFocusable = dialog.querySelector<HTMLElement>(FOCUSABLE);
    firstFocusable?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      const focusable = Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE));
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };

    dialog.addEventListener('keydown', onKeyDown);
    return () => dialog.removeEventListener('keydown', onKeyDown);
  }, []);

  if (!isOpen || typeof document === 'undefined') return null;

  const modalContentClassName = classNames(
    'bg-surface border-primary-ring flex max-h-full w-full max-w-lg flex-col overflow-hidden rounded-md border p-4 shadow-lg',
    className,
  );
  const titleClassName = classNames(
    'text-xl',
    titleColor === 'danger' ? 'text-danger' : 'text-primary',
  );

  return createPortal(
    <div
      className="bg-primary-ring/50 fixed inset-0 z-50 flex items-center justify-center px-4 py-16"
      onClick={(e) => {
        if (e.target === e.currentTarget) closeModal();
      }}
    >
      <div
        ref={dialogRef}
        className={modalContentClassName}
        role={role}
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-label={title ? undefined : ariaLabel}
        aria-describedby={ariaDescribedBy}
      >
        <div className="mb-4 flex w-full justify-between">
          {title && (
            <h2 id={titleId} className={titleClassName}>
              {title}
            </h2>
          )}
          <Button
            className="ml-auto"
            onClick={closeModal}
            color="primary"
            variant="unstyledIcon"
            aria-label="Close modal"
          >
            <MdClose size={24} />
          </Button>
        </div>
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
          {typeof children === 'function' ? children(closeModal) : children}
        </div>
      </div>
    </div>,
    document.body,
  );
}

export const Modal = {
  Root: ModalRoot,
  Trigger: ModalTrigger,
  Content: ModalContent,
};
