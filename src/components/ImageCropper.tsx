"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { Check, RotateCcw, X, ZoomIn, ZoomOut } from "lucide-react";
import type { CropArea } from "@/lib/image";

/**
 * Editor de recorte de imagem (mobile-first).
 * - Arraste a imagem para posicionar.
 * - Use o slider (ou pinça) para dar zoom.
 * - O recorte é quadrado (1:1), ideal para as fotos do produto.
 *
 * Devolve a área de recorte em pixels da imagem ORIGINAL via `onConfirm`.
 */
export default function ImageCropper({
  src,
  onCancel,
  onConfirm,
}: {
  src: string;
  onCancel: () => void;
  onConfirm: (crop: CropArea) => void;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [natural, setNatural] = useState({ w: 0, h: 0 });
  const [box, setBox] = useState(0); // lado do quadrado de recorte em px de tela
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 }); // deslocamento em px de tela
  const drag = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);
  const pinch = useRef<{ dist: number; zoom: number } | null>(null);

  // Mede o container para definir o quadrado de recorte.
  useEffect(() => {
    const measure = () => {
      const el = boxRef.current;
      if (!el) return;
      const size = Math.min(el.clientWidth, el.clientHeight);
      setBox(size);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  // Se a imagem já estiver em cache, o onLoad pode não disparar.
  useEffect(() => {
    const el = imgRef.current;
    if (el && el.complete && el.naturalWidth) {
      setNatural({ w: el.naturalWidth, h: el.naturalHeight });
    }
  }, [src]);

  // Escala base: quanto a imagem ocupa para "cobrir" o quadrado (cover).
  const baseScale = natural.w && box ? Math.max(box / natural.w, box / natural.h) : 1;
  const scale = baseScale * zoom;

  const dispW = natural.w * scale;
  const dispH = natural.h * scale;

  // Limita o deslocamento para nunca deixar buraco dentro do quadrado.
  const clamp = useCallback(
    (o: { x: number; y: number }, w: number, h: number) => {
      const maxX = Math.max(0, (w - box) / 2);
      const maxY = Math.max(0, (h - box) / 2);
      return {
        x: Math.min(maxX, Math.max(-maxX, o.x)),
        y: Math.min(maxY, Math.max(-maxY, o.y)),
      };
    },
    [box],
  );

  // Recentraliza quando a imagem carrega ou o zoom muda.
  useEffect(() => {
    setOffset((o) => clamp(o, dispW, dispH));
  }, [dispW, dispH, clamp]);

  function onPointerDown(e: React.PointerEvent) {
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    drag.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!drag.current) return;
    const dx = e.clientX - drag.current.x;
    const dy = e.clientY - drag.current.y;
    setOffset(clamp({ x: drag.current.ox + dx, y: drag.current.oy + dy }, dispW, dispH));
  }

  function onPointerUp() {
    drag.current = null;
  }

  // Pinça para zoom (dois dedos).
  function onTouchMove(e: React.TouchEvent) {
    if (e.touches.length !== 2) return;
    const [a, b] = [e.touches[0], e.touches[1]];
    const dist = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
    if (!pinch.current) {
      pinch.current = { dist, zoom };
      return;
    }
    const next = Math.min(4, Math.max(1, pinch.current.zoom * (dist / pinch.current.dist)));
    setZoom(next);
  }

  function onTouchEnd() {
    pinch.current = null;
  }

  function reset() {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  }

  function confirm() {
    if (!natural.w || !box) return;
    // Converte o quadrado de tela para coordenadas da imagem original.
    const cropSize = box / scale;
    const cx = natural.w / 2 - offset.x / scale;
    const cy = natural.h / 2 - offset.y / scale;
    const x = Math.min(natural.w - cropSize, Math.max(0, cx - cropSize / 2));
    const y = Math.min(natural.h - cropSize, Math.max(0, cy - cropSize / 2));
    onConfirm({ x, y, width: cropSize, height: cropSize });
  }

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-black/95 text-white">
      <div className="flex items-center justify-between px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <button type="button" onClick={onCancel} className="flex items-center gap-1 rounded-xl px-3 py-2 text-sm font-semibold text-white/80">
          <X size={18} /> Cancelar
        </button>
        <span className="text-sm font-bold uppercase tracking-[0.15em] text-white/70">Ajustar foto</span>
        <button type="button" onClick={reset} className="flex items-center gap-1 rounded-xl px-3 py-2 text-sm font-semibold text-white/80">
          <RotateCcw size={16} /> Resetar
        </button>
      </div>

      <div ref={boxRef} className="relative flex-1 overflow-hidden">
        <div
          className="absolute inset-0 touch-none select-none"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          {/* Imagem posicionada no centro do container */}
          <img
            ref={imgRef}
            src={src}
            alt="Pré-visualização do recorte"
            draggable={false}
            onLoad={(e) => {
              const el = e.currentTarget;
              setNatural({ w: el.naturalWidth, h: el.naturalHeight });
            }}
            className="pointer-events-none absolute left-1/2 top-1/2 max-w-none"
            style={{
              width: dispW || undefined,
              height: dispH || undefined,
              transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px))`,
            }}
          />
        </div>

        {/* Máscara com "buraco" quadrado no centro */}
        <div className="pointer-events-none absolute inset-0">
          <div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-2xl ring-2 ring-white/90"
            style={{
              width: box,
              height: box,
              boxShadow: "0 0 0 9999px rgba(0,0,0,0.6)",
            }}
          />
        </div>
      </div>

      <div className="space-y-4 px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="flex items-center gap-3">
          <ZoomOut size={18} className="text-white/70" />
          <input
            type="range"
            min={1}
            max={4}
            step={0.01}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="h-1.5 flex-1 accent-white"
            aria-label="Zoom"
          />
          <ZoomIn size={18} className="text-white/70" />
        </div>
        <p className="text-center text-xs text-white/60">Arraste para posicionar · pinça ou slider para dar zoom</p>
        <button
          type="button"
          onClick={confirm}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-brand py-4 text-lg font-bold text-white"
        >
          <Check size={20} /> Usar esta foto
        </button>
      </div>
    </div>
  );
}
