"use client";

import { useState, useRef, useEffect } from "react";
import { useTheme, type Theme } from "@/lib/theme-context";
import { Sun, Moon, Laptop, Check, ChevronDown } from "lucide-react";

export function ThemeToggle({
  className = "",
  compact = false,
  variant = "dropdown",
}: {
  className?: string;
  compact?: boolean;
  variant?: "dropdown" | "segmented" | "full";
}) {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicked outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const options: { value: Theme; label: string; icon: any }[] = [
    { value: "light", label: "Terang", icon: Sun },
    { value: "dark", label: "Gelap", icon: Moon },
    { value: "system", label: "Sistem", icon: Laptop },
  ];

  // ─── Variant: Segmented Control Bar (Perfect for sidebar under logo) ───
  if (variant === "segmented") {
    return (
      <div
        className={`flex items-center gap-1 rounded-2xl border border-black/10 dark:border-[#C9A05C]/30 bg-black/[0.03] dark:bg-[#0A3266]/35 p-1 backdrop-blur-xl ${className}`}
      >
        {options.map((opt) => {
          const Icon = opt.icon;
          const isSelected = theme === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => setTheme(opt.value)}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-1.5 text-[11px] font-bold transition-all duration-200 ${
                isSelected
                  ? "bg-white dark:bg-[#C9A05C] text-[#0A3266] dark:text-[#04132b] shadow-md shadow-[#0A3266]/10 dark:shadow-[#C9A05C]/30 border border-black/5 dark:border-[#ebd09e]"
                  : "text-slate-500 dark:text-slate-300 hover:text-[#0A3266] dark:hover:text-[#FBF8F3] hover:bg-black/5 dark:hover:bg-white/5"
              }`}
              title={`Beralih ke Mode ${opt.label}`}
            >
              <Icon className="h-3.5 w-3.5 shrink-0" />
              <span>{opt.label}</span>
            </button>
          );
        })}
      </div>
    );
  }

  // ─── Variant: Full Width Dropdown ───
  if (variant === "full") {
    const currentOption = options.find((o) => o.value === theme) || options[0];
    const CurrentIcon =
      theme === "system"
        ? Laptop
        : resolvedTheme === "light"
          ? Sun
          : Moon;

    return (
      <div className={`relative ${className}`} ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="flex w-full items-center justify-between gap-2 rounded-2xl border border-black/10 dark:border-[#C9A05C]/30 bg-black/[0.03] dark:bg-[#0A3266]/35 px-3.5 py-2.5 text-xs font-semibold backdrop-blur-xl transition-all hover:border-[#C9A05C]/50"
        >
          <div className="flex items-center gap-2">
            <CurrentIcon className="h-4 w-4 text-[#C9A05C]" />
            <span className="text-[#0A3266] dark:text-[#FBF8F3]">
              Tema: <strong className="font-bold">{currentOption.label}</strong>
            </span>
          </div>
          <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
        </button>

        {open && (
          <div className="glass-panel animate-fade-in absolute left-0 right-0 top-full mt-2 z-50 rounded-2xl p-1.5 shadow-2xl border-[#C9A05C]/40 backdrop-blur-2xl">
            <div className="space-y-1">
              {options.map((opt) => {
                const Icon = opt.icon;
                const isSelected = theme === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      setTheme(opt.value);
                      setOpen(false);
                    }}
                    className={`flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition-all ${
                      isSelected
                        ? "bg-[#0A3266]/15 dark:bg-[#C9A05C]/25 text-[#0A3266] dark:text-[#FBF8F3] border border-[#C9A05C]/40"
                        : "text-slate-600 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/5"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className={`h-4 w-4 ${isSelected ? "text-[#C9A05C]" : "text-slate-400"}`} />
                      <span>{opt.label}</span>
                    </div>
                    {isSelected && <Check className="h-3.5 w-3.5 text-[#C9A05C]" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ─── Default Dropdown Button ───
  const currentIcon =
    theme === "system"
      ? Laptop
      : resolvedTheme === "light"
        ? Sun
        : Moon;

  const CurrentIconComponent = currentIcon;

  return (
    <div className={`relative inline-block ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="glass-button-secondary flex items-center gap-2 rounded-2xl px-3.5 py-2 text-xs font-semibold backdrop-blur-xl transition-all"
        title="Pengaturan Tema (Terang / Gelap / Sistem)"
        aria-label="Pengaturan Tema"
      >
        <CurrentIconComponent className="h-4 w-4 text-[#C9A05C] shrink-0" />
        {!compact && (
          <span className="hidden sm:inline">
            {theme === "system"
              ? "Sistem"
              : theme === "light"
                ? "Terang"
                : "Gelap"}
          </span>
        )}
      </button>

      {open && (
        <div className="glass-panel animate-fade-in absolute right-0 bottom-full mb-2 sm:bottom-auto sm:top-full sm:mt-2 z-50 min-w-[170px] rounded-2xl p-1.5 shadow-2xl border-[#C9A05C]/40 backdrop-blur-2xl">
          <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-[#dbb779]">
            Pilih Tema Tampilan
          </div>
          <div className="space-y-1">
            {options.map((opt) => {
              const Icon = opt.icon;
              const isSelected = theme === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    setTheme(opt.value);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition-all ${
                    isSelected
                      ? "bg-[#0A3266]/15 dark:bg-[#C9A05C]/25 text-[#0A3266] dark:text-[#FBF8F3] border border-[#C9A05C]/40"
                      : "text-slate-600 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/5"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Icon
                      className={`h-4 w-4 ${
                        isSelected ? "text-[#C9A05C]" : "text-slate-400"
                      }`}
                    />
                    <span>{opt.label}</span>
                  </div>
                  {isSelected && (
                    <Check className="h-3.5 w-3.5 text-[#C9A05C]" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
