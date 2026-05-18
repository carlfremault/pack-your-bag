'use client';

import { Input } from './Input';

export interface DateRange {
  dateFrom?: string;
  dateUntil?: string;
}

export interface InputDateRangeProps {
  dateFrom?: string;
  dateUntil?: string;
  onChange: (value: DateRange) => void;
}

export function InputDateRange({ dateFrom, dateUntil, onChange }: InputDateRangeProps) {
  return (
    <div className="flex flex-col gap-4 lg:flex-row">
      <Input
        label="From"
        type="date"
        value={dateFrom ?? ''}
        onChange={(e) => onChange({ dateFrom: e.target.value })}
        max={dateUntil ?? ''}
      />
      <Input
        label="Until"
        type="date"
        value={dateUntil ?? ''}
        onChange={(e) => onChange({ dateUntil: e.target.value })}
        min={dateFrom ?? ''}
      />
    </div>
  );
}
