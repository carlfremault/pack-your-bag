import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';

import MobileHeader from './MobileHeader';

const meta: Meta<typeof MobileHeader> = {
  title: 'Components/MobileHeader',
  component: MobileHeader,
  parameters: {
    layout: 'fullscreen',
  },
};
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    onSettingsClick: fn(),
  },
};
