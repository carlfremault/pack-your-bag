import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';

import { QuantityStepper } from '../input';

import { AssistantItemCard } from './AssistantItemCard';

const meta: Meta<typeof AssistantItemCard> = {
  title: 'Components/AssistantItemCard',
  component: AssistantItemCard,
};
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    name: 'Item 1',
    note: 'This is a note',
    actions: <QuantityStepper quantity={2} onChange={fn()} />,
  },
};

export const WithCategoryAndLongNote: Story = {
  args: {
    ...Default.args,
    category: {
      name: 'Category 1',
      colorTheme: 'lavender',
    },
    note: 'This is a very long note that should wrap to multiple lines so we can test the wrapping behavior of this text in the card',
    actions: <QuantityStepper quantity={2} onChange={fn()} />,
  },
};

export const WithCategory: Story = {
  args: {
    ...Default.args,
    category: {
      name: 'Category 1',
      colorTheme: 'lavender',
    },
    actions: <QuantityStepper quantity={2} onChange={fn()} />,
  },
};

export const WithLongnameAndCategory: Story = {
  args: {
    ...Default.args,
    name: 'This is a very long item name that should wrap to multiple lines so we can test the wrapping behavior of this text in the card',
    category: {
      name: 'CategorynameCategoryname',
      colorTheme: 'lavender',
    },
    actions: <QuantityStepper quantity={1} onChange={fn()} />,
  },
};
