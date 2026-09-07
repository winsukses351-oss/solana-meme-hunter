"use client";

export default function LiveScanner({ tokensData = [], marketDataStatus = "CHECKING" }) {
  const isConnected = marketDataStatus === "CONNECTED";
  const tokenCount = tokensData.length;

  return (
    <section className="bg-[#121721] border border-slate-800 rounded-lg p-3 sm:p-4 space-y-3">
      {/* Scanner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            LIVE TOKEN SCANNER (SOLANA MAINNET)
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
            {isConnected ? "LIVE FEED" : marketDataStatus}
          </span>
        </div>
        <div className="text-[11px] font-mono text-slate-400 flex items-center gap-3">
          <span>
            Provider: <strong className="text-slate-200">{isConnected ? "Birdeye/DexScreener" : "OFFLINE"}</strong>
          </span>
        </div>
      </div>

      {/* Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-xs">
        <div className="bg-[#0b0e14] p-2.5 rounded border border-slate-800/60">
          <div className="text-[10px] text-slate-500">TOKENS FOUND</div>
          <div className="text-slate-200 font-bold text-sm mt-0.5">
            {isConnected ? tokenCount : 0}
          </div>
        </div>
        <div className="bg-[#0b0e14] p-2.5 rounded border border-slate-800/60">
          <div className="text-[10px] text-slate-500">VALID CANDIDATES</div>
          <div className="text-slate-500 font-bold text-sm mt-0.5">--</div>
        </div>
        <div className="bg-[#0b0e14] p-2.5 rounded border border-slate-800/60">
          <div className="text-[10px] text-slate-500">SAFE CANDIDATES</div>
          <div className="text-slate-500 font-bold text-sm mt-0.5">--</div>
        </div>
        <div className="bg-[#0b0e14] p-2.5 rounded border border-slate-800/60">
          <div className="text-[10px] text-slate-500">SAFETY ENGINE</div>
          <div className="text-amber-500/80 font-bold text-[11px] mt-1">NOT AVAILABLE</div>
        </div>
      </div>

      {/* Live Data Table Preview */}
      <div className="bg-[#0b0e14] border border-slate-800/80 rounded overflow-x-auto">
        {!isConnected ? (
          <div className="p-6 text-center text-xs font-mono text-slate-500">
            Market data provider not connected. Enter BIRDEYE_API_KEY to stream mainnet tokens.
          </div>
        ) : tokensData.length === 0 ? (
          <div className="p-6 text-center text-xs font-mono text-slate-500">
            No active Solana tokens returned from provider.
          </div>
        ) : (
          <table className="w-full text-left font-mono text-xs text-slate-300 min-w-[600px]">
            <thead className="bg-[#121721] text-[10px] uppercase text-slate-400 border-b border-slate-800">
              <tr>
                <th className="p-2">Token</th>
                <th className="p-2">Price (USD)</th>
                <th className="p-2">24h Change</th>
                <th className="p-2">24h Volume</th>
                <th className="p-2">Liquidity</th>
                <th className="p-2">Source</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50 text-[11px]">
              {tokensData.slice(0, 5).map((tok, idx) => (
                <tr key={idx} className="hover:bg-slate-900/40">
                  <td className="p-2 font-bold text-slate-100 flex items-center gap-1.5">
                    <span>{tok.symbol}</span>
                    <span className="text-[9px] font-normal text-slate-500 truncate max-w-[100px]">
                      {tok.name}
                    </span>
                  </td>
                  <td className="p-2 text-slate-200">${tok.price < 0.01 ? tok.price.toFixed(6) : tok.price.toFixed(2)}</td>
                  <td
                    className={`p-2 font-semibold ${
                      tok.priceChange24h >= 0 ? "text-emerald-400" : "text-red-400"
                    }`}
                  >
                    {tok.priceChange24h >= 0 ? "+" : ""}
                    {tok.priceChange24h.toFixed(2)}%
                  </td>
                  <td className="p-2">${Math.round(tok.volume24hUsd).toLocaleString()}</td>
                  <td className="p-2">${Math.round(tok.liquidityUsd).toLocaleString()}</td>
                  <td className="p-2 text-[10px] text-slate-400 uppercase">{tok.source}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
