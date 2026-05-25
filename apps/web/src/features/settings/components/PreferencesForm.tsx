'use client';

import { ComponentType } from 'react';
import { MdDarkMode, MdLightMode } from 'react-icons/md';

import { DateFormat, Theme, TimeFormat, Units } from '@repo/constants';
import { IconToggleOption, InputIconToggle } from '@repo/react-common/input';
import { SectionNotReady } from '@repo/react-common/utils';

import classNames from 'classnames';

import { usePreferences, useUpdatePreferences } from '../queries';
import { UpdatePreferencesBody } from '../types';

function makeTextIcon(text: string): ComponentType<{ className?: string }> {
  function TextIcon({ className }: { className?: string }) {
    return (
      <span
        aria-hidden="true"
        className={classNames(
          className,
          'inline-flex h-5 w-auto! items-center justify-center px-1 font-mono text-[10px] leading-none font-bold whitespace-nowrap',
        )}
      >
        {text}
      </span>
    );
  }
  TextIcon.displayName = `TextIcon(${text})`;
  return TextIcon;
}

const THEME_OPTIONS: IconToggleOption<string | null>[] = [
  { value: Theme.LIGHT, label: 'Light theme', icon: MdLightMode },
  { value: Theme.DARK, label: 'Dark theme', icon: MdDarkMode },
  { value: null, label: 'System', icon: makeTextIcon('System') },
];

const UNITS_OPTIONS: IconToggleOption<string>[] = [
  { value: Units.METRIC, label: 'Metric units (kg, cm)', icon: makeTextIcon('kg') },
  { value: Units.IMPERIAL, label: 'Imperial units (lb, in)', icon: makeTextIcon('lb') },
];

const DATE_FORMAT_OPTIONS: IconToggleOption<string>[] = [
  { value: DateFormat.DD_MM_YY_SLASH, label: 'Day/Month/Year', icon: makeTextIcon('D/M/Y') },
  { value: DateFormat.MM_DD_YY_SLASH, label: 'Month/Day/Year', icon: makeTextIcon('M/D/Y') },
  { value: DateFormat.YYYY_MM_DD_SLASH, label: 'Year/Month/Day', icon: makeTextIcon('Y/M/D') },
  { value: DateFormat.DD_MM_YY_DASH, label: 'Day-Month-Year', icon: makeTextIcon('D-M-Y') },
  { value: DateFormat.MM_DD_YY_DASH, label: 'Month-Day-Year', icon: makeTextIcon('M-D-Y') },
  { value: DateFormat.YYYY_MM_DD_DASH, label: 'Year-Month-Day', icon: makeTextIcon('Y-M-D') },
];

const TIME_FORMAT_OPTIONS: IconToggleOption<string>[] = [
  { value: TimeFormat.TWELVE_HOUR, label: '12-hour clock', icon: makeTextIcon('12h') },
  { value: TimeFormat.TWENTY_FOUR_HOUR, label: '24-hour clock', icon: makeTextIcon('24h') },
];

export function PreferencesForm() {
  const { data: preferences } = usePreferences();
  const { mutate: updatePreferences, isPending } = useUpdatePreferences();

  const handleChange = (body: UpdatePreferencesBody) => {
    updatePreferences(body);
  };

  if (!preferences) {
    return <SectionNotReady />;
  }

  return (
    <fieldset
      disabled={isPending}
      aria-busy={isPending}
      className="bg-surface border-primary-ring flex w-full min-w-0 flex-col gap-6 rounded-md border p-4 shadow-sm transition-opacity disabled:opacity-50"
    >
      <legend className="sr-only">Preferences</legend>
      <InputIconToggle
        label="Theme"
        options={THEME_OPTIONS}
        value={preferences.theme}
        onChange={(value) => handleChange({ theme: value as Theme })}
      />
      <InputIconToggle
        label="Units"
        options={UNITS_OPTIONS}
        value={preferences.units}
        onChange={(value) => handleChange({ units: value as Units })}
      />
      <InputIconToggle
        label="Date format"
        options={DATE_FORMAT_OPTIONS}
        value={preferences.dateFormat}
        onChange={(value) => handleChange({ dateFormat: value as DateFormat })}
      />
      <InputIconToggle
        label="Time format"
        options={TIME_FORMAT_OPTIONS}
        value={preferences.timeFormat}
        onChange={(value) => handleChange({ timeFormat: value as TimeFormat })}
      />
    </fieldset>
  );
}
