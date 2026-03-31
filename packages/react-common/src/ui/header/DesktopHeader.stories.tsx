import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';

import DesktopHeader from './DesktopHeader';

const meta: Meta<typeof DesktopHeader> = {
  title: 'Components/DesktopHeader',
  component: DesktopHeader,
  parameters: {
    layout: 'fullscreen',
  },
};
export default meta;

type Story = StoryObj<typeof meta>;

export const Items: Story = {
  args: {
    onSettingsClick: fn(),
    onTabChange: fn(),
    activeTab: 'items',
  },
};

export const Collections: Story = {
  args: {
    onSettingsClick: fn(),
    onTabChange: fn(),
    activeTab: 'collections',
  },
};

export const Trips: Story = {
  args: {
    onSettingsClick: fn(),
    onTabChange: fn(),
    activeTab: 'trips',
  },
};
