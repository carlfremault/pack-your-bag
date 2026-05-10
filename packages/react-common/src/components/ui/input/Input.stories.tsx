import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';

import { Input } from './Input';

const meta: Meta<typeof Input> = {
  title: 'Components/Input',
  component: Input,
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
    label: 'Input',
    type: 'text',
    placeholder: 'Enter your input',
    onChange: fn(),
  },
};

export const Required: Story = {
  args: {
    ...Default.args,
    placeholder: 'Enter your required input',
    required: true,
  },
};

export const Email: Story = {
  args: {
    label: 'Email',
    type: 'email',
    placeholder: 'Enter your email',
    onChange: fn(),
  },
};

export const WithMaxLength: Story = {
  args: {
    ...Default.args,
    maxLength: 10,
  },
};
