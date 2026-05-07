import type { Meta, StoryObj } from '@storybook/react-vite';

import { UnAuthenticatedHeader } from './UnAuthenticatedHeader';

const meta: Meta<typeof UnAuthenticatedHeader> = {
  title: 'Components/UnAuthenticatedHeader',
  component: UnAuthenticatedHeader,
  parameters: {
    layout: 'fullscreen',
  },
};
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
