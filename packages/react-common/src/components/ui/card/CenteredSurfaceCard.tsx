export type CenteredSurfaceCardProps = {
  title?: string;
  children: React.ReactNode;
};

export function CenteredSurfaceCard(props: CenteredSurfaceCardProps) {
  const { title, children } = props;

  return (
    <div className="flex h-full items-center justify-center">
      <div className="bg-surface border-primary-ring flex w-full max-w-md flex-col gap-6 rounded-md border p-4 shadow-sm">
        {title && <h1 className="text-primary text-xl">{title}</h1>}
        {children}
      </div>
    </div>
  );
}
