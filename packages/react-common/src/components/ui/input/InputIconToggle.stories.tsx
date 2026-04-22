import { MdArrowDownward, MdArrowUpward } from 'react-icons/md';

import type { Meta, StoryObj } from '@storybook/react';

import { InputIconToggle } from './InputIconToggle';

const meta: Meta<typeof InputIconToggle> = {
  component: InputIconToggle,
  args: {
    label: 'Order',
    options: [
      { value: 'asc', label: 'Ascending', icon: MdArrowUpward },
      { value: 'desc', label: 'Descending', icon: MdArrowDownward },
    ],
    onChange: () => {},
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
