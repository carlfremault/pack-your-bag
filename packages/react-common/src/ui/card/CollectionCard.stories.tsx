import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';

import CollectionCard from './CollectionCard';

const LONG_DESCRIPTION =
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Curabitur pretium tincidunt lacus. Nulla gravida orci a odio. Nullam varius, turpis et commodo pharetra, est eros bibendum elit, nec luctus magna felis sollicitudin mauris. Integer in mauris eu nibh euismod gravida. Duis ac tellus et risus vulputate vehicula. Donec lobortis risus a elit. Etiam tempor. Ut ullamcorper, ligula eu tempor congue, eros est euismod.';

const meta: Meta<typeof CollectionCard> = {
  title: 'Components/CollectionCard',
  component: CollectionCard,
};
export default meta;

type Story = StoryObj<typeof meta>;

export const ListWith10Items: Story = {
  args: {
    id: '1',
    name: 'List 1',
    description: 'Collection 1 description',
    colorTheme: 'ocean',
    type: 'list',
    numberOfItems: 10,
    handleOpenCollection: fn(),
  },
};

export const PackWith1Item: Story = {
  args: {
    id: '1',
    name: 'Pack 1',
    description: 'Collection 1 description',
    colorTheme: 'jungle',
    type: 'pack',
    numberOfItems: 1,
    handleOpenCollection: fn(),
  },
};

export const PackWithoutItems: Story = {
  args: {
    id: '1',
    name: 'Pack 1',
    description: 'Collection 1 description',
    colorTheme: 'jungle',
    type: 'pack',
    numberOfItems: 0,
    handleOpenCollection: fn(),
  },
};

export const ListWithoutDescription: Story = {
  args: {
    id: '1',
    name: 'List 1',
    colorTheme: 'lavender',
    type: 'list',
    numberOfItems: 10,
    handleOpenCollection: fn(),
  },
};

export const ListWithLongDescription: Story = {
  args: {
    id: '1',
    name: 'List 1',
    description: LONG_DESCRIPTION,
    colorTheme: 'slate',
    type: 'list',
    numberOfItems: 10,
    handleOpenCollection: fn(),
  },
};
