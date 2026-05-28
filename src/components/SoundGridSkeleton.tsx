export function SoundGridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {Array.from({ length: 10 }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse rounded-2xl border border-card-border bg-card p-4"
        >
          <div className="mb-3 h-10 w-10 rounded-full bg-surface" />
          <div className="mb-2 h-4 w-3/4 rounded bg-surface" />
          <div className="h-3 w-1/2 rounded bg-surface-hover" />
        </div>
      ))}
    </div>
  );
}
