"use client";

import React, { useState } from "react";

export interface DonutSegment {
  label: string;
  value: number;
  color: string;
  icon?: string;
}

interface DonutChartProps {
  data: DonutSegment[];
  size?: number;
  thickness?: number;
  centerLabel?: string;
  centerValue?: string | number;
  className?: string;
}

export function DonutChart({
  data,
  size = 180,
  thickness = 22,
  centerLabel,
  centerValue,
  className = "",
}: DonutChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const total = data.reduce((acc, cur) => acc + cur.value, 0);
  const radius = size / 2;
  const normalizedRadius = radius - thickness / 2;
  const circumference = normalizedRadius * 2 * Math.PI;

  let accumulatedPercent = 0;

  return (
    <div className={`flex flex-col items-center gap-4 ${className}`}>
      {/* Donut SVG */}
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="rotate-[-90deg] transition-all duration-300"
        >
          {/* Background Track */}
          <circle
            cx={radius}
            cy={radius}
            r={normalizedRadius}
            fill="transparent"
            stroke="currentColor"
            strokeWidth={thickness}
            className="text-black/5 dark:text-white/5"
          />

          {/* Segments */}
          {total > 0 &&
            data.map((segment, idx) => {
              if (segment.value === 0) return null;
              const percent = segment.value / total;
              const strokeDasharray = `${circumference * percent} ${circumference * (1 - percent)}`;
              const strokeDashoffset = -(circumference * accumulatedPercent);
              accumulatedPercent += percent;

              const isHovered = hoveredIdx === idx;

              return (
                <circle
                  key={segment.label}
                  cx={radius}
                  cy={radius}
                  r={normalizedRadius}
                  fill="transparent"
                  stroke={segment.color}
                  strokeWidth={isHovered ? thickness + 4 : thickness}
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                  className="transition-all duration-300 cursor-pointer origin-center hover:opacity-100"
                  style={{
                    filter: isHovered ? "drop-shadow(0px 0px 8px rgba(201, 160, 92, 0.5))" : "none",
                  }}
                />
              );
            })}
        </svg>

        {/* Center Text */}
        <div className="absolute flex flex-col items-center justify-center text-center pointer-events-none px-2">
          {hoveredIdx !== null ? (
            <>
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 truncate max-w-[90px]">
                {data[hoveredIdx].label}
              </span>
              <span className="text-base font-black text-[#0A3266] dark:text-white">
                {data[hoveredIdx].value}
              </span>
              <span className="text-[10px] font-semibold text-[#8c6828] dark:text-[#ebd09e]">
                {total > 0 ? Math.round((data[hoveredIdx].value / total) * 100) : 0}%
              </span>
            </>
          ) : (
            <>
              {centerValue !== undefined && (
                <span className="text-xl font-black text-[#0A3266] dark:text-white leading-tight">
                  {centerValue}
                </span>
              )}
              {centerLabel && (
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-[#dbb779]">
                  {centerLabel}
                </span>
              )}
            </>
          )}
        </div>
      </div>

      {/* Interactive Legend Grid */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 w-full text-xs">
        {data.map((segment, idx) => {
          const isHovered = hoveredIdx === idx;
          const percent = total > 0 ? Math.round((segment.value / total) * 100) : 0;

          return (
            <div
              key={segment.label}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              className={`flex items-center justify-between gap-2 rounded-xl px-2.5 py-1 transition-all cursor-pointer ${
                isHovered
                  ? "bg-black/5 dark:bg-white/10 scale-105"
                  : "hover:bg-black/[0.03] dark:hover:bg-white/[0.04]"
              }`}
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <span
                  className="h-2.5 w-2.5 rounded-full shrink-0 shadow-sm"
                  style={{ backgroundColor: segment.color }}
                />
                <span className="truncate font-semibold text-slate-700 dark:text-slate-300 text-[11px]">
                  {segment.label}
                </span>
              </div>
              <span className="font-mono font-bold text-[#0A3266] dark:text-[#ebd09e] text-[11px]">
                {segment.value} ({percent}%)
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
