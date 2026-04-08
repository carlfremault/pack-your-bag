import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';

import { TripCard } from './TripCard';

import { LONG_DESCRIPTION } from '#lib/constants';

const meta: Meta<typeof TripCard> = {
  title: 'Components/TripCard',
  component: TripCard,
};
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    id: 'trip-1',
    name: 'Trip 1',
    date: new Date(),
    remarks: 'Trip 1 remarks',
    packName: 'Pack 1',
    numberOfItems: 10,
    numberOfItemsPacked: 5,
    onOpenTrip: fn(),
  },
};

export const SixtyPercentPacked: Story = {
  args: {
    ...Default.args,
    numberOfItemsPacked: 6,
  },
};

export const Packed: Story = {
  args: {
    ...Default.args,
    numberOfItemsPacked: 10,
  },
};

export const NotPacked: Story = {
  args: {
    ...Default.args,
    numberOfItemsPacked: 0,
  },
};

export const WithLongRemarks: Story = {
  args: {
    ...Default.args,
    remarks:
      'This is a much longer remark that contains significantly more text and should definitely wrap to multiple lines in order to properly test the text wrapping behavior of the TripCard component',
  },
};

export const WithExtraLongRemarks: Story = {
  args: {
    ...Default.args,
    remarks: LONG_DESCRIPTION,
  },
};

export const WithLongPackName: Story = {
  args: {
    ...Default.args,
    packName: 'This is a significantly longer pack name for testing',
  },
};

export const WithExtraLongPackName: Story = {
  args: {
    ...Default.args,
    packName:
      'This is an extremely long pack name that should definitely test the component behavior with very long text strings that might cause overflow or wrapping issues',
  },
};
