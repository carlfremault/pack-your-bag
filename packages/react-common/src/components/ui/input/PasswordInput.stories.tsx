import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';

import { PasswordInput } from './PasswordInput';

const meta: Meta<typeof PasswordInput> = {
  title: 'Components/PasswordInput',
  component: PasswordInput,
  decorators: [
    (Story) => (
      <div className="bg-surface w-full">
        <Story />
      </div>
    ),
  ],
};
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    label: 'Password',
    placeholder: 'Enter your password',
    onChange: fn(),
  },
};

export const Required: Story = {
  args: {
    ...Default.args,
    required: true,
  },
};

export const VisibleByDefault: Story = {
  args: {
    ...Default.args,
    defaultVisible: true,
  },
};
