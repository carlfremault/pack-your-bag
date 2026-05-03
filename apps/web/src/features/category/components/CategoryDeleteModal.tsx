'use client';

import toast from 'react-hot-toast';
import { HiOutlineArrowUpRight } from 'react-icons/hi2';
import { MdArrowRight } from 'react-icons/md';
import Link from 'next/link';

import { Button, SubmitButton } from '@repo/react-common/button';
import { FormNotReady } from '@repo/react-common/utils';

import { Modal } from '@/components/Modal';

import { useCategoryDeleteImpact, useDeleteCategory } from '../queries';

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

  const confirmDeleteCategory = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    deleteCategory(categoryId, {
      onSuccess: () => {
        onCategoryDeleted(categoryName);
        onClose();
        toast.success('Category deleted successfully');
      },
    });
  };

  const impactedItems = data?.items ?? [];
  const impactedItemsCount = impactedItems.length;
  const firstThreeImpactedItems = impactedItems.slice(0, 3);

  let dialogContent: React.ReactNode;
  if (isLoading) {
    dialogContent = <FormNotReady />;
  } else if (isError) {
    dialogContent = (
      <div className="bg-danger/10 border-danger flex flex-col gap-2 rounded-md border p-4">
        <p className="text-danger">
          Could not load impact data. Any item which has this category assigned will be
          uncategorized. You can check manually on the items page or try again later.
        </p>
        <Link
          href={`/items?category=${encodeURIComponent(categoryName)}`}
          className="text-primary flex items-center gap-2 underline"
        >
          View all affected items
          <HiOutlineArrowUpRight />
        </Link>
        <p className="text-danger">If you are sure you may still proceed with deletion.</p>
      </div>
    );
  } else if (impactedItemsCount === 0) {
    dialogContent = <p>This category is not assigned to any item.</p>;
  } else {
    dialogContent = (
      <>
        <div>
          <p>
            This category is assigned to{' '}
            <strong>{`${impactedItemsCount} item${impactedItemsCount === 1 ? '' : 's'}`}</strong>.
          </p>
          <p>Deleting it will leave them uncategorized:</p>
        </div>

        <div className="bg-primary-ring/50 border-info rounded-md border p-1">
          {firstThreeImpactedItems.map((item) => (
            <div key={item.id} className="flex items-center">
              <MdArrowRight className="h-4 w-4" />
              {item.name}
            </div>
          ))}
          {impactedItemsCount > 3 && <div className="">... and {impactedItemsCount - 3} more.</div>}
        </div>
        {impactedItemsCount > 3 && (
          <Link
            href={`/items?category=${encodeURIComponent(categoryName)}`}
            className="text-primary flex items-center gap-2 underline"
          >
            View all affected items
            <HiOutlineArrowUpRight />
          </Link>
        )}
      </>
    );
  }

  return (
    <Modal.Root open onOpenChange={onClose}>
      <Modal.Content
        title="Delete Category"
        role="alertdialog"
        ariaDescribedBy="confirmation-dialog-desc"
        className="max-w-md"
      >
        <>
          <div id="confirmation-dialog-desc" className="text-primary mb-6 flex flex-col gap-4 py-4">
            {dialogContent}
          </div>
          <form onSubmit={confirmDeleteCategory} className="flex items-center gap-2 lg:justify-end">
            <Button
              variant="outline"
              color="primary"
              type="button"
              onClick={onClose}
              disabled={isDeleting}
              className="w-full lg:w-auto"
            >
              Cancel
            </Button>
            <SubmitButton
              color="danger"
              pending={isDeleting}
              disabled={isLoading}
              className="w-full lg:w-auto"
            >
              Delete
            </SubmitButton>
          </form>
        </>
      </Modal.Content>
    </Modal.Root>
  );
}
