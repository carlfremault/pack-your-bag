'use client';

import { useEffect } from 'react';

import { deriveDefaultPreferences } from '../defaults';
import { useCreatePreferences, usePreferences } from '../queries';

export function PreferencesInitializer() {
  const { data, isLoading } = usePreferences();
  const { mutate: create, isPending } = useCreatePreferences();

  useEffect(() => {
    if (isLoading || isPending || data !== null) return;
    create(deriveDefaultPreferences(navigator.language));
  }, [isLoading, isPending, data, create]);

  return null;
}
