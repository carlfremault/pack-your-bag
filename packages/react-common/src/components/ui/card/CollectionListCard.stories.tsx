import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';

import { LONG_DESCRIPTION } from '../../../lib/constants';
import { EditDeleteActions } from '../../table';
import { QuantityStepper } from '../input/QuantityStepper';

import { CollectionListCard } from './CollectionListCard';

const meta: Meta<typeof CollectionListCard> = {
  title: 'Components/CollectionListCard',
  component: CollectionListCard,
};
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    name: 'List 1',
    description: 'List 1 description',
    colorTheme: 'lavender',
    itemCount: 10,
    totalWeight: '10',
    weightUnit: 'kg',
    actions: (
      <div className="flex gap-8">
        <EditDeleteActions name="Item 1" id="1" onEdit={fn()} onDelete={fn()} />
      </div>
    ),
  },
};

export const WithQuantityStepper: Story = {
  args: {
    name: 'List 1',
    description: 'List 1 description',
    colorTheme: 'lavender',
    itemCount: 10,
    totalWeight: '10',
    weightUnit: 'kg',
    actions: <QuantityStepper quantity={3} onChange={fn()} />,
  },
};

export const NoDescription: Story = {
  args: {
    name: 'List 1',
    colorTheme: 'lavender',
    itemCount: 10,
    totalWeight: '10',
    weightUnit: 'kg',
  },
};

export const LongName: Story = {
  args: {
    name: 'List 1 is a very long name that should be wrapped if it reaches the width of the container',
    colorTheme: 'lavender',
    itemCount: 10,
    totalWeight: '10',
    weightUnit: 'kg',
  },
};

export const LongDescription: Story = {
  args: {
    name: 'List 1',
    description: LONG_DESCRIPTION,
    colorTheme: 'lavender',
    itemCount: 10,
    totalWeight: '10',
    weightUnit: 'kg',
  },
};
