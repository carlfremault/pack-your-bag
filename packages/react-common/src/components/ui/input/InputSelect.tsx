import { useEffect, useId, useRef, useState } from 'react';
import { MdClose, MdExpandMore } from 'react-icons/md';

import classNames from 'classnames';

import {
  inputFieldClassName,
  inputLabelClassName,
  inputRequiredClassName,
  inputWrapperClassName,
} from './Input';

export interface InputSelectOption<T = string> {
  label: string | React.ReactNode;
  value: T;
}

export interface InputSelectProps<T = string> {
  label: string;
  options: InputSelectOption<T>[];
  value: T;
  onChange: (value: T) => void;
  placeholder?: string;
  errorMessage?: string;
  required?: boolean;
  disabled?: boolean;
  isClearable?: boolean;
  clearValue?: T;
}

export function InputSelect<T = string>(props: InputSelectProps<T>) {
  const {
    label,
    options,
    value,
    onChange,
    placeholder = 'Select an option',
    errorMessage,
    required = false,
    disabled = false,
    isClearable = false,
    clearValue = '' as T,
  } = props;

  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const errorId = useId();
  const listboxId = useId();
  const buttonId = useId();
  const optionIdPrefix = useId();

  const selectedOption = options.find((o) => o.value === value);

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

  const handleSelect = (optionValue: T) => {
    onChange(optionValue);
    close();
    buttonRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setIsOpen(true);
        setFocusedIndex(0);
      }
      return;
    }
    if (e.key === 'Escape') {
      close();
      buttonRef.current?.focus();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedIndex((i) => Math.min(i + 1, options.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedIndex((i) => Math.max(i - 1, 0));
    } else if (
      (e.key === 'Enter' || e.key === ' ') &&
      focusedIndex >= 0 &&
      focusedIndex < options.length
    ) {
      e.preventDefault();
      handleSelect(options[focusedIndex]!.value);
    }
  };

  return (
    <div className={inputWrapperClassName}>
      <div className={inputLabelClassName}>
        <label htmlFor={buttonId}>
          <span>
            {label}
            {required && (
              <span className={inputRequiredClassName} aria-hidden="true">
                *
              </span>
            )}
          </span>
          {required && <span className="sr-only">(required)</span>}
        </label>
      </div>
      <div ref={wrapperRef} className="relative" onKeyDown={handleKeyDown}>
        <button
          ref={buttonRef}
          id={buttonId}
          type="button"
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-controls={listboxId}
          aria-activedescendant={
            isOpen && focusedIndex >= 0 ? `${optionIdPrefix}-${focusedIndex}` : undefined
          }
          aria-invalid={!!errorMessage}
          aria-describedby={errorMessage ? errorId : undefined}
          disabled={disabled}
          onClick={() => setIsOpen((o) => !o)}
          className={classNames(
            inputFieldClassName,
            'grid w-full grid-cols-[1fr_auto] items-center text-left',
            !selectedOption && 'text-primary/50',
          )}
        >
          <span
            className={classNames(
              'min-w-0 truncate',
              isClearable && selectedOption && !disabled ? 'mr-8' : 'mr-1',
            )}
          >
            {selectedOption?.label ?? placeholder}
          </span>
          <MdExpandMore className="h-4 w-4 shrink-0 opacity-60" />
        </button>
        {selectedOption && !disabled && isClearable && (
          <button
            type="button"
            aria-label="Clear selection"
            className="text-primary/40 hover:text-primary absolute inset-y-0 right-8 flex items-center px-1"
            onClick={() => {
              onChange(clearValue);
              buttonRef.current?.focus();
            }}
          >
            <MdClose className="h-4 w-4" />
          </button>
        )}
        {isOpen && (
          <ul
            id={listboxId}
            role="listbox"
            className="bg-surface border-primary-ring absolute z-20 mt-1 max-h-60 w-full overflow-y-auto rounded-md border shadow-md"
          >
            {options.map((option, index) => (
              <li
                key={option.value as string}
                id={`${optionIdPrefix}-${index}`}
                role="option"
                aria-selected={option.value === value}
                onClick={() => handleSelect(option.value)}
                className={classNames(
                  'text-primary cursor-default px-3 py-2 text-sm',
                  index === focusedIndex ? 'bg-surface-overlay/70' : 'hover:bg-surface-overlay/70',
                )}
              >
                {option.label}
              </li>
            ))}
          </ul>
        )}
      </div>
      {errorMessage && (
        <div id={errorId} className="text-danger text-xs">
          {errorMessage}
        </div>
      )}
    </div>
  );
}
