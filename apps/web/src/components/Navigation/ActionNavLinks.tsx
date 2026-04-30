import { Suspense, useMemo } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';

import { LinkButton } from '@repo/react-common/button';

interface ActionNavLinksProps {
  onNavigate?: () => void;
}

function ActionNavLinksInner(props: ActionNavLinksProps) {
  const { onNavigate } = props;
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const query = useMemo(() => {
    const params = new URLSearchParams();
    const search = searchParams.get('search');
    const category = searchParams.get('category');
    const sortField = searchParams.get('sort');
    const sortDir = searchParams.get('dir');

    if (search) params.set('search', search);
    if (category) params.set('category', category);
    if (sortField) params.set('sort', sortField);
    if (sortDir) params.set('dir', sortDir);

    return params.toString();
  }, [searchParams]);

  return (
    <>
      <LinkButton
        href={`?action=add-item${query ? `&${query}` : ''}`}
        variant={pathname.startsWith('/items') ? 'solid' : 'outline'}
        color="primary"
        size="large"
        className="w-full"
        linkAs={Link}
        onClick={onNavigate}
      >
        Add new item
      </LinkButton>
      <LinkButton
        href={`?action=add-collection${query ? `&${query}` : ''}`}
        variant={pathname.startsWith('/collections') ? 'solid' : 'outline'}
        color="primary"
        size="large"
        className="w-full"
        linkAs={Link}
        onClick={onNavigate}
      >
        Add new collection
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

export default function ActionNavLinks(props: ActionNavLinksProps) {
  return (
    <Suspense fallback={null}>
      <ActionNavLinksInner {...props} />
    </Suspense>
  );
}
