import PageHeader from "@/components/PageHeader";
import ThemeSwitch from "@/components/ThemeSwitch";
export default function Geral() {
  return (
    <main className="mx-auto min-h-dvh max-w-md bg-page px-5 pt-5">
      <PageHeader eyebrow="Ajustes · Geral" title="Preferências do terminal" back="/ajustes" />
      <section className="mt-6 overflow-hidden rounded-3xl border border-line bg-surface"><ThemeSwitch /></section>
    </main>
  );
}
