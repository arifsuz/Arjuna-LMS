"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  AlertTriangle,
  Info,
  CheckCircle2,
  AlertCircle,
  X,
  Loader2,
} from "lucide-react";

export interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void | Promise<void>;
  title: string;
  description?: string;
  children?: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info" | "success";
  loading?: boolean;
  hideCancel?: boolean;
}

export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  children,
  confirmText = "Lanjutkan",
  cancelText = "Batal",
  variant = "warning",
  loading = false,
  hideCancel = false,
}: ConfirmationModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !loading) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    // Prevent background scrolling while modal is open
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalStyle;
    };
  }, [isOpen, loading, onClose]);

  if (!isOpen || !mounted) return null;

  const variantStyles = {
    danger: {
      border: "border-red-500/40",
      iconBg: "bg-red-500/15 border-red-500/30 text-red-500",
      button:
        "bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/30",
      icon: AlertCircle,
    },
    warning: {
      border: "border-amber-500/40",
      iconBg: "bg-amber-500/15 border-amber-500/30 text-amber-500",
      button:
        "bg-[#C9A05C] hover:bg-[#ebd09e] hover:text-[#04132b] text-slate-900 font-bold shadow-lg shadow-[#C9A05C]/30",
      icon: AlertTriangle,
    },
    info: {
      border: "border-blue-500/40",
      iconBg: "bg-blue-500/15 border-blue-500/30 text-blue-500",
      button:
        "bg-[#0A3266] hover:bg-[#13498f] text-white shadow-lg shadow-[#0A3266]/30",
      icon: Info,
    },
    success: {
      border: "border-emerald-500/40",
      iconBg: "bg-emerald-500/15 border-emerald-500/30 text-emerald-500",
      button:
        "bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30",
      icon: CheckCircle2,
    },
  };

  const style = variantStyles[variant];
  const IconComponent = style.icon;

  const modalContent = (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-200">
      {/* Background overlay click */}
      <div
        className="fixed inset-0 -z-10"
        onClick={() => {
          if (!loading) onClose();
        }}
      />
      <div
        className={`glass-panel relative w-full max-w-md rounded-3xl p-6 sm:p-8 shadow-2xl border ${style.border} animate-in zoom-in-95 duration-200`}
        role="dialog"
        aria-modal="true"
      >
        {/* Close Button */}
        {!loading && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        )}

        {/* Header with Icon */}
        <div className="flex items-start gap-4 mb-4">
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border ${style.iconBg}`}
          >
            <IconComponent className="h-6 w-6" />
          </div>
          <div className="min-w-0 flex-1 pt-1">
            <h3 className="text-base sm:text-lg font-extrabold text-[#0A3266] dark:text-white leading-snug">
              {title}
            </h3>
            {description && (
              <p className="mt-1.5 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {description}
              </p>
            )}
          </div>
        </div>

        {/* Optional Custom Content */}
        {children && <div className="mt-4 mb-4">{children}</div>}

        {/* Action Buttons */}
        <div className="mt-6 flex items-center justify-end gap-3 pt-3 border-t border-black/10 dark:border-white/[0.08]">
          {!hideCancel && (
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="glass-button-secondary rounded-xl px-4 py-2.5 text-xs font-semibold disabled:opacity-50"
            >
              {cancelText}
            </button>
          )}

          {onConfirm ? (
            <button
              type="button"
              onClick={onConfirm}
              disabled={loading}
              className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold transition-all active:scale-95 disabled:opacity-50 ${style.button}`}
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              <span>{confirmText}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold transition-all active:scale-95 disabled:opacity-50 ${style.button}`}
            >
              <span>{confirmText}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
