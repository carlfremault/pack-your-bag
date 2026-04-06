import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';

import { colorThemes } from '../../../lib/colorThemes';
import { LONG_DESCRIPTION } from '../../../lib/constants';

import CategoryCard from './CategoryCard';

const meta: Meta<typeof CategoryCard> = {
  title: 'Components/CategoryCard',
  component: CategoryCard,
  argTypes: {
    colorTheme: {
      control: 'select',
      options: Object.keys(colorThemes),
    },
  },
};
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    id: 'category-1',
    name: 'Category',
    description: 'Category description',
    colorTheme: 'ocean',
    onEditCategory: fn(),
    onDeleteCategory: fn(),
  },
};

export const WithoutDescription: Story = {
  args: {
    id: 'category-2',
    name: 'Category',
    colorTheme: 'jungle',
    onEditCategory: fn(),
    onDeleteCategory: fn(),
  },
};

export const WithLongDescription: Story = {
  args: {
    id: 'category-3',
    name: 'Category',
    description: LONG_DESCRIPTION,
    colorTheme: 'rose',
    onEditCategory: fn(),
    onDeleteCategory: fn(),
  },
};

export const WithoutColorTheme: Story = {
  args: {
    id: 'category-4',
    name: 'Category',
    description: 'Category description',
    onEditCategory: fn(),
    onDeleteCategory: fn(),
  },
};
