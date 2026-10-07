"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

type ToastType = "success" | "error" | "info";
type Toast = { id: number; message: string; type: ToastType };

const ICONS: Record<ToastType, string> = {
  success: "✓",
  error: "✗",
  info: "ℹ",
};

const BG: Record<ToastType, string> = {
  success: "bg-green-700 text-white",
  error: "bg-red-700 text-white",
  info: "bg-surface text-ink border border-line",
};

type ToastCtx = { toast: (message: string, type?: ToastType) => void };
const Ctx = createContext<ToastCtx | null>(null);

export function useToast(): ToastCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}

let nextId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string, type: ToastType = "info") => {
    const id = ++nextId;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  return (
    <Ctx.Provider value={{ toast }}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-0 z-50 flex flex-col items-center gap-2 px-5 pt-[max(1rem,env(safe-area-inset-top))]">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto animate-[toastIn_0.3s_ease-out,toastOut_0.3s_ease-in_2.7s_forwards] flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold shadow-lg ${BG[t.type]}`}
          >
            <span className="text-base">{ICONS[t.type]}</span>
            {t.message}
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}
