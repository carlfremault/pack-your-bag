import { AssistantItemCard } from '@repo/react-common/card';

import { toAssistantItemCardProps } from '@/lib/mappers/assistant.mapper';

import { AssistantItemForDisplay } from '../types';

type GeneratedItemsListProps = {
  generatedItems: AssistantItemForDisplay[];
  itemsActions: (item: AssistantItemForDisplay) => React.ReactNode;
};

export default function GeneratedItemsList(props: GeneratedItemsListProps) {
  const { generatedItems, itemsActions } = props;

  return generatedItems.map((item) => (
    <AssistantItemCard key={item.name} {...toAssistantItemCardProps(item, itemsActions(item))} />
  ));
}
