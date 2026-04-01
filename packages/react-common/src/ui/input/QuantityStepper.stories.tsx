import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';

import QuantityStepper from './QuantityStepper';

const meta: Meta<typeof QuantityStepper> = {
  title: 'Components/QuantityStepper',
  component: QuantityStepper,
};
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    quantity: 1,
    onChange: fn(),
  },
};

export const WithMinAndMax: Story = {
  args: {
    quantity: 1,
    onChange: fn(),
    min: 0,
    max: 100,
  },
};

export const AtMin: Story = {
  args: {
    quantity: 0,
    onChange: fn(),
    min: 0,
    max: 100,
  },
};

export const AtMax: Story = {
  args: {
    quantity: 100,
    onChange: fn(),
    min: 0,
    max: 100,
  },
};
