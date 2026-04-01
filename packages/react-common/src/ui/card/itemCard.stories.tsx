import { MdOutlineEdit } from 'react-icons/md';

import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';

import Button from '../button/Button';

import ItemCard from './itemCard';

const LONG_DESCRIPTION =
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Curabitur pretium tincidunt lacus. Nulla gravida orci a odio. Nullam varius, turpis et commodo pharetra, est eros bibendum elit, nec luctus magna felis sollicitudin mauris. Integer in mauris eu nibh euismod gravida. Duis ac tellus et risus vulputate vehicula. Donec lobortis risus a elit. Etiam tempor. Ut ullamcorper, ligula eu tempor congue, eros est euismod.';

const meta: Meta<typeof ItemCard> = {
  title: 'Components/ItemCard',
  component: ItemCard,
};
export default meta;

type Story = StoryObj<typeof ItemCard>;

export const Default: Story = {
  args: {
    id: '1',
    name: 'Item 1',
    description: 'Item 1 description',
    category: {
      label: 'Category 1',
      color: 'jungle',
    },
    weight: 10,
    weightUnit: 'kg',
    handleEditItem: fn(),
  },
};

export const WithActions: Story = {
  args: {
    id: '1',
    name: 'Item 1',
    description: 'Item 1 description',
    handleEditItem: fn(),
    actions: (
      <Button variant="unstyledIcon" color="primary" aria-label="Edit Item 1" onClick={fn()}>
        <MdOutlineEdit className="text-primary/80 hover:text-primary h-5 w-5 transition-colors md:ml-4" />
      </Button>
    ),
  },
};

export const NoCategory: Story = {
  args: {
    id: '1',
    name: 'Item 1',
    description: 'Item 1 description',
    weight: 10,
    weightUnit: 'kg',
    handleEditItem: fn(),
  },
};

export const NoWeight: Story = {
  args: {
    id: '1',
    name: 'Item 1',
    description: 'Item 1 description',
    handleEditItem: fn(),
  },
};

export const WeightButNoWeightUnit: Story = {
  args: {
    id: '1',
    name: 'Item 1',
    description: 'Item 1 description',
    weight: 10,
    handleEditItem: fn(),
  },
};

export const NoDescription: Story = {
  args: {
    id: '1',
    name: 'Item 1',
    handleEditItem: fn(),
  },
};

export const DescriptionWith1000Characters: Story = {
  args: {
    id: '1',
    name: 'Item 1',
    description: LONG_DESCRIPTION,
    weight: 10,
    weightUnit: 'kg',
    handleEditItem: fn(),
  },
};

export const DescriptionWith1000CharactersAndActions: Story = {
  args: {
    id: '1',
    name: 'Item 1',
    description: LONG_DESCRIPTION,
    weight: 10,
    weightUnit: 'kg',
    handleEditItem: fn(),
    actions: (
      <Button variant="unstyledIcon" color="primary" aria-label="Edit Item 1" onClick={fn()}>
        <MdOutlineEdit className="text-primary/80 hover:text-primary h-5 w-5 transition-colors md:ml-4" />
      </Button>
    ),
  },
};
