import type { Meta, StoryObj } from '@storybook/react-vite';

import { ExpandableCategoryPills } from './ExpandableCategoryPills';

const meta: Meta<typeof ExpandableCategoryPills> = {
  title: 'Components/ExpandableCategoryPills',
  component: ExpandableCategoryPills,
};
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    items: [
      { category: { name: 'Shelter', colorTheme: 'jungle' }, weight: '1.20 kg' },
      { category: { name: 'Clothing', colorTheme: 'sand' }, weight: '800 g' },
      { category: { name: 'Electronics', colorTheme: 'lavender' }, weight: '350 g' },
    ],
  },
};

export const ManyCategories: Story = {
  args: {
    items: [
      { category: { name: 'Shelter', colorTheme: 'jungle' }, weight: '1.20 kg' },
      { category: { name: 'Clothing', colorTheme: 'sand' }, weight: '800 g' },
      { category: { name: 'Electronics', colorTheme: 'lavender' }, weight: '350 g' },
      { category: { name: 'Food', colorTheme: 'ocean' }, weight: '600 g' },
      { category: { name: 'Navigation', colorTheme: 'lagoon' }, weight: '120 g' },
      { category: { name: 'First Aid', colorTheme: 'slate' }, weight: '200 g' },
      { category: { name: 'Tools', colorTheme: 'default' }, weight: '450 g' },
      { category: { name: 'Hygiene', colorTheme: 'sand' }, weight: '180 g' },
    ],
  },
};
