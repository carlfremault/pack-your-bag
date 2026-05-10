import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';

import { InputSelect } from './InputSelect';

const meta: Meta<typeof InputSelect> = {
  title: 'Components/InputSelect',
  component: InputSelect,
};
export default meta;

type Story = StoryObj<typeof meta>;

const options = [
  { label: 'Clothing', value: '1' },
  { label: 'Electronics', value: '2' },
  { label: 'Food & Cooking', value: '3' },
  { label: 'Tools', value: '4' },
];

export const Default: Story = {
  args: {
    label: 'Category',
    options,
    value: '1',
    onChange: fn(),
  },
};

export const WithPlaceholder: Story = {
  args: {
    label: 'Category',
    options,
    value: '',
    placeholder: 'Select an option',
    onChange: fn(),
  },
};

export const Required: Story = {
  args: {
    label: 'Category',
    options,
    value: '',
    required: true,
    onChange: fn(),
  },
};

export const WithError: Story = {
  args: {
    label: 'Category',
    options,
    value: '',
    required: true,
    errorMessage: 'Please select a category',
    onChange: fn(),
  },
};

export const Disabled: Story = {
  args: {
    label: 'Category',
    options,
    value: '2',
    disabled: true,
    onChange: fn(),
  },
};
