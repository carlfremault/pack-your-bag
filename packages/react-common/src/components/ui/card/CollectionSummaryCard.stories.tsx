import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';

import { colorThemes } from '../../../lib/colorThemes';
import { LONG_DESCRIPTION } from '../../../lib/constants';

import { CollectionSummaryCard } from './CollectionSummaryCard';

const meta: Meta<typeof CollectionSummaryCard> = {
  title: 'Components/CollectionSummaryCard',
  component: CollectionSummaryCard,
  argTypes: {
    colorTheme: {
      control: 'select',
      options: Object.keys(colorThemes),
    },
  },
};
export default meta;

type Story = StoryObj<typeof meta>;

export const ListWith10Items: Story = {
  args: {
    name: 'List 1',
    description: 'Collection 1 description',
    colorTheme: 'ocean',
    type: 'list',
    itemCount: 10,
    onEditCollection: fn(),
    onDeleteCollection: fn(),
  },
};

export const PackWith1Item: Story = {
  args: {
    name: 'Pack 1',
    description: 'Collection 1 description',
    colorTheme: 'jungle',
    type: 'pack',
    itemCount: 1,
    onEditCollection: fn(),
    onDeleteCollection: fn(),
  },
};

export const PackWithoutItems: Story = {
  args: {
    name: 'Pack 1',
    description: 'Collection 1 description',
    colorTheme: 'lagoon',
    type: 'pack',
    itemCount: 0,
    onEditCollection: fn(),
    onDeleteCollection: fn(),
  },
};

export const ListWithoutDescription: Story = {
  args: {
    name: 'List 1',
    colorTheme: 'lavender',
    type: 'list',
    itemCount: 10,
    onEditCollection: fn(),
    onDeleteCollection: fn(),
  },
};

export const ListWithLongDescription: Story = {
  args: {
    name: 'List 1',
    description: LONG_DESCRIPTION,
    colorTheme: 'slate',
    type: 'list',
    itemCount: 10,
    onEditCollection: fn(),
    onDeleteCollection: fn(),
  },
};

export const WeightInKg: Story = {
  args: {
    name: 'Heavy Pack',
    colorTheme: 'ocean',
    type: 'pack',
    itemCount: 12,
    totalWeight: '2.35',
    weightUnit: 'kg',
    onEditCollection: fn(),
    onDeleteCollection: fn(),
  },
};

export const WeightInLbs: Story = {
  args: {
    name: 'Heavy List',
    colorTheme: 'jungle',
    type: 'list',
    itemCount: 8,
    totalWeight: '5.18',
    weightUnit: 'lbs',
    onEditCollection: fn(),
    onDeleteCollection: fn(),
  },
};

export const WithCategoryWeights: Story = {
  args: {
    name: 'Pack with Categories',
    colorTheme: 'ocean',
    type: 'pack',
    itemCount: 12,
    totalWeight: '2.35',
    weightUnit: 'kg',
    categoryWeights: [
      { category: { name: 'Shelter', colorTheme: 'jungle' }, weight: '1.20 kg' },
      { category: { name: 'Clothing', colorTheme: 'sand' }, weight: '800 g' },
      { category: { name: 'Electronics', colorTheme: 'lavender' }, weight: '350 g' },
    ],
    onEditCollection: fn(),
    onDeleteCollection: fn(),
  },
};
