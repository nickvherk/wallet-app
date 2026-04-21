"use client";

import { Timeframe } from "@/lib/mockData";

const TIMEFRAMES: Timeframe[] = ["1D", "7D", "14D", "30D", "3M", "1Y", "ALL"];

interface TimeframeSelectorProps {
  value: Timeframe;
  onChange: (tf: Timeframe) => void;
  disabled?: boolean;
}

export default function TimeframeSelector({ value, onChange, disabled }: TimeframeSelectorProps) {
  return (
    <div className={`flex items-center gap-1 p-1 bg-[#13131a] border border-[#1e1e2e] rounded-xl w-fit transition-opacity ${disabled ? "opacity-50 pointer-events-none" : ""}`}>
      {TIMEFRAMES.map((tf) => (
        <button
          key={tf}
          onClick={() => onChange(tf)}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            value === tf
              ? "bg-[#9945FF] text-white shadow-[0_0_12px_rgba(153,69,255,0.4)]"
              : "text-gray-500 hover:text-gray-300 hover:bg-[#1a1a28]"
          }`}
        >
          {tf}
        </button>
      ))}
    </div>
  );
}
