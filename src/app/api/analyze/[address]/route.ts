import { NextRequest, NextResponse } from "next/server";
import { analyzeWallet, getCutoffTimestamp, debugFetch } from "@/lib/helius";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ address: string }> },
) {
  const { address } = await context.params;
  const apiKey = process.env.HELIUS_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: "HELIUS_API_KEY not configured" }, { status: 500 });
  }

  const timeframe = req.nextUrl.searchParams.get("timeframe") ?? "ALL";
  const cutoffTs  = getCutoffTimestamp(timeframe);
  const cutoffDate = cutoffTs ? new Date(cutoffTs * 1000).toISOString().slice(0, 10) : "epoch";

  console.log(`\n[analyze] timeframe=${timeframe}  cutoff=${cutoffDate} (ts=${cutoffTs})`);

  try {
    const { trades, debug } = await debugFetch(address, apiKey, cutoffTs);

    console.log(`[analyze] fetched=${debug.txCount} txs  ` +
      `range=${debug.firstDate ?? "—"} → ${debug.lastDate ?? "—"}  ` +
      `trades=${trades.length}`);

    return NextResponse.json({ trades });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[analyze] ERROR: ${message}`);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
