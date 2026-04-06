import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';

import MobileBottomNav from './MobileBottomNav';

const meta: Meta<typeof MobileBottomNav> = {
  title: 'Components/MobileBottomNav',
  component: MobileBottomNav,
  parameters: {
    layout: 'fullscreen',
  },
};
export default meta;

type Story = StoryObj<typeof meta>;

export const Items: Story = {
  args: {
    activeTab: 'items',
    onTabChange: fn(),
  },
};

export const Collections: Story = {
  args: {
    activeTab: 'collections',
    onTabChange: fn(),
  },
};

export const Trips: Story = {
  args: {
    activeTab: 'trips',
    onTabChange: fn(),
  },
};
