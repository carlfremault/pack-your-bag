import { MdOutlineExplore } from 'react-icons/md';

import type { Meta, StoryObj } from '@storybook/react-vite';

import { Button } from '../button';

import { WelcomeCard } from './WelcomeCard';

const meta: Meta<typeof WelcomeCard> = {
  title: 'Components/WelcomeCard',
  component: WelcomeCard,
  argTypes: {},
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: (
      <Button variant="outline" className="w-full gap-2">
        Explore a sample trip
        <MdOutlineExplore size={24} className="text-primary shrink-0" aria-hidden="true" />
      </Button>
    ),
  },
};
