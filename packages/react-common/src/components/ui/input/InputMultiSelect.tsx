import { useRef } from 'react';
import { MdCheck, MdClose, MdExpandMore } from 'react-icons/md';

import classNames from 'classnames';

import { useInputSelect } from './hooks/useInputSelect';
import {
  inputFieldClassName,
  inputLabelClassName,
  inputRequiredClassName,
  inputWrapperClassName,
} from './Input';

export interface InputMultiSelectOption<T = string> {
  label: string | React.ReactNode;
  value: T;
}

export interface InputMultiSelectProps<T = string> {
  label: string;
  options: InputMultiSelectOption<T>[];
  value: T[];
  onChange: (value: T[]) => void;
  placeholder?: string;
  errorMessage?: string;
  required?: boolean;
  disabled?: boolean;
  isClearable?: boolean;
}

export function InputMultiSelect<T = string>(props: InputMultiSelectProps<T>) {
  const {
    label,
    options,
    value,
    onChange,
    placeholder = 'Select options',
    errorMessage,
    required = false,
    disabled = false,
    isClearable = false,
  } = props;

  const {
    isOpen,
    setIsOpen,
    focusedIndex,
    setFocusedIndex,
    wrapperRef,
    errorId,
    listboxId,
    buttonId,
    optionIdPrefix,
    close,
  } = useInputSelect();

  const controlRef = useRef<HTMLDivElement>(null);

  const selectedOptions = options.filter((o) => value.includes(o.value));

  const toggleOption = (optionValue: T) => {
    if (value.includes(optionValue)) {
      onChange(value.filter((v) => v !== optionValue));
    } else {
      onChange([...value, optionValue]);
    }
  };

  const handleControlClick = () => {
    if (disabled) return;
    setIsOpen((o) => !o);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
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
      controlRef.current?.focus();
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
      toggleOption(options[focusedIndex]!.value);
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
        <div
          ref={controlRef}
          id={buttonId}
          role="button"
          tabIndex={disabled ? -1 : 0}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-controls={listboxId}
          aria-activedescendant={
            isOpen && focusedIndex >= 0 ? `${optionIdPrefix}-${focusedIndex}` : undefined
          }
          aria-invalid={!!errorMessage}
          aria-describedby={errorMessage ? errorId : undefined}
          aria-disabled={disabled}
          onClick={handleControlClick}
          className={classNames(
            inputFieldClassName,
            'grid !h-auto min-h-9 w-full grid-cols-[1fr_auto] items-center text-left',
            disabled && 'pointer-events-none opacity-50',
          )}
        >
          <span
            className={classNames(
              'flex min-w-0 flex-wrap items-center gap-1',
              isClearable && selectedOptions.length > 0 && !disabled ? 'mr-8' : 'mr-1',
            )}
          >
            {selectedOptions.length > 0 ? (
              selectedOptions.map((option) => (
                <span
                  key={option.value as string}
                  className="bg-surface-overlay text-primary flex max-w-full items-center gap-1 rounded px-1.5 py-0.5 text-xs"
                >
                  <span className="truncate">{option.label}</span>
                  <button
                    type="button"
                    tabIndex={-1}
                    aria-label={
                      typeof option.label === 'string' ? `Remove ${option.label}` : 'Remove option'
                    }
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleOption(option.value);
                    }}
                    className="text-primary/50 hover:text-primary shrink-0"
                  >
                    <MdClose className="h-3 w-3" />
                  </button>
                </span>
              ))
            ) : (
              <span className="text-primary/50">{placeholder}</span>
            )}
          </span>
          <MdExpandMore className="h-4 w-4 shrink-0 opacity-60" />
        </div>
        {selectedOptions.length > 0 && !disabled && isClearable && (
          <button
            type="button"
            aria-label="Clear selection"
            className="text-primary/40 hover:text-primary focus:ring-info-ring absolute inset-y-0 right-8 flex items-center px-1 focus:ring-2 focus:outline-none"
            onClick={() => {
              onChange([]);
              controlRef.current?.focus();
            }}
          >
            <MdClose className="h-4 w-4" />
          </button>
        )}
        {isOpen && (
          <ul
            id={listboxId}
            role="listbox"
            aria-multiselectable="true"
            className="bg-surface border-primary-ring absolute z-20 mt-1 max-h-60 w-full overflow-y-auto rounded-md border shadow-md"
          >
            {options.map((option, index) => {
              const isSelected = value.includes(option.value);
              return (
                <li
                  key={option.value as string}
                  id={`${optionIdPrefix}-${index}`}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => toggleOption(option.value)}
                  className={classNames(
                    'text-primary flex cursor-default items-center justify-between gap-2 px-3 py-2 text-sm',
                    index === focusedIndex
                      ? 'bg-surface-overlay/70'
                      : 'hover:bg-surface-overlay/70',
                  )}
                >
                  <span className="min-w-0 truncate">{option.label}</span>
                  {isSelected && <MdCheck className="h-4 w-4 shrink-0 opacity-70" />}
                </li>
              );
            })}
          </ul>
        )}
      </div>
      {errorMessage && (
        <div id={errorId} className="text-danger text-xs">
          {errorMessage}
        </div>
      )}
      {value.includes('other' as T) && (
        <div className="text-success text-xs">
          When choosing &quot;other&quot; you can refine in the remarks section below for better
          results.
        </div>
      )}
    </div>
  );
}
