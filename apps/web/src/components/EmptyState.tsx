import { NoResults } from '@repo/react-common/utils';

interface EmptyStateProps {
  message: string;
  suggestion: string;
  hasActiveFilters: boolean;
}

export function EmptyState({ message, suggestion, hasActiveFilters }: EmptyStateProps) {
  return (
    <NoResults>
      <p>{message}</p>
      <p>
        {hasActiveFilters
          ? "Try adjusting your filters to find what you're looking for."
          : suggestion}
      </p>
    </NoResults>
  );
}
