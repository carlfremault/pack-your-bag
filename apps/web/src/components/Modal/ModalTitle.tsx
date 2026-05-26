import { MdOutlineAdd, MdOutlineEdit } from 'react-icons/md';
import { MdOutlineExplore } from 'react-icons/md';
import { TbTrash } from 'react-icons/tb';

import classNames from 'classnames';

export function AddModalTitle({ label }: { label: string }) {
  return (
    <ModalTitleWrapper
      icon={<MdOutlineAdd size={16} className="text-primary" aria-hidden="true" />}
      label={label}
      type="add"
    />
  );
}

export function EditModalTitle({ label }: { label: string }) {
  return (
    <ModalTitleWrapper
      icon={<MdOutlineEdit size={16} className="text-primary" aria-hidden="true" />}
      label={label}
      type="edit"
    />
  );
}

export function DeleteModalTitle({ label }: { label: string }) {
  return (
    <ModalTitleWrapper
      icon={<TbTrash size={16} className="text-danger" aria-hidden="true" />}
      label={label}
      type="delete"
    />
  );
}

export function ExploreModalTitle({ label }: { label: string }) {
  return (
    <ModalTitleWrapper
      icon={<MdOutlineExplore size={16} className="text-primary" aria-hidden="true" />}
      label={label}
      type="explore"
    />
  );
}

type ModalTitleType = 'add' | 'edit' | 'delete' | 'explore';
interface ModalTitleWrapperProps {
  icon: React.ReactNode;
  label: string;
  type: ModalTitleType;
}

function ModalTitleWrapper(props: ModalTitleWrapperProps) {
  const { icon, label, type } = props;

  const color = type === 'delete' ? 'bg-danger/10' : 'bg-primary/10';
  const iconClassNames = classNames('flex h-8 w-8 items-center justify-center rounded-md', color);

  return (
    <div className="flex items-center gap-2.5">
      <div className={iconClassNames}>{icon}</div>
      <span>{label}</span>
    </div>
  );
}
