"use client";

import { useState, useCallback } from "react";
import WalletSearch from "@/components/WalletSearch";
import StatsGrid from "@/components/StatsGrid";
import WinRateBar from "@/components/WinRateBar";
import TimeframeSelector from "@/components/TimeframeSelector";
import PnLChart from "@/components/PnLChart";
import TradesTable from "@/components/TradesTable";
import {
  buildChartPoints,
  computeStats,
  getTimeframeData,
  Timeframe,
  TimeframeData,
  Trade,
} from "@/lib/mockData";

function truncateAddress(address: string): string {
  if (address.length <= 16) return address;
  return `${address.slice(0, 6)}...${address.slice(-6)}`;
}

function toTimeframeData(trades: Trade[]): TimeframeData {
  return { stats: computeStats(trades), trades, chartPoints: buildChartPoints(trades) };
}

const TF_LABELS: Record<Timeframe, string> = {
  "1D": "24 hours", "7D": "7 days", "14D": "14 days",
  "30D": "30 days", "3M": "3 months", "1Y": "1 year", "ALL": "all time",
};

function SolanaLogo() {
  return (
    <svg width="26" height="26" viewBox="0 0 397 312" fill="none">
      <path d="M64.6 237.9c2.4-2.4 5.7-3.8 9.2-3.8h317.4c5.8 0 8.7 7 4.6 11.1l-62.7 62.7c-2.4 2.4-5.7 3.8-9.2 3.8H6.5c-5.8 0-8.7-7-4.6-11.1l62.7-62.7z" fill="url(#s1)" />
      <path d="M64.6 3.8C67.1 1.4 70.4 0 73.8 0h317.4c5.8 0 8.7 7 4.6 11.1l-62.7 62.7c-2.4 2.4-5.7 3.8-9.2 3.8H6.5C.7 77.6-2.2 70.6 1.9 66.5l62.7-62.7z" fill="url(#s2)" />
      <path d="M333.1 120.1c-2.4-2.4-5.7-3.8-9.2-3.8H6.5c-5.8 0-8.7 7-4.6 11.1l62.7 62.7c2.4 2.4 5.7 3.8 9.2 3.8h317.4c5.8 0 8.7-7 4.6-11.1l-62.7-62.7z" fill="url(#s3)" />
      <defs>
        <linearGradient id="s1" x1="360.8" y1="351.5" x2="141.2" y2="-69.2" gradientUnits="userSpaceOnUse"><stop stopColor="#00FFA3" /><stop offset="1" stopColor="#DC1FFF" /></linearGradient>
        <linearGradient id="s2" x1="264.8" y1="401.6" x2="45.2" y2="-19.1" gradientUnits="userSpaceOnUse"><stop stopColor="#00FFA3" /><stop offset="1" stopColor="#DC1FFF" /></linearGradient>
        <linearGradient id="s3" x1="312.5" y1="376.8" x2="92.9" y2="-43.9" gradientUnits="userSpaceOnUse"><stop stopColor="#00FFA3" /><stop offset="1" stopColor="#DC1FFF" /></linearGradient>
      </defs>
    </svg>
  );
}

type DataSource = "live" | "mock";

export default function Home() {
  const [data,          setData]          = useState<TimeframeData | null>(null);
  const [timeframe,     setTimeframe]     = useState<Timeframe>("ALL");
  const [isLoading,     setIsLoading]     = useState(false);
  const [loadingMsg,    setLoadingMsg]    = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [dataSource,    setDataSource]    = useState<DataSource>("live");
  const [apiError,      setApiError]      = useState<string | null>(null);

  const fetchData = useCallback(async (address: string, tf: Timeframe) => {
    setIsLoading(true);
    setApiError(null);
    setLoadingMsg(`Fetching transactions for ${TF_LABELS[tf]}…`);

    try {
      const res  = await fetch(`/api/analyze/${address}?timeframe=${tf}`);
      const json = await res.json() as { trades?: Trade[]; error?: string };
      if (!res.ok || json.error) throw new Error(json.error ?? `HTTP ${res.status}`);

      setData(toTimeframeData(json.trades ?? []));
      setDataSource("live");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setApiError(msg);
      setData(getTimeframeData(tf));
      setDataSource("mock");
    } finally {
      setIsLoading(false);
      setLoadingMsg("");
    }
  }, []);

  const handleSearch = (address: string) => {
    setWalletAddress(address);
    setTimeframe("ALL");
    setData(null);
    fetchData(address, "ALL");
  };

  const handleTimeframeChange = (tf: Timeframe) => {
    setTimeframe(tf);
    fetchData(walletAddress, tf);
  };

  const pnlColor = data && data.stats.totalPnl >= 0 ? "text-[#14F195]" : "text-red-400";
  const hasData  = data !== null;

  return (
    <div className="min-h-screen bg-[#080810]">
      {/* Header */}
      <header className="border-b border-[#14142a] bg-[#080810]/90 backdrop-blur-xl sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <SolanaLogo />
            <div className="leading-none">
              <div className="font-bold text-base gradient-text">SolAnalyze</div>
              <div className="text-[10px] text-gray-600 mt-0.5">Wallet Intelligence</div>
            </div>
          </div>
          {hasData && (
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0f0f1a] border text-xs ${
              dataSource === "live"
                ? "border-[#14F195]/20 text-[#14F195]"
                : "border-yellow-500/20 text-yellow-500"
            }`}>
              <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${
                dataSource === "live" ? "bg-[#14F195]" : "bg-yellow-500"
              }`} />
              {dataSource === "live" ? "Live Data" : "Mock Data"}
            </div>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-14 space-y-14">

        {/* Search */}
        <section className="space-y-3">
          {!hasData && !isLoading && (
            <div className="text-center mb-10">
              <h1 className="text-5xl font-bold gradient-text mb-4">Solana Wallet Analyzer</h1>
              <p className="text-gray-600 text-lg max-w-lg mx-auto">
                Enter any Solana wallet address to see PnL, win rate, trade history and more.
              </p>
            </div>
          )}
          <WalletSearch onSearch={handleSearch} isLoading={isLoading && !hasData} />
          {!hasData && !isLoading && (
            <div className="flex justify-center">
              <button
                onClick={() => handleSearch("31npxa2Vk2yrGDZKeRmEfMp3QdZhqGVJdKm4etWDZZM3")}
                className="text-xs font-mono text-gray-700 hover:text-[#9945FF] transition-colors"
              >
                Try demo: 31npxa2V…ZZM3 →
              </button>
            </div>
          )}
        </section>

        {/* Initial loading skeleton (no data yet) */}
        {isLoading && !hasData && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 text-gray-500 text-sm">
              <svg className="animate-spin shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              {loadingMsg}
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
              {[...Array(4)].map((_, i) => <div key={i} className="h-32 bg-[#13131a] rounded-2xl" />)}
            </div>
            <div className="h-52 bg-[#13131a] rounded-2xl animate-pulse" />
            <div className="h-96 bg-[#13131a] rounded-2xl animate-pulse" />
          </div>
        )}

        {/* Results */}
        {hasData && (
          <div className={`space-y-14 transition-opacity duration-200 ${isLoading ? "opacity-40 pointer-events-none" : "opacity-100"}`}>

            {/* API error notice */}
            {apiError && (
              <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-yellow-500/5 border border-yellow-500/20 text-sm text-yellow-500">
                <svg className="shrink-0 mt-0.5" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
                <span><strong>API error:</strong> {apiError} — showing mock data as fallback.</span>
              </div>
            )}

            {/* Wallet address + timeframe row */}
            <section className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0f0f17] border border-[#1e1e2e]">
                  <div className="w-2 h-2 rounded-full bg-[#9945FF] shadow-[0_0_6px_#9945FF]" />
                  <span className="font-mono text-sm text-gray-300">{truncateAddress(walletAddress)}</span>
                </div>
                <button
                  onClick={() => navigator.clipboard.writeText(walletAddress)}
                  className="p-2 rounded-lg text-gray-600 hover:text-gray-400 hover:bg-[#13131a] transition-all"
                  title="Copy address"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" />
                    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                  </svg>
                </button>
              </div>

              <div className="flex items-center gap-3">
                {/* Inline loading indicator while refreshing */}
                {isLoading && (
                  <span className="flex items-center gap-1.5 text-xs text-gray-500">
                    <svg className="animate-spin" width="12" height="12" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    {loadingMsg}
                  </span>
                )}
                <TimeframeSelector value={timeframe} onChange={handleTimeframeChange} disabled={isLoading} />
              </div>
            </section>

            {/* PnL chart */}
            <section className="bg-[#0f0f17] border border-[#1e1e2e] rounded-2xl overflow-hidden">
              <div className="px-6 py-5 border-b border-[#1a1a28] flex items-center justify-between">
                <span className="font-semibold text-white text-sm">Cumulative PnL</span>
                <span className={`text-sm font-mono font-bold ${pnlColor}`}>
                  {data!.stats.totalPnl >= 0 ? "+" : ""}${Math.abs(data!.stats.totalPnl).toLocaleString()}
                </span>
              </div>
              <div className="px-2 py-4">
                <PnLChart points={data!.chartPoints} />
              </div>
            </section>

            {/* Stats grid */}
            <section className="space-y-4">
              <StatsGrid stats={data!.stats} />
              <WinRateBar stats={data!.stats} />
            </section>

            <div className="border-t border-[#14142a]" />

            {/* Trades table */}
            <section>
              <TradesTable trades={data!.trades} />
            </section>

            {dataSource === "live" && (
              <p className="text-center text-xs text-gray-700 pb-4">
                PnL calculated using current SOL price as cost basis
              </p>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
