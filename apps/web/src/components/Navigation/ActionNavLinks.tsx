import { Suspense, useMemo } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';

import { LinkButton } from '@repo/react-common/button';

interface ActionNavLinksProps {
  onNavigate?: () => void;
}

export default function ActionNavLinks(props: ActionNavLinksProps) {
  return (
    <Suspense fallback={null}>
      <ActionNavLinksInner {...props} />
    </Suspense>
  );
}

function ActionNavLinksInner(props: ActionNavLinksProps) {
  const { onNavigate } = props;
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const query = useMemo(() => {
    const params = new URLSearchParams();
    const search = searchParams.get('search');
    const category = searchParams.get('category');
    const type = searchParams.get('type');
    const dateFrom = searchParams.get('from');
    const dateUntil = searchParams.get('until');
    const sortField = searchParams.get('sort');
    const sortDir = searchParams.get('dir');

    if (search) params.set('search', search);
    if (category) params.set('category', category);
    if (type) params.set('type', type);
    if (dateFrom) params.set('from', dateFrom);
    if (dateUntil) params.set('until', dateUntil);
    if (sortField) params.set('sort', sortField);
    if (sortDir) params.set('dir', sortDir);

    return params.toString();
  }, [searchParams]);

  const itemsView = pathname.startsWith('/items');
  const collectionsView =
    pathname.startsWith('/collections') ||
    pathname.startsWith('/list') ||
    pathname.startsWith('/pack');
  const tripsView = pathname.startsWith('/trips');

  return (
    <>
      <LinkButton
        href={`?action=add-item${query ? `&${query}` : ''}`}
        variant={itemsView ? 'solid' : 'outline'}
        color="primary"
        size="large"
        className="w-full"
        linkAs={Link}
        onClick={onNavigate}
      >
        Add new items
      </LinkButton>
      <LinkButton
        href={`?action=add-collection${query ? `&${query}` : ''}`}
        variant={collectionsView ? 'solid' : 'outline'}
        color="primary"
        size="large"
        className="w-full"
        linkAs={Link}
        onClick={onNavigate}
      >
        Add new collections
      </LinkButton>
      <LinkButton
        href={`?action=add-trip${query ? `&${query}` : ''}`}
        variant={tripsView ? 'solid' : 'outline'}
        color="primary"
        size="large"
        className="w-full"
        linkAs={Link}
        onClick={onNavigate}
      >
        Add new trips
      </LinkButton>
      <LinkButton
        href={`?action=manage-categories${query ? `&${query}` : ''}`}
        variant="outline"
        color="primary"
        size="large"
        className="w-full"
        linkAs={Link}
        onClick={onNavigate}
      >
        Manage categories
      </LinkButton>
    </>
  );
}
