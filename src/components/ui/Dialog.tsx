"use client";

import { ReactNode, useEffect, useRef } from "react";
import Button from "./Button";

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm?: () => void;
  loading?: boolean;
  confirmVariant?: "primary" | "danger";
  hideFooter?: boolean;
}

export default function Dialog({
  open,
  onClose,
  title,
  children,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  onConfirm,
  loading = false,
  confirmVariant = "primary",
  hideFooter = false,
}: DialogProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !loading) onClose();
    };
    if (open) document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, loading, onClose]);

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === overlayRef.current && !loading) onClose();
      }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-cafe/40 backdrop-blur-sm" />

      {/* Panel */}
      <div className="relative z-10 w-full max-w-md bg-maiz rounded-xl shadow-xl border border-cafe/10 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-cafe/10">
          <h2 className="font-heading font-semibold text-cafe text-lg">{title}</h2>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-cafe/50 hover:text-cafe transition-colors disabled:opacity-40 outline-none focus-visible:ring-2 focus-visible:ring-rojo-ladrillo rounded"
            aria-label="Cerrar"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path
                d="M15 5L5 15M5 5l10 10"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 overflow-y-auto flex-1">{children}</div>

        {/* Footer */}
        {!hideFooter && (
          <div className="flex justify-end gap-3 px-6 py-4 border-t border-cafe/10">
            <Button variant="ghost" onClick={onClose} disabled={loading}>
              {cancelLabel}
            </Button>
            {onConfirm && (
              <Button variant={confirmVariant} onClick={onConfirm} loading={loading}>
                {confirmLabel}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
