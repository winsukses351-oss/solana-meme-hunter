"use client";

export default function LiveScanner({ hunterData = null, marketDataStatus = "CHECKING" }) {
  const isConnected = hunterData?.status === "CONNECTED";
  const candidates = hunterData?.candidates || [];
  const breakdown = hunterData?.rejectionBreakdown || {};
  const thresholds = hunterData?.currentThresholds || {};
  const diagnosticsStats = hunterData?.diagnosticsStats || {};

  return (
    <section className="bg-[#121721] border border-slate-800 rounded-lg p-3 sm:p-4 space-y-3">
      {/* Scanner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            LIVE TOKEN SCANNER (TOKEN HUNTER ENGINE)
          </span>
          <span
            className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
              isConnected
                ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                : marketDataStatus === "NOT_CONFIGURED"
                ? "bg-amber-950 text-amber-400 border border-amber-800"
                : "bg-red-950 text-red-400 border border-red-800"
            }`}
          >
            {isConnected ? "ENGINE ACTIVE" : marketDataStatus}
          </span>
        </div>
        <div className="text-[11px] font-mono text-slate-400 flex items-center gap-3">
          <span>
            Provider: <strong className="text-slate-200">{hunterData?.activeProvider || "OFFLINE"}</strong>
          </span>
          {isConnected && hunterData?.scanDurationMs !== undefined && (
            <span>
              Latency: <strong className="text-emerald-400">{hunterData.scanDurationMs}ms</strong>
            </span>
          )}
        </div>
      </div>

      {/* Primary Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-xs">
        <div className="bg-[#0b0e14] p-2.5 rounded border border-slate-800/60">
          <div className="text-[10px] text-slate-500">PAIRS DISCOVERED</div>
          <div className="text-slate-200 font-bold text-sm mt-0.5">
            {isConnected ? hunterData?.pairsDiscovered ?? 0 : 0}
          </div>
        </div>
        <div className="bg-[#0b0e14] p-2.5 rounded border border-slate-800/60">
          <div className="text-[10px] text-slate-500">UNIQUE TOKENS</div>
          <div className="text-slate-200 font-bold text-sm mt-0.5">
            {isConnected ? hunterData?.uniqueTokens ?? 0 : 0}
          </div>
        </div>
        <div className="bg-[#0b0e14] p-2.5 rounded border border-slate-800/60">
          <div className="text-[10px] text-slate-500">FILTERED OUT</div>
          <div className="text-amber-400 font-bold text-sm mt-0.5">
            {isConnected ? hunterData?.filteredCount ?? 0 : 0}
          </div>
        </div>
        <div className="bg-[#0b0e14] p-2.5 rounded border border-slate-800/60">
          <div className="text-[10px] text-slate-500">VALID CANDIDATES</div>
          <div className="text-emerald-400 font-bold text-sm mt-0.5">
            {isConnected ? hunterData?.candidateCount ?? 0 : 0}
          </div>
        </div>
      </div>

      {/* FILTER DIAGNOSTICS & REJECTION BREAKDOWN */}
      {isConnected && (
        <div className="bg-[#0b0e14] border border-slate-800/80 rounded p-3 space-y-2">
          <div className="flex items-center justify-between border-b border-slate-800/60 pb-1.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono">
              FILTER DIAGNOSTICS & REJECTION BREAKDOWN
            </span>
            <span className="text-[10px] font-mono text-slate-500">
              Min Liq: ${thresholds.minLiquidityUsd?.toLocaleString()} | Min Vol: ${thresholds.minVolume24hUsd?.toLocaleString()}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-[10px]">
            <div className="bg-[#121721] p-1.5 rounded border border-slate-800/50 flex justify-between items-center">
              <span className="text-slate-400">EXCLUDED NATIVE SOL:</span>
              <span className="font-bold text-slate-300">{breakdown.NATIVE_SOL ?? 0}</span>
            </div>
            <div className="bg-[#121721] p-1.5 rounded border border-slate-800/50 flex justify-between items-center">
              <span className="text-slate-400">EXCLUDED STABLECOINS:</span>
              <span className="font-bold text-slate-300">{breakdown.EXCLUDED_STABLECOIN ?? 0}</span>
            </div>
            <div className="bg-[#121721] p-1.5 rounded border border-slate-800/50 flex justify-between items-center">
              <span className="text-slate-400">EXCLUDED QUOTE ASSETS:</span>
              <span className="font-bold text-slate-300">{breakdown.EXCLUDED_QUOTE_ASSET ?? 0}</span>
            </div>
            <div className="bg-[#121721] p-1.5 rounded border border-slate-800/50 flex justify-between items-center">
              <span className="text-slate-400">LOW LIQUIDITY:</span>
              <span className="font-bold text-amber-400">{breakdown.LOW_LIQUIDITY ?? 0}</span>
            </div>
            <div className="bg-[#121721] p-1.5 rounded border border-slate-800/50 flex justify-between items-center">
              <span className="text-slate-400">LOW VOLUME:</span>
              <span className="font-bold text-amber-400">{breakdown.LOW_VOLUME ?? 0}</span>
            </div>
            <div className="bg-[#121721] p-1.5 rounded border border-slate-800/50 flex justify-between items-center">
              <span className="text-slate-400">MISSING LIQUIDITY:</span>
              <span className="font-bold text-red-400">{breakdown.MISSING_LIQUIDITY ?? 0}</span>
            </div>
            <div className="bg-[#121721] p-1.5 rounded border border-slate-800/50 flex justify-between items-center">
              <span className="text-slate-400">MISSING VOLUME:</span>
              <span className="font-bold text-red-400">{breakdown.MISSING_VOLUME ?? 0}</span>
            </div>
            <div className="bg-[#121721] p-1.5 rounded border border-slate-800/50 flex justify-between items-center">
              <span className="text-slate-400">MISSING/INVALID PRICE:</span>
              <span className="font-bold text-red-400">
                {(breakdown.MISSING_PRICE ?? 0) + (breakdown.INVALID_PRICE ?? 0)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Live Candidates Table */}
      <div className="bg-[#0b0e14] border border-slate-800/80 rounded overflow-x-auto">
        {!isConnected ? (
          <div className="p-6 text-center text-xs font-mono text-slate-500">
            Token Hunter engine offline. Connect market data provider to stream candidates.
          </div>
        ) : candidates.length === 0 ? (
          <div className="p-6 text-center text-xs font-mono text-slate-400 space-y-1">
            <div>No valid token candidates passed current liquidity and asset filters in this scan.</div>
            <div className="text-[10px] text-slate-500">
              {breakdown.NATIVE_SOL === hunterData?.uniqueTokens
                ? "All discovered assets were excluded as native/infrastructure assets."
                : `Candidates filtered by liquidity (${breakdown.LOW_LIQUIDITY ?? 0}), volume (${breakdown.LOW_VOLUME ?? 0}), or asset exclusions.`}
            </div>
          </div>
        ) : (
          <table className="w-full text-left font-mono text-xs text-slate-300 min-w-[700px]">
            <thead className="bg-[#121721] text-[10px] uppercase text-slate-400 border-b border-slate-800">
              <tr>
                <th className="p-2">Token</th>
                <th className="p-2">Token Address</th>
                <th className="p-2">Price (USD)</th>
                <th className="p-2">24h Change</th>
                <th className="p-2">24h Volume</th>
                <th className="p-2">Liquidity</th>
                <th className="p-2">DEX</th>
                <th className="p-2">Discovery Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50 text-[11px]">
              {candidates.map((tok, idx) => {
                const addr = tok.tokenAddress || "";
                const truncatedAddr =
                  addr.length > 8 ? `${addr.slice(0, 4)}...${addr.slice(-4)}` : addr;

                return (
                  <tr key={idx} className="hover:bg-slate-900/40">
                    <td className="p-2 font-bold text-slate-100 flex items-center gap-1.5">
                      <span>{tok.symbol}</span>
                      <span className="text-[9px] font-normal text-slate-500 truncate max-w-[90px]">
                        {tok.name}
                      </span>
                    </td>
                    <td className="p-2 text-slate-400 text-[10px]" title={addr}>
                      {truncatedAddr}
                    </td>
                    <td className="p-2 text-slate-200">
                      ${tok.price < 0.01 ? tok.price.toFixed(6) : tok.price.toFixed(2)}
                    </td>
                    <td
                      className={`p-2 font-semibold ${
                        tok.priceChange24h >= 0 ? "text-emerald-400" : "text-red-400"
                      }`}
                    >
                      {tok.priceChange24h !== null
                        ? `${tok.priceChange24h >= 0 ? "+" : ""}${tok.priceChange24h.toFixed(2)}%`
                        : "--"}
                    </td>
                    <td className="p-2 text-slate-300">
                      {tok.volume24hUsd !== null
                        ? `$${Math.round(tok.volume24hUsd).toLocaleString()}`
                        : "--"}
                    </td>
                    <td className="p-2 text-slate-300">
                      {tok.liquidityUsd !== null
                        ? `$${Math.round(tok.liquidityUsd).toLocaleString()}`
                        : "--"}
                    </td>
                    <td className="p-2 text-slate-400 text-[10px] uppercase">{tok.dex}</td>
                    <td className="p-2 font-bold text-emerald-400">
                      {tok.discoveryScore} / 100
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
