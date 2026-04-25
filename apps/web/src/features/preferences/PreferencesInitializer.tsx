'use client';

import { useEffect } from 'react';

import { deriveDefaultPreferences } from './defaults';
import { useCreatePreferences, usePreferences } from './queries';

export function PreferencesInitializer() {
  const { data, isLoading } = usePreferences();
  const { mutate: create } = useCreatePreferences();

  useEffect(() => {
    if (isLoading || data !== null) return;
    create(deriveDefaultPreferences(navigator.language));
  }, [isLoading, data, create]);

  return null;
}
