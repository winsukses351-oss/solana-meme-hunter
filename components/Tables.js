"use client";

export function TopOpportunitiesTable({ hunterData = null, marketDataStatus = "CHECKING" }) {
  const isConnected = hunterData?.status === "CONNECTED";
  const candidates = hunterData?.candidates || [];

  return (
    <section className="bg-[#121721] border border-slate-800 rounded-lg p-3 sm:p-4 space-y-3">
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
        <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
          TOP OPPORTUNITIES (TOKEN HUNTER CANDIDATES)
        </h2>
        <span className="text-[10px] font-mono text-slate-500">
          Decision Engine: <strong className="text-amber-500">NOT AVAILABLE</strong>
        </span>
      </div>

      <div className="bg-[#0b0e14] border border-slate-800/80 rounded overflow-x-auto">
        {!isConnected ? (
          <div className="p-6 text-center text-xs font-mono text-slate-500">
            Market data offline. Top opportunities candidate feed unavailable.
          </div>
        ) : candidates.length === 0 ? (
          <div className="p-6 text-center text-xs font-mono text-slate-500">
            No candidate tokens discovered matching criteria.
          </div>
        ) : (
          <table className="w-full text-left font-mono text-xs text-slate-300 min-w-[750px]">
            <thead className="bg-[#121721] text-[10px] uppercase text-slate-400 border-b border-slate-800">
              <tr>
                <th className="p-2.5">Token</th>
                <th className="p-2.5">Token Address</th>
                <th className="p-2.5">Price</th>
                <th className="p-2.5">24h Vol</th>
                <th className="p-2.5">Liquidity</th>
                <th className="p-2.5">Safety</th>
                <th className="p-2.5">Discovery Score</th>
                <th className="p-2.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50 text-[11px]">
              {candidates.map((tok, idx) => {
                const addr = tok.tokenAddress || "";
                const truncatedAddr = addr.length > 8 ? `${addr.slice(0, 4)}...${addr.slice(-4)}` : addr;

                return (
                  <tr key={idx} className="hover:bg-slate-900/40">
                    <td className="p-2.5 font-bold text-slate-200">
                      {tok.symbol} <span className="text-[9px] font-normal text-slate-500">({tok.dex})</span>
                    </td>
                    <td className="p-2.5 text-slate-400 text-[10px]" title={addr}>
                      {truncatedAddr}
                    </td>
                    <td className="p-2.5">
                      ${tok.price < 0.01 ? tok.price.toFixed(6) : tok.price.toFixed(2)}
                    </td>
                    <td className="p-2.5">${Math.round(tok.volume24hUsd).toLocaleString()}</td>
                    <td className="p-2.5">${Math.round(tok.liquidityUsd).toLocaleString()}</td>
                    <td className="p-2.5 text-slate-500">--</td>
                    <td className="p-2.5 font-bold text-emerald-400">
                      {tok.discoveryScore} / 100
                    </td>
                    <td className="p-2.5 text-[10px] text-emerald-400 font-semibold uppercase">
                      {tok.status}
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

export function OpenPositionsTable() {
  return (
    <section className="bg-[#121721] border border-slate-800 rounded-lg p-3 sm:p-4 space-y-3">
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
        <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
          OPEN POSITIONS
        </h2>
        <span className="text-[10px] font-mono text-slate-500">Active Positions: 0</span>
      </div>
      <div className="bg-[#0b0e14] border border-slate-800/80 rounded p-6 text-center font-mono text-xs text-slate-500">
        No open positions. Live execution is BLOCKED in Phase 5.
      </div>
    </section>
  );
}

export function TradeHistoryTable() {
  return (
    <section className="bg-[#121721] border border-slate-800 rounded-lg p-3 sm:p-4 space-y-3">
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
        <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
          TRADE HISTORY
        </h2>
        <span className="text-[10px] font-mono text-slate-500">Total Executions: 0</span>
      </div>
      <div className="bg-[#0b0e14] border border-slate-800/80 rounded p-6 text-center font-mono text-xs text-slate-500">
        No trade history recorded.
      </div>
    </section>
  );
}
