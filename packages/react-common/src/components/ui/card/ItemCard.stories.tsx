import { MdOutlineEdit } from 'react-icons/md';

import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';

import Button from '../button/Button';
import QuantityStepper from '../input/QuantityStepper';

import ItemCard from './ItemCard';

import { LONG_DESCRIPTION } from '#lib/constants';

const meta: Meta<typeof ItemCard> = {
  title: 'Components/ItemCard',
  component: ItemCard,
};
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    id: '1',
    name: 'Item 1',
    description: 'Item 1 description',
    category: {
      name: 'Category 1',
      colorTheme: 'jungle',
    },
    weight: 10,
    weightUnit: 'kg',
    onEditItem: fn(),
  },
};

export const WithActions: Story = {
  args: {
    id: '1',
    name: 'Item 1',
    description: 'Item 1 description',
    onEditItem: fn(),
    actions: (
      <Button variant="unstyledIcon" color="primary" aria-label="Edit Item 1" onClick={fn()}>
        <MdOutlineEdit className="text-primary/80 hover:text-primary h-5 w-5 transition-colors md:ml-4" />
      </Button>
    ),
  },
};

export const WithQuantityStepper: Story = {
  args: {
    id: '1',
    name: 'Item 1',
    description: 'Item 1 description',
    onEditItem: fn(),
    actions: <QuantityStepper quantity={1000} onChange={fn()} />,
  },
};

export const NoCategory: Story = {
  args: {
    id: '1',
    name: 'Item 1',
    description: 'Item 1 description',
    weight: 10,
    weightUnit: 'kg',
    onEditItem: fn(),
  },
};

export const NoWeight: Story = {
  args: {
    id: '1',
    name: 'Item 1',
    description: 'Item 1 description',
    onEditItem: fn(),
  },
};

export const WeightButNoWeightUnit: Story = {
  args: {
    id: '1',
    name: 'Item 1',
    description: 'Item 1 description',
    weight: 10,
    onEditItem: fn(),
  },
};

export const NoDescription: Story = {
  args: {
    id: '1',
    name: 'Item 1',
    onEditItem: fn(),
  },
};

export const DescriptionWith1000Characters: Story = {
  args: {
    id: '1',
    name: 'Item 1',
    description: LONG_DESCRIPTION,
    weight: 10,
    weightUnit: 'kg',
    onEditItem: fn(),
  },
};

export const DescriptionWith1000CharactersAndActions: Story = {
  args: {
    id: '1',
    name: 'Item 1',
    description: LONG_DESCRIPTION,
    weight: 10,
    weightUnit: 'kg',
    onEditItem: fn(),
    category: {
      name: 'Category 1',
      colorTheme: 'sand',
    },
    actions: (
      <Button variant="unstyledIcon" color="primary" aria-label="Edit Item 1" onClick={fn()}>
        <MdOutlineEdit className="text-primary/80 hover:text-primary h-5 w-5 transition-colors md:ml-4" />
      </Button>
    ),
  },
};

export const DescriptionWith1000CharactersAndQuantityStepper: Story = {
  args: {
    id: '1',
    name: 'Item 1',
    description: LONG_DESCRIPTION,
    weight: 10,
    weightUnit: 'kg',
    category: {
      name: 'Category 1',
      colorTheme: 'lavender',
    },
    onEditItem: fn(),
    actions: <QuantityStepper quantity={1} onChange={fn()} />,
  },
};
