import { Trade } from "./mockData";

const HELIUS_BASE = "https://api.helius.xyz";
const HELIUS_RPC  = "https://mainnet.helius-rpc.com";

const WSOL  = "So11111111111111111111111111111111111111112";
const USDC  = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
const USDT  = "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB";
const VALUE = new Set([WSOL, USDC, USDT]);

// ─── Helius response types (from real API — tokenAmount is already human-readable) ──

interface TokenTransfer {
  fromUserAccount: string;
  toUserAccount:   string;
  tokenAmount:     number; // pre-divided by decimals
  mint:            string;
}

interface NativeTransfer {
  fromUserAccount: string;
  toUserAccount:   string;
  amount:          number; // lamports
}

interface HeliusTx {
  signature:       string;
  timestamp:       number;
  type:            string;
  source:          string;
  tokenTransfers:  TokenTransfer[];
  nativeTransfers: NativeTransfer[];
  // events.swap is unreliable — not used
}

// ─── Internal parsed swap ─────────────────────────────────────────────────────

interface ParsedSwap {
  sig:        string;
  timestamp:  number;
  inputMint:  string;
  inputAmt:   number;
  outputMint: string;
  outputAmt:  number;
}

// ─── Swap parser ──────────────────────────────────────────────────────────────

function parseTx(tx: HeliusTx, wallet: string): ParsedSwap | null {
  // Aggregate token amounts by direction from the wallet's perspective
  const out = new Map<string, number>(); // wallet sent
  const inn = new Map<string, number>(); // wallet received

  for (const t of tx.tokenTransfers ?? []) {
    if (t.fromUserAccount === wallet) {
      out.set(t.mint, (out.get(t.mint) ?? 0) + t.tokenAmount);
    } else if (t.toUserAccount === wallet) {
      inn.set(t.mint, (inn.get(t.mint) ?? 0) + t.tokenAmount);
    }
  }

  const valueOut = [...out.entries()].filter(([m]) =>  VALUE.has(m));
  const valueIn  = [...inn.entries()].filter(([m]) =>  VALUE.has(m));
  const posOut   = [...out.entries()].filter(([m]) => !VALUE.has(m));
  const posIn    = [...inn.entries()].filter(([m]) => !VALUE.has(m));

  // Sum all value tokens (SOL/USDC/USDT) in each direction
  const totalValueOut = valueOut.reduce((s, [, a]) => s + a, 0);
  const totalValueIn  = valueIn.reduce( (s, [, a]) => s + a, 0);

  // Dominant value and position mints (by largest amount)
  const topValueOut = valueOut.sort((a, b) => b[1] - a[1])[0];
  const topValueIn  = valueIn.sort( (a, b) => b[1] - a[1])[0];
  const topPosOut   = posOut.sort(  (a, b) => b[1] - a[1])[0];
  const topPosIn    = posIn.sort(   (a, b) => b[1] - a[1])[0];

  // ① BUY: wallet sent SOL/stable, received a position token (PUMP_AMM, Jupiter, Raydium…)
  if (totalValueOut > 0 && topPosIn) {
    return {
      sig: tx.signature, timestamp: tx.timestamp,
      inputMint:  topValueOut![0], inputAmt:  totalValueOut,
      outputMint: topPosIn[0],     outputAmt: topPosIn[1],
    };
  }

  // ② SELL: wallet sent a position token, received SOL/stable
  if (topPosOut && totalValueIn > 0) {
    return {
      sig: tx.signature, timestamp: tx.timestamp,
      inputMint:  topPosOut[0],   inputAmt:  topPosOut[1],
      outputMint: topValueIn![0], outputAmt: totalValueIn,
    };
  }

  // ③ BUY via native SOL (PUMP_FUN bonding curve — SOL sent natively, token received via tokenTransfers)
  if (topPosIn) {
    const nativeSolOut = (tx.nativeTransfers ?? [])
      .filter(n => n.fromUserAccount === wallet)
      .reduce((s, n) => s + n.amount / 1e9, 0);
    if (nativeSolOut > 0) {
      return {
        sig: tx.signature, timestamp: tx.timestamp,
        inputMint:  WSOL,       inputAmt:  nativeSolOut,
        outputMint: topPosIn[0], outputAmt: topPosIn[1],
      };
    }
  }

  // ④ Token-to-token swap (no SOL/stable involved)
  if (topPosOut && topPosIn) {
    return {
      sig: tx.signature, timestamp: tx.timestamp,
      inputMint:  topPosOut[0], inputAmt:  topPosOut[1],
      outputMint: topPosIn[0],  outputAmt: topPosIn[1],
    };
  }

  return null; // e.g. PUMP_FUN sell with no visible SOL receipt
}

// ─── API calls ────────────────────────────────────────────────────────────────

const MAX_TXS = 1000;

export function getCutoffTimestamp(timeframe: string): number {
  const days: Record<string, number> = {
    "1D": 1, "7D": 7, "14D": 14, "30D": 30, "3M": 90, "1Y": 365,
  };
  const d = days[timeframe] ?? 0;
  return d ? Math.floor(Date.now() / 1000) - d * 86_400 : 0;
}

async function fetchAllTransactions(
  address: string,
  apiKey: string,
  cutoffTs: number,
): Promise<HeliusTx[]> {
  const all: HeliusTx[] = [];
  let before: string | undefined;
  let pageCount = 0;

  // NOTE: we do NOT pass type=SWAP here — Helius's type filter only returns recent
  // PUMP_AMM transactions and misses older JUPITER/METEORA/RAYDIUM swaps entirely.
  // Instead we fetch all types and filter to SWAP locally.
  while (all.length < MAX_TXS) {
    const params = new URLSearchParams({ "api-key": apiKey, limit: "100" });
    if (before) params.set("before", before);

    const res = await fetch(
      `${HELIUS_BASE}/v0/addresses/${address}/transactions?${params}`,
      { cache: "no-store" },
    );
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`Helius ${res.status}: ${body || res.statusText}`);
    }

    const page: HeliusTx[] = await res.json();
    if (page.length === 0) break;
    pageCount++;

    for (const tx of page) {
      // Only collect SWAP transactions within the requested timeframe
      if (tx.type === "SWAP" && (cutoffTs === 0 || tx.timestamp >= cutoffTs)) {
        all.push(tx);
      }
    }

    const oldestOnPage = page[page.length - 1].timestamp;
    console.log(
      `  [page ${pageCount}] ${page.length} txs | ` +
      `oldest ${new Date(oldestOnPage * 1000).toISOString().slice(0, 10)} | ` +
      `swaps collected so far: ${all.length}`,
    );

    // Stop if every tx on this page is older than our cutoff
    if (cutoffTs > 0 && oldestOnPage < cutoffTs) break;
    if (page.length < 100) break; // last page

    // Advance cursor using the last tx of ALL types (not just swaps)
    before = page[page.length - 1].signature;
  }

  console.log(`  [paginate] done — ${pageCount} pages, ${all.length} SWAP txs collected`);
  return all;
}

interface TokenMeta { name: string; symbol: string }

async function fetchTokenMeta(mints: string[], apiKey: string): Promise<Map<string, TokenMeta>> {
  const map = new Map<string, TokenMeta>();
  if (!mints.length) return map;
  try {
    const res = await fetch(`${HELIUS_RPC}/?api-key=${apiKey}`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id:      "meta",
        method:  "getAssetBatch",
        params:  { ids: mints },
      }),
    });
    const json = (await res.json()) as { result?: Record<string, unknown>[] };
    for (const asset of json.result ?? []) {
      const id      = asset.id as string;
      const info    = ((asset.token_info ?? {})          as Record<string, unknown>);
      const content = ((asset.content    ?? {})          as Record<string, unknown>);
      const meta    = ((content.metadata ?? {})          as Record<string, string>);
      map.set(id, {
        name:   (meta.name    ?? info.symbol ?? id.slice(0, 8)) as string,
        symbol: (info.symbol  ?? meta.symbol ?? id.slice(0, 5).toUpperCase()) as string,
      });
    }
  } catch {
    // non-fatal — callers fall back to mint-address abbreviations
  }
  return map;
}

async function getSolPrice(): Promise<number> {
  try {
    const res  = await fetch(`https://api.jup.ag/price/v2?ids=${WSOL}`, {
      next: { revalidate: 60 },
    });
    const json = (await res.json()) as { data?: Record<string, { price: string }> };
    return parseFloat(json.data?.[WSOL]?.price ?? "150");
  } catch {
    return 150;
  }
}

// ─── Per-token PnL aggregation ────────────────────────────────────────────────

interface TokenBucket {
  mint:       string;
  boughtAmt:  number;
  costSOL:    number;
  costStable: number;
  soldAmt:    number;
  revSOL:     number;
  revStable:  number;
  firstTs:    number;
  lastTs:     number;
}

function buildTrades(
  swaps:    ParsedSwap[],
  meta:     Map<string, TokenMeta>,
  solPrice: number,
): Trade[] {
  const buckets = new Map<string, TokenBucket>();

  function get(mint: string, ts: number): TokenBucket {
    if (!buckets.has(mint)) {
      buckets.set(mint, {
        mint, boughtAmt: 0, costSOL: 0, costStable: 0,
        soldAmt: 0, revSOL: 0, revStable: 0, firstTs: ts, lastTs: ts,
      });
    }
    const b = buckets.get(mint)!;
    if (ts < b.firstTs) b.firstTs = ts;
    if (ts > b.lastTs)  b.lastTs  = ts;
    return b;
  }

  for (const { inputMint, inputAmt, outputMint, outputAmt, timestamp: ts } of swaps) {
    const inputIsValue  = VALUE.has(inputMint);
    const outputIsValue = VALUE.has(outputMint);

    if (inputIsValue && !outputIsValue) {
      // BUY
      const b = get(outputMint, ts);
      b.boughtAmt += outputAmt;
      if (inputMint === WSOL) b.costSOL    += inputAmt;
      else                    b.costStable += inputAmt;

    } else if (!inputIsValue && outputIsValue) {
      // SELL
      const b = get(inputMint, ts);
      b.soldAmt += inputAmt;
      if (outputMint === WSOL) b.revSOL    += outputAmt;
      else                     b.revStable += outputAmt;

    } else if (!inputIsValue && !outputIsValue) {
      // Token-to-token: track without USD cost basis
      get(inputMint,  ts).soldAmt   += inputAmt;
      get(outputMint, ts).boughtAmt += outputAmt;
    }
  }

  const trades: Trade[] = [];
  let idx = 0;

  for (const b of buckets.values()) {
    const costUSD = b.costSOL * solPrice + b.costStable;
    if (costUSD === 0) continue; // no trackable cost basis

    const revUSD   = b.revSOL * solPrice + b.revStable;
    const pnl      = revUSD - costUSD;
    const pct      = (pnl / costUSD) * 100;
    const avgBuy   = b.boughtAmt > 0 ? costUSD / b.boughtAmt : 0;
    const avgSell  = b.soldAmt   > 0 ? revUSD  / b.soldAmt   : 0;
    const info     = meta.get(b.mint);
    const date     = new Date(b.lastTs * 1000).toISOString().slice(0, 10);

    trades.push({
      id:         String(++idx),
      token:      info?.name   ?? `${b.mint.slice(0, 6)}…`,
      ticker:     info?.symbol ?? b.mint.slice(0, 5).toUpperCase(),
      buyPrice:   avgBuy,
      sellPrice:  avgSell,
      size:       b.boughtAmt,
      pnl:        Math.round(pnl * 100) / 100,
      pnlPercent: Math.round(pct * 10)  / 10,
      date,
      status:     pnl >= 0 ? "win" : "loss",
    });
  }

  return trades.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

// ─── Shared parse + build ─────────────────────────────────────────────────────

async function _buildFromTxs(txs: HeliusTx[], address: string, apiKey: string): Promise<Trade[]> {
  const swaps = txs
    .map(tx => parseTx(tx, address))
    .filter((s): s is ParsedSwap => s !== null);

  if (swaps.length === 0) return [];

  const positionMints = [
    ...new Set(swaps.flatMap(s => [s.inputMint, s.outputMint]).filter(m => !VALUE.has(m))),
  ];

  const [meta, solPrice] = await Promise.all([
    fetchTokenMeta(positionMints, apiKey),
    getSolPrice(),
  ]);

  return buildTrades(swaps, meta, solPrice);
}

// ─── Public entry points ──────────────────────────────────────────────────────

interface DebugInfo {
  txCount:   number;
  firstDate: string | null;
  lastDate:  string | null;
}

export async function debugFetch(
  address: string,
  apiKey: string,
  cutoffTs = 0,
): Promise<{ trades: Trade[]; debug: DebugInfo }> {
  const txs    = await fetchAllTransactions(address, apiKey, cutoffTs);
  const sorted = [...txs].sort((a, b) => a.timestamp - b.timestamp);
  const debug: DebugInfo = {
    txCount:   txs.length,
    firstDate: sorted[0]     ? new Date(sorted[0].timestamp     * 1000).toISOString().slice(0, 10) : null,
    lastDate:  sorted.at(-1) ? new Date(sorted.at(-1)!.timestamp * 1000).toISOString().slice(0, 10) : null,
  };
  const trades = await _buildFromTxs(txs, address, apiKey);
  return { trades, debug };
}

export async function analyzeWallet(
  address: string,
  apiKey: string,
  cutoffTs = 0,
): Promise<Trade[]> {
  const txs = await fetchAllTransactions(address, apiKey, cutoffTs);

  const swaps = txs
    .map(tx => parseTx(tx, address))
    .filter((s): s is ParsedSwap => s !== null);

  if (swaps.length === 0) return [];

  const positionMints = [
    ...new Set(
      swaps.flatMap(s => [s.inputMint, s.outputMint]).filter(m => !VALUE.has(m)),
    ),
  ];

  const [meta, solPrice] = await Promise.all([
    fetchTokenMeta(positionMints, apiKey),
    getSolPrice(),
  ]);

  return buildTrades(swaps, meta, solPrice);
}
