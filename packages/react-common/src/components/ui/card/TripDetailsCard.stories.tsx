import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';

import { TripDetailsCard } from './TripDetailsCard';

const meta: Meta<typeof TripDetailsCard> = {
  title: 'Components/TripDetailsCard',
  component: TripDetailsCard,
};
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    id: 'trip-1',
    name: 'Trip 1',
    date: '2026-01-01',
    remarks: 'Trip 1 remarks',
    packName: 'Pack 1',
    numberOfItems: 10,
    numberOfItemsPacked: 5,
    totalWeight: '10',
    weightUnit: 'kg',
    categoryItems: [
      {
        category: {
          name: 'Category 1',
          colorTheme: 'jungle',
        },
        itemsNeeded: 5,
        itemsPacked: 5,
      },
      {
        category: {
          name: 'Category 2',
          colorTheme: 'sand',
        },
        itemsNeeded: 5,
        itemsPacked: 2,
      },
    ],
    onEditTrip: fn(),
    onDeleteTrip: fn(),
  },
};

export const NoDate: Story = {
  args: {
    id: 'trip-1',
    name: 'Trip 1',
    remarks: 'Trip 1 remarks',
    packName: 'Pack 1',
    numberOfItems: 10,
    numberOfItemsPacked: 5,
    totalWeight: '10',
    weightUnit: 'kg',
    categoryItems: [
      {
        category: {
          name: 'Category 1',
          colorTheme: 'jungle',
        },
        itemsNeeded: 5,
        itemsPacked: 5,
      },
      {
        category: {
          name: 'Category 2',
          colorTheme: 'sand',
        },
        itemsNeeded: 5,
        itemsPacked: 2,
      },
    ],
    onEditTrip: fn(),
    onDeleteTrip: fn(),
  },
};

export const LongerName: Story = {
  args: {
    id: 'trip-1',
    name: 'Trip 1 Lorem ipsum',
    date: '2026-01-01',
    remarks: 'Trip 1 remarks',
    packName: 'Pack 1',
    numberOfItems: 10,
    numberOfItemsPacked: 5,
    totalWeight: '10',
    weightUnit: 'kg',
    categoryItems: [
      {
        category: {
          name: 'Category 1',
          colorTheme: 'jungle',
        },
        itemsNeeded: 5,
        itemsPacked: 5,
      },
      {
        category: {
          name: 'Category 2',
          colorTheme: 'sand',
        },
        itemsNeeded: 5,
        itemsPacked: 2,
      },
    ],
    onEditTrip: fn(),
    onDeleteTrip: fn(),
  },
};

export const VeryLongName: Story = {
  args: {
    id: 'trip-1',
    name: 'Trip 1 Lorem ipsum dolor sit amet consectetur adipisicing elit. Voluptatem, quia!',
    date: '2026-01-01',
    remarks: 'Trip 1 remarks',
    packName: 'Pack 1',
    numberOfItems: 10,
    numberOfItemsPacked: 5,
    totalWeight: '10',
    weightUnit: 'kg',
    categoryItems: [
      {
        category: {
          name: 'Category 1',
          colorTheme: 'jungle',
        },
        itemsNeeded: 5,
        itemsPacked: 5,
      },
      {
        category: {
          name: 'Category 2',
          colorTheme: 'sand',
        },
        itemsNeeded: 5,
        itemsPacked: 2,
      },
    ],
    onEditTrip: fn(),
    onDeleteTrip: fn(),
  },
};

export const FullyPacked: Story = {
  args: {
    id: 'trip-1',
    name: 'Trip 1',
    date: '2026-01-01',
    remarks: 'Trip 1 remarks',
    packName: 'Pack 1',
    numberOfItems: 10,
    numberOfItemsPacked: 10,
    totalWeight: '10',
    weightUnit: 'kg',
    categoryItems: [
      {
        category: {
          name: 'Category 1',
          colorTheme: 'jungle',
        },
        itemsNeeded: 5,
        itemsPacked: 5,
      },
      {
        category: {
          name: 'Category 2',
          colorTheme: 'sand',
        },
        itemsNeeded: 5,
        itemsPacked: 5,
      },
    ],
    onEditTrip: fn(),
    onDeleteTrip: fn(),
  },
};
