import type { Meta, StoryObj } from '@storybook/react-vite';

import { CenteredSurfaceCard } from './CenteredSurfaceCard';

const meta: Meta<typeof CenteredSurfaceCard> = {
  title: 'Components/CenteredSurfaceCard',
  component: CenteredSurfaceCard,
};
export default meta;

type Story = StoryObj<typeof meta>;

export const WithTitle: Story = {
  args: {
    title: 'Centered Surface Card',
    children: <div>Centered Surface Card</div>,
  },
};

export const WithoutTitle: Story = {
  args: {
    children: <div>Centered Surface Card Content</div>,
  },
};
