import { expect } from 'vitest';

const isoDate = expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/) as string;

export const isoDateMatcher = isoDate;
