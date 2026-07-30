import { CategoryPill, CategoryPillProps } from '../pill/CategoryPill';
import { ExpandableText } from '../utils';

export interface AssistantItemCardProps {
  name: string;
  category: CategoryPillProps | null;
  note?: string;
  actions?: React.ReactNode;
}

export function AssistantItemCard(props: AssistantItemCardProps) {
  const { name, category, note, actions } = props;

  return (
    <div className="bg-surface text-primary border-primary-ring flex w-full flex-col justify-between gap-6 rounded-md border p-3 text-left shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <h3 className="text-sm font-bold wrap-anywhere">{name}</h3>
        {category && <CategoryPill {...category} />}
      </div>
      <div className="flex items-center justify-between gap-4">
        {note && <ExpandableText text={note} />}
        <div className="ml-auto flex items-center gap-2">{actions}</div>
      </div>
    </div>
  );
}
