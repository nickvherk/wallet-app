import { WalletStats } from "@/lib/mockData";

interface WinRateBarProps {
  stats: WalletStats;
}

export default function WinRateBar({ stats }: WinRateBarProps) {
  const winPct = stats.totalTrades > 0 ? (stats.winningTrades / stats.totalTrades) * 100 : 0;
  const lossPct = 100 - winPct;

  return (
    <div className="bg-[#0f0f17] border border-[#1e1e2e] rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-medium text-gray-600 uppercase tracking-widest">Trade Distribution</span>
        <span className="text-xs text-gray-600">{stats.totalTrades} trades</span>
      </div>

      <div className="relative h-2 rounded-full overflow-hidden bg-[#1a1a28] flex">
        {winPct > 0 && (
          <div
            className="h-full transition-all duration-500"
            style={{ width: `${winPct}%`, background: "linear-gradient(90deg, #14F195, #0fa96a)" }}
          />
        )}
        {lossPct > 0 && (
          <div
            className="h-full transition-all duration-500"
            style={{ width: `${lossPct}%`, background: "linear-gradient(90deg, #EF4444, #b91c1c)" }}
          />
        )}
      </div>

      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#14F195]" />
          <span className="text-sm text-gray-400 font-medium">{stats.winningTrades} wins</span>
          <span className="text-sm font-mono font-semibold text-[#14F195]">{winPct.toFixed(1)}%</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-mono font-semibold text-red-400">{lossPct.toFixed(1)}%</span>
          <span className="text-sm text-gray-400 font-medium">{stats.losingTrades} losses</span>
          <div className="w-2 h-2 rounded-full bg-red-500" />
        </div>
      </div>
    </div>
  );
}
