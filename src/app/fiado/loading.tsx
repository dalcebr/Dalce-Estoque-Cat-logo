export default function FiadoLoading() {
  return (
    <main className="min-h-dvh bg-page pb-10">
      <div className="h-[3px] bg-gradient-to-r from-brand via-blue-400 to-transparent" />
      <div className="mx-auto max-w-md px-5 pt-5">
        {/* header skeleton */}
        <div className="flex items-center gap-4">
          <div className="size-12 shrink-0 animate-pulse rounded-2xl bg-tint" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-20 animate-pulse rounded bg-tint" />
            <div className="h-7 w-40 animate-pulse rounded bg-tint" />
            <div className="h-3 w-32 animate-pulse rounded bg-tint" />
          </div>
        </div>
        {/* customer list skeleton */}
        <div className="mt-6 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 rounded-2xl border border-line bg-surface p-4">
              <div className="size-10 animate-pulse rounded-full bg-tint" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-28 animate-pulse rounded bg-tint" />
                <div className="h-3 w-20 animate-pulse rounded bg-tint" />
              </div>
              <div className="h-5 w-20 animate-pulse rounded-lg bg-tint" />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
