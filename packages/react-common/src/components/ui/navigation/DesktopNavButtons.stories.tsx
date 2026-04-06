import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';

import DesktopNavButtons from './DesktopNavButtons';

const meta: Meta<typeof DesktopNavButtons> = {
  title: 'Components/DesktopNavButtons',
  component: DesktopNavButtons,
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
