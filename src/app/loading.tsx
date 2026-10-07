export default function Loading() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-page">
      <div className="flex flex-col items-center gap-4">
        <span className="size-10 animate-spin rounded-full border-4 border-line border-t-brand" />
        <p className="text-soft">Carregando…</p>
      </div>
    </main>
  );
}
