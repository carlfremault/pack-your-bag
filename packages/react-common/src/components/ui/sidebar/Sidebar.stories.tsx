import type { Meta, StoryObj } from '@storybook/react-vite';

import { Sidebar } from './Sidebar';

const meta: Meta<typeof Sidebar> = {
  title: 'Components/Sidebar',
  component: Sidebar,
  parameters: {
    layout: 'fullscreen',
  },
};
export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
  render: (args) => (
    <div className="bg-background flex h-screen w-full">
      <Sidebar {...args} />
      <main className="flex-1 p-6">
        <div className="bg-surface text-foreground rounded-lg p-4 shadow-sm">Main content area</div>
      </main>
    </div>
  ),
};
