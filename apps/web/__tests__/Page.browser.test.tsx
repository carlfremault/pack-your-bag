import { expect, test } from 'vitest';
import { render } from 'vitest-browser-react';

import Page from '@/app/page';

test('renders main page', async () => {
  const { getByText } = await render(<Page />);
  await expect.element(getByText('Hello world! 👋')).toBeInTheDocument();
});
