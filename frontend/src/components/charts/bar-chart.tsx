"use client";

import React, { useState } from "react";

export interface BarDataPoint {
  label: string;
  value: number;
  secondaryValue?: number;
  color?: string;
  category?: string;
}

interface BarChartProps {
  data: BarDataPoint[];
  height?: number;
  showValues?: boolean;
  valueSuffix?: string;
  orientation?: "vertical" | "horizontal";
  className?: string;
}

export function BarChart({
  data,
  height = 180,
  showValues = true,
  valueSuffix = "",
  orientation = "vertical",
  className = "",
}: BarChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const maxValue = Math.max(...data.map((d) => d.value), 1);

  if (orientation === "horizontal") {
    return (
      <div className={`space-y-3 w-full ${className}`}>
        {data.map((item, idx) => {
          const percent = Math.round((item.value / maxValue) * 100);
          const isHovered = hoveredIdx === idx;

          return (
            <div
              key={item.label}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              className="space-y-1 group cursor-pointer"
            >
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-slate-700 dark:text-slate-200 group-hover:text-[#0A3266] dark:group-hover:text-[#ebd09e] transition-colors">
                  {item.label}
                </span>
                <span className="font-mono font-bold text-[#0A3266] dark:text-[#ebd09e]">
                  {item.value}
                  {valueSuffix}
                </span>
              </div>
              <div className="h-3 w-full rounded-full bg-black/5 dark:bg-white/5 overflow-hidden p-0.5">
                <div
                  className="h-full rounded-full transition-all duration-500 ease-out"
                  style={{
                    width: `${percent}%`,
                    backgroundColor: item.color || "var(--primary, #C9A05C)",
                    filter: isHovered ? "brightness(1.15) drop-shadow(0 0 4px rgba(201,160,92,0.6))" : "none",
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className={`w-full flex flex-col justify-end ${className}`} style={{ height: height + 50 }}>
      {/* Chart Bars Area */}
      <div className="flex items-end justify-between gap-2.5 w-full pt-4 border-b border-black/10 dark:border-white/10" style={{ height }}>
        {data.map((item, idx) => {
          const heightPercent = Math.max(Math.round((item.value / maxValue) * 100), 4);
          const isHovered = hoveredIdx === idx;

          return (
            <div
              key={item.label}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              className="flex-1 flex flex-col items-center justify-end h-full group relative cursor-pointer"
            >
              {/* Tooltip on Hover */}
              {isHovered && (
                <div className="absolute -top-10 z-20 rounded-lg bg-[#0A3266] dark:bg-black/90 text-white px-2 py-1 text-[11px] font-bold shadow-xl whitespace-nowrap animate-in fade-in duration-150 border border-[#C9A05C]/40">
                  {item.label}: {item.value}
                  {valueSuffix}
                </div>
              )}

              {/* Value Label above bar */}
              {showValues && (
                <span
                  className={`text-[10px] font-mono font-bold mb-1 transition-colors ${
                    isHovered ? "text-[#0A3266] dark:text-[#ebd09e] scale-110" : "text-slate-400"
                  }`}
                >
                  {item.value}
                </span>
              )}

              {/* Bar */}
              <div
                className="w-full max-w-[42px] rounded-t-xl transition-all duration-300 ease-out"
                style={{
                  height: `${heightPercent}%`,
                  backgroundColor: item.color || "#C9A05C",
                  opacity: hoveredIdx !== null && !isHovered ? 0.45 : 1,
                  transform: isHovered ? "scaleY(1.04)" : "scaleY(1)",
                  transformOrigin: "bottom",
                  boxShadow: isHovered ? "0 0 12px rgba(201, 160, 92, 0.5)" : "none",
                }}
              />
            </div>
          );
        })}
      </div>

      {/* X-Axis Labels */}
      <div className="flex items-center justify-between gap-2.5 w-full pt-2">
        {data.map((item, idx) => {
          const isHovered = hoveredIdx === idx;

          return (
            <div
              key={item.label}
              className={`flex-1 text-center text-[10px] font-bold truncate transition-colors ${
                isHovered ? "text-[#0A3266] dark:text-[#ebd09e]" : "text-slate-500 dark:text-slate-400"
              }`}
              title={item.label}
            >
              {item.label}
            </div>
          );
        })}
      </div>
    </div>
  );
}
