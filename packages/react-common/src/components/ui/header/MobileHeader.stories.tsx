import type { Meta, StoryObj } from '@storybook/react-vite';

import { sampleSettingsLink } from '../navigation/constants';

import { MobileHeader } from './MobileHeader';

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
    settingsLink: sampleSettingsLink,
  },
};
