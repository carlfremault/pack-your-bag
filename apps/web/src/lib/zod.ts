import { z } from 'zod';

const customErrorMap: z.ZodErrorMap = (issue) => {
  switch (issue.code) {
    case 'too_big':
      if (issue.origin === 'string')
        return { message: `Must be at most ${issue.maximum} characters` };
      if (issue.origin === 'number') return { message: `Must be at most ${issue.maximum}` };
      return undefined;
    case 'too_small':
      if (issue.origin === 'string')
        return { message: `Must be at least ${issue.minimum} characters` };
      if (issue.origin === 'number') return { message: `Must be at least ${issue.minimum}` };
      return undefined;
    case 'invalid_format':
      if (issue.format === 'email') return { message: 'Invalid email address' };
      if (issue.format === 'uuid') return { message: 'Must be a valid UUID' };
      return undefined;
    default:
      return undefined;
  }
};

z.config({ customError: customErrorMap });
