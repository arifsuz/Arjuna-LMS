"use client";

import React from "react";

interface StatGaugeProps {
  value: number; // 0 to 100 or 0.0 to 1.0 (auto-scaled)
  maxValue?: number;
  label: string;
  subLabel?: string;
  size?: number;
  strokeWidth?: number;
  color?: string;
  unit?: string;
  statusBadge?: string;
  statusType?: "success" | "warning" | "danger" | "info" | "gold";
  className?: string;
}

export function StatGauge({
  value,
  maxValue = 100,
  label,
  subLabel,
  size = 130,
  strokeWidth = 12,
  color,
  unit = "%",
  statusBadge,
  statusType = "gold",
  className = "",
}: StatGaugeProps) {
  // Normalize percentage
  const normalizedValue = maxValue === 1 ? value * 100 : value;
  const percentage = Math.min(Math.max(normalizedValue, 0), 100);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const defaultColor =
    percentage >= 80
      ? "#10B981" // Emerald
      : percentage >= 60
        ? "#C9A05C" // Warm Gold
        : percentage >= 40
          ? "#F59E0B" // Amber
          : "#EF4444"; // Rose

  const gaugeColor = color || defaultColor;

  const badgeStyles = {
    success: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
    warning: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
    danger: "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30",
    info: "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30",
    gold: "bg-[#C9A05C]/20 text-[#8c6828] dark:text-[#ebd09e] border-[#C9A05C]/40",
  }[statusType];

  return (
    <div className={`flex flex-col items-center justify-center p-3 text-center ${className}`}>
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="rotate-[-90deg]">
          {/* Background Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="transparent"
            className="text-black/5 dark:text-white/5"
          />
          {/* Active Progress */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={gaugeColor}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
            style={{
              filter: `drop-shadow(0 0 6px ${gaugeColor}66)`,
            }}
          />
        </svg>

        {/* Center Value */}
        <div className="absolute flex flex-col items-center justify-center">
          <span className="text-xl font-black font-mono text-[#0A3266] dark:text-white leading-tight">
            {maxValue === 1 ? value.toFixed(2) : Math.round(value)}
            <span className="text-xs font-normal text-slate-400 ml-0.5">{unit}</span>
          </span>
          {statusBadge && (
            <span className={`mt-0.5 rounded-full px-2 py-0.2 text-[9px] font-extrabold border ${badgeStyles}`}>
              {statusBadge}
            </span>
          )}
        </div>
      </div>

      <div className="mt-2.5">
        <h4 className="text-xs font-bold text-[#0A3266] dark:text-white leading-tight">
          {label}
        </h4>
        {subLabel && (
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
            {subLabel}
          </p>
        )}
      </div>
    </div>
  );
}
