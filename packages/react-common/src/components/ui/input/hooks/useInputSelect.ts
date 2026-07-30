import { useEffect, useId, useRef, useState } from 'react';

export function useInputSelect() {
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const errorId = useId();
  const listboxId = useId();
  const buttonId = useId();
  const optionIdPrefix = useId();

  const close = () => {
    setIsOpen(false);
    setFocusedIndex(-1);
  };

  useEffect(() => {
    if (!isOpen) return;
    const handlePointerDown = (e: PointerEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        close();
      }
    };
    document.addEventListener('pointerdown', handlePointerDown, { capture: true });
    return () => document.removeEventListener('pointerdown', handlePointerDown, { capture: true });
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && focusedIndex >= 0) {
      const focusedElement = document.getElementById(`${optionIdPrefix}-${focusedIndex}`);
      focusedElement?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [isOpen, focusedIndex, optionIdPrefix]);

  return {
    isOpen,
    setIsOpen,
    focusedIndex,
    setFocusedIndex,
    wrapperRef,
    buttonRef,
    errorId,
    listboxId,
    buttonId,
    optionIdPrefix,
    close,
  };
}
