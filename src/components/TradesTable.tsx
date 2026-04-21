"use client";

import { useState } from "react";
import { Trade } from "@/lib/mockData";

type SortKey = "token" | "buyPrice" | "sellPrice" | "pnl" | "pnlPercent" | "date";
type SortDir = "asc" | "desc";

interface TradesTableProps {
  trades: Trade[];
}

function fmtPrice(v: number): string {
  if (v < 0.001) return v.toFixed(6);
  if (v < 0.01) return v.toFixed(5);
  if (v < 1) return v.toFixed(4);
  return v.toFixed(2);
}

function fmtPnl(v: number): string {
  const abs = Math.abs(v);
  const sign = v >= 0 ? "+" : "-";
  if (abs >= 1000) return `${sign}$${(abs / 1000).toFixed(2)}K`;
  return `${sign}$${abs.toFixed(2)}`;
}

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  return (
    <span className={`inline-flex flex-col ml-1.5 gap-px transition-opacity ${active ? "opacity-100" : "opacity-30"}`}>
      <svg width="8" height="5" viewBox="0 0 8 5" fill="currentColor" className={dir === "asc" && active ? "text-[#9945FF]" : "text-gray-500"}>
        <path d="M4 0L8 5H0L4 0Z" />
      </svg>
      <svg width="8" height="5" viewBox="0 0 8 5" fill="currentColor" className={dir === "desc" && active ? "text-[#9945FF]" : "text-gray-500"}>
        <path d="M4 5L0 0H8L4 5Z" />
      </svg>
    </span>
  );
}

export default function TradesTable({ trades }: TradesTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const sorted = [...trades].sort((a, b) => {
    let av: string | number = a[sortKey];
    let bv: string | number = b[sortKey];
    if (sortKey === "token") {
      av = a.ticker;
      bv = b.ticker;
    }
    if (av < bv) return sortDir === "asc" ? -1 : 1;
    if (av > bv) return sortDir === "asc" ? 1 : -1;
    return 0;
  });

  const cols: { key: SortKey; label: string; align?: string }[] = [
    { key: "token",      label: "Token"     },
    { key: "buyPrice",   label: "Buy Price", align: "right" },
    { key: "sellPrice",  label: "Sell Price", align: "right" },
    { key: "pnl",        label: "PnL ($)",   align: "right" },
    { key: "pnlPercent", label: "PnL (%)",   align: "right" },
    { key: "date",       label: "Date",      align: "right" },
  ];

  return (
    <div className="bg-[#0f0f17] border border-[#1e1e2e] rounded-2xl overflow-hidden">
      <div className="px-6 py-5 border-b border-[#1e1e2e] flex items-center justify-between">
        <span className="font-semibold text-white">All Trades</span>
        <span className="text-xs text-gray-600">{trades.length} trades</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#1a1a28]">
              <th className="w-10 px-4 py-3 text-left">
                <span className="text-xs text-gray-600 font-medium">#</span>
              </th>
              {cols.map((col) => (
                <th
                  key={col.key}
                  className={`px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-300 select-none transition-colors whitespace-nowrap ${col.align === "right" ? "text-right" : "text-left"}`}
                  onClick={() => handleSort(col.key)}
                >
                  <span className="inline-flex items-center gap-0.5">
                    {col.label}
                    <SortIcon active={sortKey === col.key} dir={sortDir} />
                  </span>
                </th>
              ))}
              <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-right">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#13131a]">
            {sorted.map((trade, i) => {
              const isWin = trade.status === "win";
              return (
                <tr
                  key={trade.id}
                  className="hover:bg-[#13131a] transition-colors group"
                >
                  <td className="px-4 py-4 text-xs text-gray-700 font-mono">{i + 1}</td>

                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#1a1a28] flex items-center justify-center shrink-0">
                        <span className="text-[10px] font-bold text-gray-400">
                          {trade.ticker.slice(0, 2)}
                        </span>
                      </div>
                      <div>
                        <div className="font-semibold text-white text-sm">{trade.ticker}</div>
                        <div className="text-xs text-gray-600 truncate max-w-[120px]">{trade.token}</div>
                      </div>
                    </div>
                  </td>

                  <td className="px-4 py-4 text-right font-mono text-gray-400 text-sm">
                    ${fmtPrice(trade.buyPrice)}
                  </td>

                  <td className="px-4 py-4 text-right font-mono text-gray-400 text-sm">
                    ${fmtPrice(trade.sellPrice)}
                  </td>

                  <td className={`px-4 py-4 text-right font-mono font-semibold text-sm ${isWin ? "text-[#14F195]" : "text-red-400"}`}>
                    {fmtPnl(trade.pnl)}
                  </td>

                  <td className={`px-4 py-4 text-right font-mono text-sm ${isWin ? "text-[#14F195]" : "text-red-400"}`}>
                    {trade.pnlPercent > 0 ? "+" : ""}{trade.pnlPercent.toFixed(1)}%
                  </td>

                  <td className="px-4 py-4 text-right font-mono text-gray-500 text-xs">
                    {trade.date}
                  </td>

                  <td className="px-4 py-4 text-right">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold ${
                        isWin
                          ? "bg-[#14F195]/10 text-[#14F195] border border-[#14F195]/20"
                          : "bg-red-500/10 text-red-400 border border-red-500/20"
                      }`}
                    >
                      {isWin ? "WIN" : "LOSS"}
                    </span>
                  </td>
                </tr>
              );
            })}

            {trades.length === 0 && (
              <tr>
                <td colSpan={8} className="px-6 py-16 text-center text-gray-600">
                  No trades in this timeframe
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
