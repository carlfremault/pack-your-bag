import Button from '@/components/ui/buttons/button';
import Spinner from '@/components/ui/spinner';

interface TableHeaderProps {
  nbItems: number;
  isFetching: boolean;
  refetch: () => void;
}
export default function ItemsTableHeader(props: TableHeaderProps): React.ReactNode {
  const { nbItems, isFetching, refetch } = props;

  return (
    <div className="flex items-center justify-between">
      <p>Total items: {nbItems}</p>
      <Button onClick={refetch} disabled={isFetching} aria-busy={isFetching}>
        <span className="flex w-16 items-center justify-center">
          {isFetching ? <Spinner /> : 'Refetch'}
        </span>
      </Button>
    </div>
  );
}
