export default function VendasLoading() {
  return (
    <main className="min-h-dvh bg-page pb-40">
      <div className="h-[3px] bg-gradient-to-r from-brand via-blue-400 to-transparent" />
      <div className="mx-auto max-w-md px-5 pt-5">
        {/* header skeleton */}
        <div className="flex items-center gap-4">
          <div className="size-12 shrink-0 animate-pulse rounded-2xl bg-tint" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-24 animate-pulse rounded bg-tint" />
            <div className="h-7 w-44 animate-pulse rounded bg-tint" />
          </div>
        </div>
        {/* sales list skeleton */}
        <div className="mt-6 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 rounded-2xl border border-line bg-surface p-4">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="h-4 w-16 animate-pulse rounded bg-tint" />
                  <div className="h-3 w-12 animate-pulse rounded bg-tint" />
                </div>
                <div className="h-3 w-28 animate-pulse rounded bg-tint" />
              </div>
              <div className="h-5 w-20 animate-pulse rounded-lg bg-tint" />
            </div>
          ))}
        </div>
      </div>
      {/* footer skeleton */}
      <footer className="fixed inset-x-0 bottom-0 bg-brand px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-5">
        <div className="mx-auto max-w-md">
          <div className="h-3 w-28 animate-pulse rounded bg-white/30" />
          <div className="mt-2 flex items-end justify-between">
            <div className="h-9 w-36 animate-pulse rounded bg-white/30" />
            <div className="h-5 w-20 animate-pulse rounded bg-white/30" />
          </div>
        </div>
      </footer>
    </main>
  );
}
