import PageHeader from "@/components/PageHeader";
export default async function EmBreve({ searchParams }: { searchParams: Promise<{ p?: string }> }) {
  const { p } = await searchParams;
  return (
    <main className="mx-auto min-h-dvh max-w-md bg-page px-5 pt-5">
      <PageHeader eyebrow="Em construção" title={p ?? "Em breve"} back="/" />
      <p className="mt-6 text-soft">Esta área chega nas próximas etapas.</p>
    </main>
  );
}
