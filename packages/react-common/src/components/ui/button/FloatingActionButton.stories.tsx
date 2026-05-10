import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';

import { FloatingActionButton } from './FloatingActionButton';

const meta: Meta<typeof FloatingActionButton> = {
  title: 'Components/FloatingActionButton',
  component: FloatingActionButton,
};
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    onClick: fn(),
    ariaLabel: 'Add',
  },
};
