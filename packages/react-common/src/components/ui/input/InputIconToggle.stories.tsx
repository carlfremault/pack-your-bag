import { MdArrowDownward, MdArrowUpward } from 'react-icons/md';

import type { Meta, StoryObj } from '@storybook/react';
import { fn } from 'storybook/test';

import { InputIconToggle } from './InputIconToggle';

const optionsWithNull = [
  { value: 'asc', label: 'Ascending', icon: MdArrowUpward },
  { value: 'desc', label: 'Descending', icon: MdArrowDownward },
  { value: null, label: 'Default', icon: MdArrowUpward },
];

const meta: Meta<typeof InputIconToggle> = {
  component: InputIconToggle,
  args: {
    label: 'Order',
    options: [
      { value: 'asc', label: 'Ascending', icon: MdArrowUpward },
      { value: 'desc', label: 'Descending', icon: MdArrowDownward },
    ],
    onChange: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof InputIconToggle>;

export const Default: Story = {
  args: { value: 'asc' },
};

export const DescSelected: Story = {
  args: { value: 'desc' },
};

export const NullOptionSelected: Story = {
  args: { options: optionsWithNull, value: null },
};

export const UndefinedValueWithNullOption: Story = {
  args: { options: optionsWithNull, value: undefined },
};
