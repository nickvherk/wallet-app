import { WalletStats } from "@/lib/mockData";

interface StatsGridProps {
  stats: WalletStats;
}

function fmt(value: number, prefix = true): string {
  const abs = Math.abs(value);
  const sign = prefix ? (value >= 0 ? "+" : "-") : "";
  if (abs >= 1000) return `${sign}$${(abs / 1000).toFixed(1)}K`;
  return `${sign}$${abs.toFixed(0)}`;
}

interface StatCardProps {
  label: string;
  value: string;
  sub1?: string;
  sub2?: string;
  valueColor?: string;
  icon: React.ReactNode;
}

function StatCard({ label, value, sub1, sub2, valueColor, icon }: StatCardProps) {
  return (
    <div className="bg-[#0f0f17] border border-[#1e1e2e] rounded-2xl p-6 flex flex-col gap-4 hover:border-[#2a2a3a] transition-colors">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-600 uppercase tracking-widest">{label}</span>
        <div className="w-8 h-8 rounded-lg bg-[#1a1a28] flex items-center justify-center text-gray-600">
          {icon}
        </div>
      </div>
      <div className={`text-3xl font-bold font-mono tracking-tight ${valueColor ?? "text-white"}`}>
        {value}
      </div>
      {(sub1 || sub2) && (
        <div className="flex items-center justify-between text-xs text-gray-600 border-t border-[#1a1a28] pt-3">
          {sub1 && <span>{sub1}</span>}
          {sub2 && <span>{sub2}</span>}
        </div>
      )}
    </div>
  );
}

export default function StatsGrid({ stats }: StatsGridProps) {
  const profitFactor =
    stats.avgLoss !== 0
      ? Math.abs((stats.avgWin * stats.winningTrades) / (stats.avgLoss * stats.losingTrades))
      : 0;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        label="Total PnL"
        value={fmt(stats.totalPnl)}
        sub1={`Best ${fmt(stats.bestTrade)}`}
        sub2={`Worst ${fmt(stats.worstTrade)}`}
        valueColor={stats.totalPnl >= 0 ? "text-[#14F195]" : "text-red-400"}
        icon={
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
            <polyline points="16 7 22 7 22 13" />
          </svg>
        }
      />
      <StatCard
        label="Win Rate"
        value={`${stats.winRate}%`}
        sub1={`${stats.winningTrades} wins`}
        sub2={`${stats.losingTrades} losses`}
        valueColor={stats.winRate >= 50 ? "text-[#14F195]" : "text-red-400"}
        icon={
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.86L12 17.77l-6.18 3.23 1.18-6.86-5-4.87 6.91-1.01z" />
          </svg>
        }
      />
      <StatCard
        label="Total Trades"
        value={stats.totalTrades.toString()}
        sub1={`Avg win ${fmt(stats.avgWin)}`}
        sub2={`Avg loss ${fmt(stats.avgLoss)}`}
        icon={
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 3h18v18H3z" />
            <path d="M3 9h18M3 15h18M9 3v18" />
          </svg>
        }
      />
      <StatCard
        label="Profit Factor"
        value={profitFactor > 0 ? profitFactor.toFixed(2) + "x" : "—"}
        sub1={`Avg win ${fmt(stats.avgWin, false)}`}
        sub2={`Avg loss ${fmt(stats.avgLoss, false)}`}
        valueColor="text-[#9945FF]"
        icon={
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        }
      />
    </div>
  );
}
