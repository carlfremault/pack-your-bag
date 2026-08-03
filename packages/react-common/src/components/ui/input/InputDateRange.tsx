'use client';

import classNames from 'classnames';

import { Input } from './Input';

export interface DateRange {
  dateFrom?: string;
  dateUntil?: string;
}

export interface InputDateRangeProps {
  dateFrom?: string;
  dateUntil?: string;
  onChange: (value: DateRange) => void;
  grow?: boolean;
  className?: string;
}

export function InputDateRange({
  dateFrom,
  dateUntil,
  onChange,
  grow = false,
  className,
}: InputDateRangeProps) {
  return (
    <div className={classNames('flex flex-col gap-4 lg:flex-row', grow && 'w-full', className)}>
      <div className={grow ? 'flex-1' : ''}>
        <Input
          label="From"
          type="date"
          value={dateFrom ?? ''}
          onChange={(e) => onChange({ dateFrom: e.target.value })}
          max={dateUntil ?? ''}
        />
      </div>
      <div className={grow ? 'flex-1' : ''}>
        <Input
          label="Until"
          type="date"
          value={dateUntil ?? ''}
          onChange={(e) => onChange({ dateUntil: e.target.value })}
          min={dateFrom ?? ''}
        />
      </div>
    </div>
  );
}
