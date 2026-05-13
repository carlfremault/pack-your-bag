'use client';

import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

import { ConfirmationDialog } from '@repo/react-common/confirmation-dialog';

import { Modal } from '@/components/Modal';
import { DeleteModalTitle } from '@/components/Modal/ModalTitle';

import { useDeleteTrip } from '../queries';

interface TripDeleteModalProps {
  tripId: string;
  onClose: () => void;
}

export default function TripDeleteModal(props: TripDeleteModalProps) {
  const { tripId, onClose } = props;

  const router = useRouter();

  const { mutate: deleteTrip, isPending: isDeleting } = useDeleteTrip();

  const confirmDeleteTrip = () => {
    deleteTrip(tripId, {
      onSuccess: () => {
        onClose();
        router.replace('/trips');
        toast.success('Trip deleted successfully');
      },
    });
  };

  return (
    <Modal.Root open onOpenChange={onClose}>
      <Modal.Content
        title={<DeleteModalTitle label="Delete Trip" />}
        role="alertdialog"
        ariaDescribedBy="confirmation-dialog-desc"
      >
        <p id="confirmation-dialog-desc" className="text-primary mb-6 py-4 text-sm">
          Are you sure you want to delete this trip?
        </p>
        <ConfirmationDialog
          isPending={isDeleting}
          onConfirm={confirmDeleteTrip}
          onClose={onClose}
          submitButtonColor="danger"
          submitButtonText="Delete"
        />
      </Modal.Content>
    </Modal.Root>
  );
}
