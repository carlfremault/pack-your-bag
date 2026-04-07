import type { Meta, StoryObj } from '@storybook/react-vite';

import { sampleNavTabs, sampleSettingsLink } from '../navigation/constants';

import { DesktopHeader } from './DesktopHeader';

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
    tabs: sampleNavTabs,
    settingsLink: sampleSettingsLink,
    activeTabId: 'items',
  },
};

export const Collections: Story = {
  args: {
    tabs: sampleNavTabs,
    settingsLink: sampleSettingsLink,
    activeTabId: 'collections',
  },
};

export const Trips: Story = {
  args: {
    tabs: sampleNavTabs,
    settingsLink: sampleSettingsLink,
    activeTabId: 'trips',
  },
};
