"use client";

import { useRef, useState, useEffect, useCallback } from "react";

export default function DeleteButton({ action, label, confirmText }: { action: () => void | Promise<void>; label: string; confirmText: string }) {
  const [showConfirm, setShowConfirm] = useState(false);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setShowConfirm(false), []);

  // Focus the cancel button when the dialog opens
  useEffect(() => {
    if (showConfirm) cancelRef.current?.focus();
  }, [showConfirm]);

  // Close on Escape and trap focus within the dialog
  useEffect(() => {
    if (!showConfirm) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        close();
        return;
      }
      if (e.key === "Tab" && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>("button, [tabindex]");
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [showConfirm, close]);

  return (
    <>
      <button type="button" onClick={() => setShowConfirm(true)} className="w-full rounded-2xl border border-red-300 py-3.5 text-lg font-bold text-red-700">
        {label}
      </button>

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" role="presentation">
          <div className="absolute inset-0 bg-black/50" onClick={close} />
          <div ref={dialogRef} role="alertdialog" aria-modal="true" aria-labelledby="delete-title" aria-describedby="delete-desc" className="relative z-10 mx-5 w-full max-w-sm rounded-2xl bg-surface p-6 shadow-xl">
            <h2 id="delete-title" className="text-lg font-bold text-ink">Confirmar exclusão</h2>
            <p id="delete-desc" className="mt-2 text-soft">{confirmText}</p>
            <div className="mt-5 flex gap-3">
              <button ref={cancelRef} type="button" onClick={close} className="flex-1 rounded-xl border border-line py-3 font-bold text-ink">
                Cancelar
              </button>
              <form action={action} className="flex-1">
                <button type="submit" className="w-full rounded-xl bg-red-700 py-3 font-bold text-white">
                  Excluir
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
