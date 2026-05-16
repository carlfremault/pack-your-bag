import type { Meta, StoryObj } from '@storybook/react-vite';

import { WelcomeCard } from './WelcomeCard';

const meta: Meta<typeof WelcomeCard> = {
  title: 'Components/WelcomeCard',
  component: WelcomeCard,
  argTypes: {},
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};
