'use client';

import toast from 'react-hot-toast';
import { FiExternalLink } from 'react-icons/fi';
import Link from 'next/link';

import { ConfirmationDialog } from '@repo/react-common/confirmation-dialog';
import { CheckedWrapper, DangerWrapper, FormNotReady } from '@repo/react-common/utils';

import { Modal } from '@/components/Modal';
import { DeleteModalTitle } from '@/components/Modal/ModalTitle';

import { useCategoryDeleteImpact, useDeleteCategory } from '../queries';

const ERROR_LOADING_IMPACT =
  'There was an error loading impact data. You may proceed but note that any item which has this category assigned will be uncategorized.';
const NO_IMPACT = 'This category is not assigned to any item.';

interface CategoryDeleteModalProps {
  categoryId: string;
  categoryName: string;
  onClose: () => void;
  onCategoryDeleted: (name: string) => void;
}

export default function CategoryDeleteModal(props: CategoryDeleteModalProps) {
  const { categoryId, categoryName, onClose, onCategoryDeleted } = props;

  const { data, isLoading, isError } = useCategoryDeleteImpact(categoryId);
  const { mutate: deleteCategory, isPending: isDeleting } = useDeleteCategory();

  const confirmDeleteCategory = () => {
    deleteCategory(categoryId, {
      onSuccess: () => {
        onCategoryDeleted(categoryName);
        onClose();
        toast.success('Category deleted successfully');
      },
    });
  };

  const impactedItems = data?.items ?? [];

  return (
    <Modal.Root open onOpenChange={onClose}>
      <Modal.Content
        title={<DeleteModalTitle label="Delete Category" />}
        role="alertdialog"
        ariaDescribedBy="confirmation-dialog-desc"
        className="max-w-md"
      >
        <>
          <ImpactContent
            impactedItems={impactedItems}
            categoryName={categoryName}
            isLoading={isLoading}
            isError={isError}
          />
          <ConfirmationDialog
            isPending={isDeleting}
            isLoading={isLoading}
            onConfirm={confirmDeleteCategory}
            onClose={onClose}
            submitButtonColor="danger"
            submitButtonText="Delete"
          />
        </>
      </Modal.Content>
    </Modal.Root>
  );
}

interface ImpactContentProps {
  impactedItems: { id: string; name: string }[];
  categoryName: string;
  isLoading: boolean;
  isError: boolean;
}

function ImpactContent(props: ImpactContentProps) {
  const { impactedItems, categoryName, isLoading, isError } = props;

  let dialogContent: React.ReactNode;

  if (isLoading) {
    dialogContent = <FormNotReady />;
  } else if (isError) {
    dialogContent = (
      <>
        <DangerWrapper>{ERROR_LOADING_IMPACT}</DangerWrapper>
        <ViewAllImpactedItems categoryName={categoryName} />
      </>
    );
  } else if (impactedItems.length === 0) {
    dialogContent = <CheckedWrapper>{NO_IMPACT}</CheckedWrapper>;
  } else {
    dialogContent = (
      <>
        <CategoryImpact items={impactedItems} />
        {impactedItems.length > 3 && <ViewAllImpactedItems categoryName={categoryName} />}
      </>
    );
  }

  return (
    <div
      id="confirmation-dialog-desc"
      className="text-primary mb-6 flex flex-col gap-4 py-4 text-sm"
    >
      {dialogContent}
    </div>
  );
}

function CategoryImpact({ items }: { items: { id: string; name: string }[] }) {
  const itemsCount = items.length;

  return (
    <div className="flex flex-col">
      <p className="mb-4">
        This category is assigned to{' '}
        <strong className="font-medium">{`${itemsCount} item${itemsCount === 1 ? '' : 's'}`}</strong>
        . Deleting it will leave them uncategorized:
      </p>
      <p className="mb-2 text-xs font-medium tracking-wider uppercase">Affected items</p>
      <AffectedItemsList items={items} />
    </div>
  );
}

function AffectedItemsList({ items }: { items: { id: string; name: string }[] }) {
  return (
    <div className="border-primary-ring min-h-0 flex-1 overflow-y-auto rounded-md border">
      {items.slice(0, 3).map((item, index) => (
        <div
          key={item.id}
          className={`px-3 py-2 ${index > 0 ? 'border-primary-ring border-t' : ''}`}
        >
          <span>{item.name}</span>
        </div>
      ))}
      {items.length > 3 && (
        <div className="border-primary-ring border-t px-3 py-2">
          ... and {items.length - 3} more.
        </div>
      )}
    </div>
  );
}

function ViewAllImpactedItems({ categoryName }: { categoryName: string }) {
  return (
    <Link
      href={`/items?category=${encodeURIComponent(categoryName)}`}
      className="text-primary flex items-center gap-2 underline"
      target="_blank"
      rel="noopener"
    >
      View all items with this category
      <FiExternalLink />
    </Link>
  );
}
