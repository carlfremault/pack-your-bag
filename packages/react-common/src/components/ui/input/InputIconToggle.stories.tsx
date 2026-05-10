import { MdArrowDownward, MdArrowUpward } from 'react-icons/md';

import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';

import { InputIconToggle } from './InputIconToggle';

const optionsWithNull = [
  { value: 'asc', label: 'Ascending', icon: MdArrowUpward },
  { value: 'desc', label: 'Descending', icon: MdArrowDownward },
  { value: null, label: 'Default', icon: MdArrowUpward },
];

const meta: Meta<typeof InputIconToggle> = {
  title: 'Components/InputIconToggle',
  component: InputIconToggle,
};

export default meta;
type Story = StoryObj<typeof InputIconToggle>;

export const Default: Story = {
  args: {
    label: 'Order',
    value: 'asc',
    options: [
      { value: 'asc', label: 'Ascending', icon: MdArrowUpward },
      { value: 'desc', label: 'Descending', icon: MdArrowDownward },
    ],
    onChange: fn(),
  },
};

export const DescSelected: Story = {
  args: {
    label: 'Order',
    value: 'desc',
    options: [
      { value: 'asc', label: 'Ascending', icon: MdArrowUpward },
      { value: 'desc', label: 'Descending', icon: MdArrowDownward },
    ],
    onChange: fn(),
  },
};

export const NullOptionSelected: Story = {
  args: {
    label: 'Order',
    value: null,
    options: optionsWithNull,
    onChange: fn(),
  },
};

export const UndefinedValueWithNullOption: Story = {
  args: {
    label: 'Order',
    value: undefined,
    options: optionsWithNull,
    onChange: fn(),
  },
};
