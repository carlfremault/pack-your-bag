import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';

import { Alert } from './Alert';

const meta: Meta<typeof Alert> = {
  title: 'Components/Alert',
  component: Alert,
};
export default meta;

type Story = StoryObj<typeof Alert>;

export const Info: Story = {
  args: {
    message: 'This is an info message',
    type: 'info',
  },
};

export const Warning: Story = {
  args: {
    message: 'This is a warning message',
    type: 'warning',
  },
};

export const Error: Story = {
  args: {
    message: 'This is an error message',
    type: 'error',
  },
};

export const Success: Story = {
  args: {
    message: 'This is a success message',
    type: 'success',
  },
};

export const MultipleMessages: Story = {
  args: {
    message: [
      'This is the first message',
      'This is the second message',
      'This is the third message',
    ],
  },
};
