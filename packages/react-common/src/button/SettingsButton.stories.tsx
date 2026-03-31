import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';

import SettingsButton from './SettingsButton';

const meta: Meta<typeof SettingsButton> = {
  title: 'Components/SettingsButton',
  component: SettingsButton,
};
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    onClick: fn(),
  },
};
