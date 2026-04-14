import type { Meta, StoryObj } from '@storybook/react-vite';

import { DataTable } from './DataTable';

const meta: Meta<typeof DataTable> = {
  title: 'Components/DataTable',
  component: DataTable,
};
export default meta;

type Story = StoryObj<typeof meta>;

const sampleColumns = [
  {
    header: 'Name',
    accessorKey: 'name',
  },
  {
    header: 'Description',
    accessorKey: 'description',
  },
];

export const Default: Story = {
  args: {
    data: [
      {
        id: '1',
        name: 'Item 1',
        description: 'Item 1 description',
      },
      {
        id: '2',
        name: 'Item 2',
        description: 'Item 2 description',
      },
      {
        id: '3',
        name: 'Item 3',
        description: 'Item 3 description',
      },
    ],
    columns: sampleColumns,
  },
};

export const Empty: Story = {
  args: {
    data: [],
    columns: sampleColumns,
  },
};
