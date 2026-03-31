import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';

import Button from './Button';

const meta: Meta<typeof Button> = {
  title: 'Components/Button',
  component: Button,
};
export default meta;

type Story = StoryObj<typeof meta>;

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

export const PrimaryOutline: Story = {
  args: {
    ...Default.args,
    color: 'primary',
    variant: 'outline',
  },
};

export const PrimaryGhost: Story = {
  args: {
    ...Default.args,
    color: 'primary',
    variant: 'ghost',
  },
};

export const PrimaryLink: Story = {
  args: {
    ...Default.args,
    color: 'primary',
    variant: 'link',
  },
};

export const Secondary: Story = {
  args: {
    ...Default.args,
    color: 'secondary',
  },
};

export const SecondaryOutline: Story = {
  args: {
    ...Default.args,
    color: 'secondary',
    variant: 'outline',
  },
};

export const SecondaryGhost: Story = {
  args: {
    ...Default.args,
    color: 'secondary',
    variant: 'ghost',
  },
};

export const SecondaryLink: Story = {
  args: {
    ...Default.args,
    color: 'secondary',
    variant: 'link',
  },
};

export const Danger: Story = {
  args: {
    ...Default.args,
    color: 'danger',
  },
};

export const DangerOutline: Story = {
  args: {
    ...Default.args,
    color: 'danger',
    variant: 'outline',
  },
};

export const DangerGhost: Story = {
  args: {
    ...Default.args,
    color: 'danger',
    variant: 'ghost',
  },
};

export const DangerLink: Story = {
  args: {
    ...Default.args,
    color: 'danger',
    variant: 'link',
  },
};

export const Warning: Story = {
  args: {
    ...Default.args,
    color: 'warning',
  },
};

export const WarningOutline: Story = {
  args: {
    ...Default.args,
    color: 'warning',
    variant: 'outline',
  },
};

export const WarningGhost: Story = {
  args: {
    ...Default.args,
    color: 'warning',
    variant: 'ghost',
  },
};

export const WarningLink: Story = {
  args: {
    ...Default.args,
    color: 'warning',
    variant: 'link',
  },
};

export const Info: Story = {
  args: {
    ...Default.args,
    color: 'info',
  },
};

export const InfoOutline: Story = {
  args: {
    ...Default.args,
    color: 'info',
    variant: 'outline',
  },
};

export const InfoGhost: Story = {
  args: {
    ...Default.args,
    color: 'info',
    variant: 'ghost',
  },
};

export const InfoLink: Story = {
  args: {
    ...Default.args,
    color: 'info',
    variant: 'link',
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
