import type { Meta, StoryObj } from '@storybook/react-vite';

import CategoryPill from './CategoryPill';

const meta: Meta<typeof CategoryPill> = {
  title: 'Components/CategoryPill',
  component: CategoryPill,
};
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    name: 'Category',
    colorTheme: 'ocean',
  },
};
