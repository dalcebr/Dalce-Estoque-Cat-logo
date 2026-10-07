export default function CadastrosLoading() {
  return (
    <main className="min-h-dvh bg-page pb-10">
      <div className="h-[3px] bg-gradient-to-r from-brand via-blue-400 to-transparent" />
      <div className="mx-auto max-w-md px-5 pt-5">
        {/* header skeleton */}
        <div className="flex items-center gap-4">
          <div className="size-12 shrink-0 animate-pulse rounded-2xl bg-tint" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-24 animate-pulse rounded bg-tint" />
            <div className="h-7 w-56 animate-pulse rounded bg-tint" />
          </div>
        </div>
        {/* card list skeleton */}
        <div className="mt-6 divide-y divide-line overflow-hidden rounded-3xl border border-line bg-surface">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-5 py-4">
              <div className="size-14 shrink-0 animate-pulse rounded-2xl bg-tint" />
              <div className="flex-1 space-y-2">
                <div className="h-5 w-24 animate-pulse rounded bg-tint" />
                <div className="h-3 w-36 animate-pulse rounded bg-tint" />
              </div>
              <div className="size-5 animate-pulse rounded bg-tint" />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
