import type { Meta, StoryObj } from '@storybook/react-vite';

import { TripItemCard } from './TripItemCard';

const meta: Meta<typeof TripItemCard> = {
  title: 'Components/TripItemCard',
  component: TripItemCard,
};
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    itemId: '1',
    itemName: 'Item 1',
    quantityNeeded: 2,
    quantityPacked: 1,
  },
};

export const FullyPacked: Story = {
  args: {
    ...Default.args,
    quantityPacked: 2,
  },
};

export const AlmostPacked: Story = {
  args: {
    ...Default.args,
    quantityNeeded: 5,
    quantityPacked: 4,
  },
};

export const NotPacked: Story = {
  args: {
    ...Default.args,
    quantityPacked: 0,
  },
};

export const WithLongItemName: Story = {
  args: {
    ...Default.args,
    itemName:
      'This is a very long item name that should wrap to multiple lines so we can test the wrapping behavior of this text in the card',
  },
};

export const WithCategory: Story = {
  args: {
    ...Default.args,
    itemCategory: {
      name: 'Category 1',
      colorTheme: 'lavender',
    },
  },
};
