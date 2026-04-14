'use client';

import { useBreakpoint } from '@repo/react-common/hooks';

import { extractErrorMessage } from '@/utils/extract-error-message';

import { useAllItems } from '../queries';

import DesktopItemsTable from './DesktopItemsTable';
import MobileItemsList from './MobileItemsList';

function ItemsView() {
  const { data = [], isFetching, isError, error } = useAllItems();
  const { isDesktop } = useBreakpoint();

  const errorMessage = isError ? extractErrorMessage(error) : null;

  const handleEditItem = (id: string) => {
    console.log(id);
  };

  return isDesktop ? (
    <DesktopItemsTable items={data} isFetching={isFetching} errorMessage={errorMessage} />
  ) : (
    <MobileItemsList
      items={data}
      isFetching={isFetching}
      errorMessage={errorMessage}
      onEditItem={handleEditItem}
    />
  );
}

export default ItemsView;
