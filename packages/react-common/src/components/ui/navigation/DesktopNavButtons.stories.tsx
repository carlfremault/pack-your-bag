import type { Meta, StoryObj } from '@storybook/react-vite';

import { sampleNavTabs } from './constants';
import { DesktopNavButtons } from './DesktopNavButtons';

const meta: Meta<typeof DesktopNavButtons> = {
  title: 'Components/DesktopNavButtons',
  component: DesktopNavButtons,
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
