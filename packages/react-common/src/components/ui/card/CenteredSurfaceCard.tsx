export type CenteredSurfaceCardProps = {
  title?: string;
  children: React.ReactNode;
};

export function CenteredSurfaceCard(props: CenteredSurfaceCardProps) {
  const { title, children } = props;

  return (
    <div className="flex w-full flex-1 items-center justify-center md:min-w-md">
      <div className="bg-surface border-primary-ring flex w-full max-w-md flex-col gap-6 rounded-md border p-4 shadow-sm">
        {title && <h1 className="text-primary text-xl">{title}</h1>}
        {children}
      </div>
    </div>
  );
}
