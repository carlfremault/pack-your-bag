import type { Meta, StoryObj } from '@storybook/react-vite';

import { SubmitButton } from './SubmitButton';

const meta: Meta<typeof SubmitButton> = {
  title: 'Components/SubmitButton',
  component: SubmitButton,
};
export default meta;

type Story = StoryObj<typeof SubmitButton>;

export const Default: Story = {
  args: {
    pending: false,
    children: 'Submit',
  },
};

export const Pending: Story = {
  args: {
    pending: true,
    children: 'Submit',
  },
};
