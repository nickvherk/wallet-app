export type Timeframe = "1D" | "7D" | "14D" | "30D" | "3M" | "1Y" | "ALL";

export interface Trade {
  id: string;
  token: string;
  ticker: string;
  buyPrice: number;
  sellPrice: number;
  size: number;
  pnl: number;
  pnlPercent: number;
  date: string;
  status: "win" | "loss";
}

export interface ChartPoint {
  date: string;
  value: number;
}

export interface WalletStats {
  totalPnl: number;
  winRate: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  avgWin: number;
  avgLoss: number;
  bestTrade: number;
  worstTrade: number;
}

export interface TimeframeData {
  stats: WalletStats;
  trades: Trade[];
  chartPoints: ChartPoint[];
}

const ALL_TRADES: Trade[] = [
  { id: "1",  token: "Bonk",          ticker: "BONK",  buyPrice: 0.000012, sellPrice: 0.000089, size: 125000000, pnl: 9625.00,  pnlPercent: 641.67,  date: "2024-03-15", status: "win"  },
  { id: "2",  token: "Jupiter",       ticker: "JUP",   buyPrice: 0.42,     sellPrice: 1.87,     size: 4200,     pnl: 6090.00,  pnlPercent: 345.24,  date: "2024-02-28", status: "win"  },
  { id: "3",  token: "Pyth Network",  ticker: "PYTH",  buyPrice: 0.18,     sellPrice: 0.64,     size: 15000,    pnl: 6900.00,  pnlPercent: 255.56,  date: "2024-01-10", status: "win"  },
  { id: "4",  token: "Render",        ticker: "RNDR",  buyPrice: 2.10,     sellPrice: 5.80,     size: 800,      pnl: 2960.00,  pnlPercent: 176.19,  date: "2024-03-02", status: "win"  },
  { id: "5",  token: "Helium",        ticker: "HNT",   buyPrice: 4.20,     sellPrice: 9.15,     size: 450,      pnl: 2227.50,  pnlPercent: 117.86,  date: "2024-02-14", status: "win"  },
  { id: "6",  token: "Marinade",      ticker: "MNDE",  buyPrice: 0.52,     sellPrice: 1.14,     size: 3500,     pnl: 2170.00,  pnlPercent: 119.23,  date: "2024-01-28", status: "win"  },
  { id: "7",  token: "Raydium",       ticker: "RAY",   buyPrice: 1.85,     sellPrice: 3.40,     size: 1200,     pnl: 1860.00,  pnlPercent: 83.78,   date: "2024-03-08", status: "win"  },
  { id: "8",  token: "Jito",          ticker: "JTO",   buyPrice: 2.30,     sellPrice: 3.98,     size: 900,      pnl: 1512.00,  pnlPercent: 73.04,   date: "2024-02-05", status: "win"  },
  { id: "9",  token: "Drift",         ticker: "DRIFT", buyPrice: 0.68,     sellPrice: 1.05,     size: 3000,     pnl: 1110.00,  pnlPercent: 54.41,   date: "2024-03-20", status: "win"  },
  { id: "10", token: "Kamino",        ticker: "KMNO",  buyPrice: 0.092,    sellPrice: 0.138,    size: 18000,    pnl: 828.00,   pnlPercent: 50.00,   date: "2024-03-25", status: "win"  },
  { id: "11", token: "Samoyedcoin",   ticker: "SAMO",  buyPrice: 0.028,    sellPrice: 0.008,    size: 180000,   pnl: -3600.00, pnlPercent: -71.43,  date: "2024-03-20", status: "loss" },
  { id: "12", token: "Orca",          ticker: "ORCA",  buyPrice: 3.50,     sellPrice: 1.20,     size: 900,      pnl: -2070.00, pnlPercent: -65.71,  date: "2024-01-25", status: "loss" },
  { id: "13", token: "Mango Markets", ticker: "MNGO",  buyPrice: 0.042,    sellPrice: 0.016,    size: 60000,    pnl: -1560.00, pnlPercent: -61.90,  date: "2024-02-08", status: "loss" },
  { id: "14", token: "Star Atlas",    ticker: "ATLAS", buyPrice: 0.0095,   sellPrice: 0.0042,   size: 180000,   pnl: -954.00,  pnlPercent: -55.79,  date: "2024-01-18", status: "loss" },
  { id: "15", token: "Saber",         ticker: "SBR",   buyPrice: 0.0185,   sellPrice: 0.0094,   size: 90000,    pnl: -819.00,  pnlPercent: -49.19,  date: "2024-02-22", status: "loss" },
  { id: "16", token: "Step Finance",  ticker: "STEP",  buyPrice: 0.074,    sellPrice: 0.041,    size: 20000,    pnl: -660.00,  pnlPercent: -44.59,  date: "2024-03-10", status: "loss" },
  { id: "17", token: "Serum",         ticker: "SRM",   buyPrice: 0.38,     sellPrice: 0.22,     size: 3500,     pnl: -560.00,  pnlPercent: -42.11,  date: "2024-01-30", status: "loss" },
  { id: "18", token: "Solend",        ticker: "SLND",  buyPrice: 0.55,     sellPrice: 0.33,     size: 2000,     pnl: -440.00,  pnlPercent: -40.00,  date: "2024-02-18", status: "loss" },
];

export function buildChartPoints(trades: Trade[]): ChartPoint[] {
  const sorted = [...trades].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  let cumulative = 0;
  const points: ChartPoint[] = [{ date: sorted[0]?.date ?? "", value: 0 }];
  for (const t of sorted) {
    cumulative += t.pnl;
    points.push({ date: t.date, value: Math.round(cumulative * 100) / 100 });
  }
  return points;
}

export function computeStats(trades: Trade[]): WalletStats {
  const wins = trades.filter((t) => t.status === "win");
  const losses = trades.filter((t) => t.status === "loss");
  const totalPnl = trades.reduce((s, t) => s + t.pnl, 0);
  const avgWin = wins.length ? wins.reduce((s, t) => s + t.pnl, 0) / wins.length : 0;
  const avgLoss = losses.length ? losses.reduce((s, t) => s + t.pnl, 0) / losses.length : 0;
  const pnls = trades.map((t) => t.pnl);
  return {
    totalPnl: Math.round(totalPnl * 100) / 100,
    winRate: trades.length ? Math.round((wins.length / trades.length) * 1000) / 10 : 0,
    totalTrades: trades.length,
    winningTrades: wins.length,
    losingTrades: losses.length,
    avgWin: Math.round(avgWin * 100) / 100,
    avgLoss: Math.round(avgLoss * 100) / 100,
    bestTrade: pnls.length ? Math.max(...pnls) : 0,
    worstTrade: pnls.length ? Math.min(...pnls) : 0,
  };
}

const TIMEFRAME_TRADE_IDS: Record<Timeframe, string[]> = {
  "1D":  ["9", "10"],
  "7D":  ["7", "9", "10", "11", "16"],
  "14D": ["4", "7", "9", "10", "11", "15", "16"],
  "30D": ["1", "4", "7", "8", "9", "10", "11", "13", "15", "16", "18"],
  "3M":  ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15", "16", "17"],
  "1Y":  ALL_TRADES.map((t) => t.id),
  "ALL": ALL_TRADES.map((t) => t.id),
};

function getTimeframeTrades(tf: Timeframe): Trade[] {
  const ids = new Set(TIMEFRAME_TRADE_IDS[tf]);
  return ALL_TRADES.filter((t) => ids.has(t.id));
}

const TIMEFRAME_DAYS: Partial<Record<Timeframe, number>> = {
  "1D": 1, "7D": 7, "14D": 14, "30D": 30, "3M": 90, "1Y": 365,
};

export function filterTradesByTimeframe(trades: Trade[], tf: Timeframe): Trade[] {
  if (tf === "ALL") return trades;
  const days = TIMEFRAME_DAYS[tf];
  if (!days) return trades;
  const cutoff = new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10);
  return trades.filter(t => t.date >= cutoff);
}

export function getTimeframeData(tf: Timeframe): TimeframeData {
  const trades = getTimeframeTrades(tf);
  return {
    stats: computeStats(trades),
    trades,
    chartPoints: buildChartPoints(trades),
  };
}
