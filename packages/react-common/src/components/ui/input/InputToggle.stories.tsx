import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';

import { InputToggle } from './InputToggle';

const options = [
  { value: 'option 1', label: 'Option 1' },
  { value: 'option 2', label: 'Option 2' },
];

const meta: Meta<typeof InputToggle> = {
  title: 'Components/InputToggle',
  component: InputToggle,
};
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { options, value: 'option 1', onChange: fn() },
};
