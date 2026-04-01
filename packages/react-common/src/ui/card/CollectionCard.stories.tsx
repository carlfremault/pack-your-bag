import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';

import { colorThemes } from '../../lib/colorThemes';
import { LONG_DESCRIPTION } from '../../lib/constants';

import CollectionCard from './CollectionCard';

const meta: Meta<typeof CollectionCard> = {
  title: 'Components/CollectionCard',
  component: CollectionCard,
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
    id: 'collection-1',
    name: 'List 1',
    description: 'Collection 1 description',
    colorTheme: 'ocean',
    type: 'list',
    numberOfItems: 10,
    onOpenCollection: fn(),
  },
};

export const PackWith1Item: Story = {
  args: {
    id: 'collection-2',
    name: 'Pack 1',
    description: 'Collection 1 description',
    colorTheme: 'jungle',
    type: 'pack',
    numberOfItems: 1,
    onOpenCollection: fn(),
  },
};

export const PackWithoutItems: Story = {
  args: {
    id: 'collection-3',
    name: 'Pack 1',
    description: 'Collection 1 description',
    colorTheme: 'lagoon',
    type: 'pack',
    numberOfItems: 0,
    onOpenCollection: fn(),
  },
};

export const ListWithoutDescription: Story = {
  args: {
    id: 'collection-4',
    name: 'List 1',
    colorTheme: 'lavender',
    type: 'list',
    numberOfItems: 10,
    onOpenCollection: fn(),
  },
};

export const ListWithLongDescription: Story = {
  args: {
    id: 'collection-5',
    name: 'List 1',
    description: LONG_DESCRIPTION,
    colorTheme: 'slate',
    type: 'list',
    numberOfItems: 10,
    onOpenCollection: fn(),
  },
};
