import { CollectionType } from '../types';

export interface CollectionDetailsProps {
  type: CollectionType;
  id: string;
}

export default function CollectionDetails(props: CollectionDetailsProps) {
  const { type, id } = props;
  return (
    <div>
      Collection details for {type} {id}
    </div>
  );
}
