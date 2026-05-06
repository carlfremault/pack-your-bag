import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';

import { LONG_DESCRIPTION } from '../../../lib/constants';
import { EditDeleteActions } from '../../table';
import { QuantityStepper } from '../input/QuantityStepper';

import { ItemCard } from './ItemCard';

const meta: Meta<typeof ItemCard> = {
  title: 'Components/ItemCard',
  component: ItemCard,
};
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    name: 'Item 1',
    description: 'Item 1 description',
    category: {
      name: 'Category 1',
      colorTheme: 'jungle',
    },
    weight: '10',
    weightUnit: 'kg',
    actions: (
      <div className="flex gap-8">
        <EditDeleteActions name="Item 1" id="1" onEdit={fn()} onDelete={fn()} />
      </div>
    ),
  },
};

export const WithActions: Story = {
  args: {
    name: 'Item 1',
    description: 'Item 1 description',
    actions: (
      <div className="flex gap-8">
        <EditDeleteActions name="Item 1" id="1" onEdit={fn()} onDelete={fn()} />
      </div>
    ),
  },
};

export const WithQuantityStepper: Story = {
  args: {
    name: 'Item 1',
    weight: '110',
    weightUnit: 'g',
    description: 'Item 1 description',
    category: {
      name: 'Category 1',
      colorTheme: 'jungle',
    },
    actions: <QuantityStepper quantity={3} onChange={fn()} />,
  },
};

export const NoCategory: Story = {
  args: {
    name: 'Item 1',
    description: 'Item 1 description',
    weight: '10',
    weightUnit: 'kg',
  },
};

export const NoWeight: Story = {
  args: {
    name: 'Item 1',
    description: 'Item 1 description',
  },
};

export const WeightButNoWeightUnit: Story = {
  args: {
    name: 'Item 1',
    description: 'Item 1 description',
    weight: '10',
  },
};

export const NoDescription: Story = {
  args: {
    name: 'Item 1',
  },
};

export const DescriptionWith1000Characters: Story = {
  args: {
    name: 'Item 1',
    description: LONG_DESCRIPTION,
    weight: '10',
    weightUnit: 'kg',
  },
};

export const DescriptionWith1000CharactersAndActions: Story = {
  args: {
    name: 'Item 1',
    description: LONG_DESCRIPTION,
    weight: '10',
    weightUnit: 'kg',
    category: {
      name: 'Category 1',
      colorTheme: 'sand',
    },
    actions: (
      <div className="flex gap-8">
        <EditDeleteActions name="Item 1" id="1" onEdit={fn()} onDelete={fn()} />
      </div>
    ),
  },
};

export const DescriptionWith1000CharactersAndQuantityStepper: Story = {
  args: {
    name: 'Item 1',
    description: LONG_DESCRIPTION,
    weight: '10',
    weightUnit: 'kg',
    category: {
      name: 'Category 1',
      colorTheme: 'lavender',
    },
    actions: <QuantityStepper quantity={1} onChange={fn()} />,
  },
};
