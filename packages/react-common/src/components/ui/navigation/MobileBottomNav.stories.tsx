import type { Meta, StoryObj } from '@storybook/react-vite';

import { sampleNavTabs } from './constants';
import { MobileBottomNav } from './MobileBottomNav';

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
    tabs: sampleNavTabs,
    activeTabId: 'items',
  },
};

export const Collections: Story = {
  args: {
    tabs: sampleNavTabs,
    activeTabId: 'collections',
  },
};

export const Trips: Story = {
  args: {
    tabs: sampleNavTabs,
    activeTabId: 'trips',
  },
};
