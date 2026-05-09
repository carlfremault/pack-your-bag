'use client';

import { useEffect } from 'react';

import { deriveDefaultPreferences } from '../defaults';
import { useCreatePreferences, usePreferences } from '../queries';

export function PreferencesInitializer() {
  const { data } = usePreferences();
  const { mutate: create, isPending } = useCreatePreferences();

  useEffect(() => {
    if (isPending || data !== null) return;
    create(deriveDefaultPreferences(navigator.language));
  }, [isPending, data, create]);

  return null;
}
