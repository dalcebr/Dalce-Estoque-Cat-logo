export default function RelatoriosLoading() {
  return (
    <main className="min-h-dvh bg-page pb-10">
      <div className="h-[3px] bg-gradient-to-r from-brand via-blue-400 to-transparent" />
      <div className="mx-auto max-w-md px-5 pt-5">
        {/* header skeleton */}
        <div className="flex items-center gap-4">
          <div className="size-12 shrink-0 animate-pulse rounded-2xl bg-tint" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-32 animate-pulse rounded bg-tint" />
            <div className="h-7 w-52 animate-pulse rounded bg-tint" />
            <div className="h-3 w-44 animate-pulse rounded bg-tint" />
          </div>
        </div>
        {/* hero card skeleton */}
        <div className="mt-5 rounded-[28px] bg-brand/20 p-5">
          <div className="h-3 w-28 animate-pulse rounded bg-tint" />
          <div className="mt-2 h-9 w-40 animate-pulse rounded bg-tint" />
          <div className="mt-3 h-4 w-48 animate-pulse rounded bg-tint" />
        </div>
        {/* stat grid skeleton */}
        <div className="mt-3 grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-3xl border border-line bg-surface p-4">
              <div className="h-3 w-20 animate-pulse rounded bg-tint" />
              <div className="mt-2 h-6 w-24 animate-pulse rounded bg-tint" />
            </div>
          ))}
        </div>
        {/* chart skeleton */}
        <div className="mt-3 rounded-3xl border border-line bg-surface p-5">
          <div className="h-5 w-36 animate-pulse rounded bg-tint" />
          <div className="mt-4 h-40 w-full animate-pulse rounded-xl bg-tint" />
        </div>
      </div>
    </main>
  );
}
