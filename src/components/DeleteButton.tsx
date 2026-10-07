"use client";
export default function DeleteButton({ action, label, confirmText }: { action: () => void | Promise<void>; label: string; confirmText: string }) {
  return (
    <form action={action} onSubmit={(e) => { if (!confirm(confirmText)) e.preventDefault(); }}>
      <button className="mt-3 w-full rounded-2xl border border-red-300 py-3.5 text-lg font-bold text-red-700">{label}</button>
    </form>
  );
}
