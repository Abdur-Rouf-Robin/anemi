export default function Loading() {
  return (
    <main className="page-shell py-10 pb-16">
      <div className="h-3 w-20 animate-pulse rounded bg-elevated" />
      <div className="mt-3 h-9 w-56 animate-pulse rounded-lg bg-elevated" />
      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
        {Array.from({ length: 12 }).map((_, index) => (
          <div key={index} className="aspect-2/3 animate-pulse rounded-xl bg-elevated" />
        ))}
      </div>
    </main>
  );
}
