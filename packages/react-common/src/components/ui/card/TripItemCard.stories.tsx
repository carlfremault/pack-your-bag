import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';

import { QuantityStepper } from '../input';

import { TripItemCard } from './TripItemCard';

const meta: Meta<typeof TripItemCard> = {
  title: 'Components/TripItemCard',
  component: TripItemCard,
};
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    name: 'Item 1',
    quantity: 2,
    packedQuantity: 1,
    actions: <QuantityStepper quantity={1} onChange={fn()} />,
  },
};

export const FullyPacked: Story = {
  args: {
    ...Default.args,
    packedQuantity: 2,
    actions: <QuantityStepper quantity={2} onChange={fn()} />,
  },
};

export const AlmostPacked: Story = {
  args: {
    ...Default.args,
    quantity: 5,
    packedQuantity: 4,
    actions: <QuantityStepper quantity={4} onChange={fn()} />,
  },
};

export const NotPacked: Story = {
  args: {
    ...Default.args,
    packedQuantity: 0,
    actions: <QuantityStepper quantity={0} onChange={fn()} />,
  },
};

export const WithLongname: Story = {
  args: {
    ...Default.args,
    name: 'This is a very long item name that should wrap to multiple lines so we can test the wrapping behavior of this text in the card',
    actions: <QuantityStepper quantity={1} onChange={fn()} />,
  },
};

export const WithLongnameAndCategory: Story = {
  args: {
    ...Default.args,
    name: 'This is a very long item name that should wrap to multiple lines so we can test the wrapping behavior of this text in the card',
    category: {
      name: 'CategorynameCategoryname',
      colorTheme: 'lavender',
    },
    actions: <QuantityStepper quantity={1} onChange={fn()} />,
  },
};

export const WithCategory: Story = {
  args: {
    ...Default.args,
    category: {
      name: 'Category 1',
      colorTheme: 'lavender',
    },
    actions: <QuantityStepper quantity={1} onChange={fn()} />,
  },
};
