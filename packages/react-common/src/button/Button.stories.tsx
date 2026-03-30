import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';

import Button from './Button';

const meta: Meta<typeof Button> = {
  title: 'Components/Button',
  component: Button,
};
export default meta;

type Story = StoryObj<typeof Button>;

export const Default: Story = {
  args: {
    onClick: fn(),
    children: 'Button',
  },
};

export const Primary: Story = {
  args: {
    ...Default.args,
    color: 'primary',
  },
};

export const Secondary: Story = {
  args: {
    ...Default.args,
    color: 'secondary',
  },
};

export const Danger: Story = {
  args: {
    ...Default.args,
    color: 'danger',
  },
};

export const Warning: Story = {
  args: {
    ...Default.args,
    color: 'warning',
  },
};

export const Transparent: Story = {
  args: {
    ...Default.args,
    color: 'transparent',
  },
};

export const Small: Story = {
  args: {
    ...Default.args,
    size: 'small',
  },
};

export const Medium: Story = {
  args: {
    ...Default.args,
    size: 'medium',
  },
};

export const Large: Story = {
  args: {
    ...Default.args,
    size: 'large',
  },
};

export const FullWidth: Story = {
  args: {
    ...Default.args,
    fullWidth: true,
  },
};

export const Disabled: Story = {
  args: {
    ...Default.args,
    disabled: true,
  },
};

export const IconOnly: Story = {
  args: {
    onClick: fn(),
    'aria-label': 'Close',
  },
  render: (args) => (
    <Button {...args}>
      <span aria-hidden="true">X</span>
    </Button>
  ),
};
