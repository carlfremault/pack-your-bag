import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';

import { CenteredSurfaceCard } from '../card';

import { ConfirmationDialog } from './ConfirmationDialog';

const meta: Meta<typeof ConfirmationDialog> = {
  title: 'Components/ConfirmationDialog',
  component: ConfirmationDialog,
  decorators: [
    (Story) => (
      <CenteredSurfaceCard>
        <Story />
      </CenteredSurfaceCard>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    isPending: false,
    onConfirm: fn(),
    onClose: fn(),
  },
};
