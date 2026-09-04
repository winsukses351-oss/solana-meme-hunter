"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Play, Square, RefreshCw, ShieldAlert, TrendingUp, DollarSign, 
  Key, Settings, Zap, ArrowUpRight, ArrowDownRight, Trash2, CheckCircle2 
} from "lucide-react";

export default function MemeBotDashboard() {
  // --- ENGINE STATE ---
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState([]);
  const [activeTrades, setActiveTrades] = useState([]);
  const [smartMoneyQueue, setSmartMoneyQueue] = useState({});

  // --- API & RPC CONFIG ---
  const [rpcEndpoint, setRpcEndpoint] = useState("https://api.mainnet-beta.solana.com");
  const [apiKey, setApiKey] = useState("");
  const [walletAddress, setWalletAddress] = useState("");

  // --- STRATEGY & RISK PARAMETERS ---
  const [minAiScore, setMinAiScore] = useState(75);
  const [minLiquidity, setMinLiquidity] = useState(10000);
  const [minVolume24h, setMinVolume24h] = useState(20000);
  const [minHolders, setMinHolders] = useState(150);
  const [tradeAmount, setTradeAmount] = useState(0.1);
  const [maxPositions, setMaxPositions] = useState(3);
  const [useDynamicRisk, setUseDynamicRisk] = useState(true);
  
  // Static Risk Fallbacks
  const [fixedTakeProfit, setFixedTakeProfit] = useState(30); // %
  const [fixedStopLoss, setFixedStopLoss] = useState(15);     // %
  const [trailingStop, setTrailingStop] = useState(5);        // %

  // --- MANUAL ENTRY STATE ---
  const [manualSymbol, setManualSymbol] = useState("");
  const [manualPrice, setManualPrice] = useState("");

  const activeTradesRef = useRef(activeTrades);
  const smartMoneyQueueRef = useRef(smartMoneyQueue);

  useEffect(() => {
    activeTradesRef.current = activeTrades;
  }, [activeTrades]);

  useEffect(() => {
    smartMoneyQueueRef.current = smartMoneyQueue;
  }, [smartMoneyQueue]);

  const addLog = (message, type = "info") => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [{ id: Date.now(), timestamp, message, type }, ...prev.slice(0, 99)]);
  };

  // --- CALCULATION HELPER ---
  const calculateDynamicLevels = (entryPrice, volatilityPercent) => {
    if (!useDynamicRisk) {
      return {
        stopLoss: entryPrice * (1 - fixedStopLoss / 100),
        takeProfit: entryPrice * (1 + fixedTakeProfit / 100),
        slPercent: fixedStopLoss.toString(),
        tpPercent: fixedTakeProfit.toString()
      };
    }

    const baseSL = fixedStopLoss / 100;
    const baseTP = fixedTakeProfit / 100;
    const volatilityMultiplier = 1 + (volatilityPercent / 100);
    
    const stopLossDist = baseSL * volatilityMultiplier;
    const takeProfitDist = baseTP * volatilityMultiplier;

    return {
      stopLoss: entryPrice * (1 - stopLossDist),
      takeProfit: entryPrice * (1 + takeProfitDist),
      slPercent: (stopLossDist * 100).toFixed(1),
      tpPercent: (takeProfitDist * 100).toFixed(1)
    };
  };

  // --- SMART MONEY CONSENSUS ---
  const processSmartMoneyConsensus = (token) => {
    const now = Date.now();
    const consensusWindowMs = 5 * 60 * 1000; // 5 menit
    const existingEntry = smartMoneyQueueRef.current[token.symbol] || { count: 0, firstSeen: now };

    if (now - existingEntry.firstSeen > consensusWindowMs) {
      existingEntry.count = 0;
      existingEntry.firstSeen = now;
    }

    const newCount = existingEntry.count + 1;
    
    setSmartMoneyQueue((prev) => ({
      ...prev,
      [token.symbol]: { count: newCount, firstSeen: existingEntry.firstSeen }
    }));

    addLog(`🔍 Smart Money detected on $${token.symbol} (${newCount}/2 confirmations)`, "warning");

    if (newCount >= 2) {
      addLog(`🔥 CONSENSUS REACHED! 2+ Smart Money bought $${token.symbol}.`, "success");
      setSmartMoneyQueue((prev) => {
        const copy = { ...prev };
        delete copy[token.symbol];
        return copy;
      });
      return true;
    }

    return false;
  };

  // --- AUTO / MANUAL BUY EXECUTION ---
  const executeBuy = (token, isManual = false) => {
    if (activeTradesRef.current.length >= maxPositions) {
      addLog(`⚠️ [GUARD] Max positions limit reached (${maxPositions}). Skipped $${token.symbol}`, "warning");
      return;
    }

    const isAlreadyOpen = activeTradesRef.current.some((trade) => trade.symbol === token.symbol);
    if (isAlreadyOpen) {
      addLog(`⚠️ [GUARD] Position $${token.symbol} already active. Anti-DCA blocked entry!`, "warning");
      return;
    }

    const volatility = Math.floor(Math.random() * 20) + 5;
    const levels = calculateDynamicLevels(token.price, volatility);

    const newPosition = {
      id: Date.now(),
      symbol: token.symbol.toUpperCase(),
      entryPrice: token.price,
      currentPrice: token.price,
      highestPrice: token.price,
      amount: tradeAmount,
      stopLoss: levels.stopLoss,
      takeProfit: levels.takeProfit,
      slPercent: levels.slPercent,
      tpPercent: levels.tpPercent,
      pnl: 0,
      isManual
    };

    setActiveTrades((prev) => [...prev, newPosition]);
    addLog(
      `🚀 ${isManual ? "MANUAL" : "AUTO"} BUY $${token.symbol.toUpperCase()} @ $${token.price} | TP: +${levels.tpPercent}% | SL: -${levels.slPercent}%`, 
      "success"
    );
  };

  // --- MANUAL TRADE HANDLER ---
  const handleManualBuy = (e) => {
    e.preventDefault();
    if (!manualSymbol || !manualPrice) return;

    executeBuy({
      symbol: manualSymbol,
      price: parseFloat(manualPrice)
    }, true);

    setManualSymbol("");
    setManualPrice("");
  };

  // --- QUICK PRESET BUY ---
  const handleQuickBuy = (symbol, basePrice) => {
    executeBuy({
      symbol: symbol,
      price: basePrice
    }, true);
  };

  // --- FORCE CLOSE POSITION ---
  const handleForceClose = (id, symbol, currentPrice) => {
    setActiveTrades((prev) => prev.filter((t) => t.id !== id));
    addLog(`🖐️ Manual Close $${symbol} executed @ $${currentPrice}`, "warning");
  };

  // --- AUTOMATIC MARKET SCANNER ---
  useEffect(() => {
    if (!isRunning) return;

    const scannerInterval = setInterval(() => {
      const mockTokens = ["PEPE", "BONK", "WIF", "POPCAT", "FLOKI", "MEW", "BOME"];
      const randomSymbol = mockTokens[Math.floor(Math.random() * mockTokens.length)];
      
      const tokenCandidate = {
        symbol: randomSymbol,
        price: Number((Math.random() * 0.001 + 0.0001).toFixed(6)),
        aiScore: Math.floor(Math.random() * 40) + 60,
        liquidity: Math.floor(Math.random() * 30000) + 5000,
        volume24h: Math.floor(Math.random() * 50000) + 5000,
        holderCount: Math.floor(Math.random() * 500) + 50,
      };

      if (
        tokenCandidate.aiScore >= minAiScore &&
        tokenCandidate.liquidity >= minLiquidity &&
        tokenCandidate.volume24h >= minVolume24h &&
        tokenCandidate.holderCount >= minHolders
      ) {
        const isConsensusPassed = processSmartMoneyConsensus(tokenCandidate);
        if (isConsensusPassed) {
          executeBuy(tokenCandidate);
        }
      }
    }, 3500);

    return () => clearInterval(scannerInterval);
  }, [isRunning, minAiScore, minLiquidity, minVolume24h, minHolders, tradeAmount, maxPositions, useDynamicRisk, fixedTakeProfit, fixedStopLoss]);

  // --- POSITION MONITOR & PNL ENGINE ---
  useEffect(() => {
    if (!isRunning || activeTrades.length === 0) return;

    const monitorInterval = setInterval(() => {
      setActiveTrades((prevTrades) =>
        prevTrades
          .map((trade) => {
            const priceChange = (Math.random() * 0.08 - 0.038);
            const updatedPrice = Number((trade.currentPrice * (1 + priceChange)).toFixed(6));
            const newHighestPrice = Math.max(trade.highestPrice || trade.entryPrice, updatedPrice);
            const pnlPercent = ((updatedPrice - trade.entryPrice) / trade.entryPrice) * 100;

            // Trailing Stop Check
            const trailingStopPrice = newHighestPrice * (1 - trailingStop / 100);

            // Take Profit Check
            if (updatedPrice >= trade.takeProfit) {
              addLog(`🎯 [TAKE PROFIT] $${trade.symbol} closed @ $${updatedPrice} (+${pnlPercent.toFixed(2)}%)`, "success");
              return null;
            }
            
            // Stop Loss Check
            if (updatedPrice <= trade.stopLoss) {
              addLog(`🛑 [STOP LOSS] $${trade.symbol} closed @ $${updatedPrice} (${pnlPercent.toFixed(2)}%)`, "error");
              return null;
            }

            // Trailing Stop Trigger Check
            if (pnlPercent > 10 && updatedPrice <= trailingStopPrice) {
              addLog(`📉 [TRAILING STOP] $${trade.symbol} locked profit @ $${updatedPrice} (+${pnlPercent.toFixed(2)}%)`, "warning");
              return null;
            }

            return { 
              ...trade, 
              currentPrice: updatedPrice, 
              highestPrice: newHighestPrice,
              pnl: pnlPercent 
            };
          })
          .filter(Boolean)
      );
    }, 2000);

    return () => clearInterval(monitorInterval);
  }, [isRunning, activeTrades, trailingStop]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-6 font-mono">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 border-b border-slate-800 pb-4 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-emerald-400 flex items-center gap-2">
            <TrendingUp /> MEMEBOT PRO ENGINE v2.0
          </h1>
          <p className="text-xs text-slate-400">Consensus Engine + Dynamic Risk + Manual Control</p>
        </div>
        <button
          onClick={() => setIsRunning(!isRunning)}
          className={`w-full md:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg font-bold transition ${
            isRunning ? "bg-rose-600 hover:bg-rose-700" : "bg-emerald-600 hover:bg-emerald-700"
          }`}
        >
          {isRunning ? <Square size={18} /> : <Play size={18} />}
          {isRunning ? "STOP BOT" : "START BOT"}
        </button>
      </div>

      {/* Grid Utama Input Config */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* RPC & Network Config */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-3">
          <h3 className="text-sm font-bold text-slate-300 flex items-center gap-2">
            <Key size={16} className="text-sky-400" /> Network & API Config
          </h3>
          <div className="space-y-2 text-xs">
            <div>
              <label className="text-slate-400 block mb-1">RPC Endpoint:</label>
              <input
                type="text"
                value={rpcEndpoint}
                onChange={(e) => setRpcEndpoint(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 px-2 py-1.5 rounded text-slate-200"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">API Key / Secret:</label>
              <input
                type="password"
                placeholder="Paste API Key..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 px-2 py-1.5 rounded text-slate-200"
              />
            </div>
          </div>
        </div>

        {/* Strategy Filters */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-3">
          <h3 className="text-sm font-bold text-slate-300 flex items-center gap-2">
            <ShieldAlert size={16} className="text-amber-400" /> Scanner Filters
          </h3>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span>Min AI Score:</span>
              <input
                type="number"
                value={minAiScore}
                onChange={(e) => setMinAiScore(Number(e.target.value))}
                className="bg-slate-800 border border-slate-700 w-20 px-2 py-1 rounded text-right"
              />
            </div>
            <div className="flex justify-between items-center">
              <span>Min Liquidity ($):</span>
              <input
                type="number"
                value={minLiquidity}
                onChange={(e) => setMinLiquidity(Number(e.target.value))}
                className="bg-slate-800 border border-slate-700 w-20 px-2 py-1 rounded text-right"
              />
            </div>
            <div className="flex justify-between items-center">
              <span>Min Vol 24h ($):</span>
              <input
                type="number"
                value={minVolume24h}
                onChange={(e) => setMinVolume24h(Number(e.target.value))}
                className="bg-slate-800 border border-slate-700 w-20 px-2 py-1 rounded text-right"
              />
            </div>
            <div className="flex justify-between items-center">
              <span>Min Holders:</span>
              <input
                type="number"
                value={minHolders}
                onChange={(e) => setMinHolders(Number(e.target.value))}
                className="bg-slate-800 border border-slate-700 w-20 px-2 py-1 rounded text-right"
              />
            </div>
          </div>
        </div>

        {/* Risk & Execution Config */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-3">
          <h3 className="text-sm font-bold text-slate-300 flex items-center gap-2">
            <Settings size={16} className="text-purple-400" /> Risk Management
          </h3>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span>Trade Amt (SOL):</span>
              <input
                type="number"
                step="0.05"
                value={tradeAmount}
                onChange={(e) => setTradeAmount(Number(e.target.value))}
                className="bg-slate-800 border border-slate-700 w-20 px-2 py-1 rounded text-right"
              />
            </div>
            <div className="flex justify-between items-center">
              <span>Base TP / SL (%):</span>
              <div className="flex gap-1 w-24">
                <input
                  type="number"
                  value={fixedTakeProfit}
                  onChange={(e) => setFixedTakeProfit(Number(e.target.value))}
                  className="bg-slate-800 border border-slate-700 w-12 px-1 py-1 rounded text-right text-emerald-400"
                  title="Take Profit %"
                />
                <input
                  type="number"
                  value={fixedStopLoss}
                  onChange={(e) => setFixedStopLoss(Number(e.target.value))}
                  className="bg-slate-800 border border-slate-700 w-12 px-1 py-1 rounded text-right text-rose-400"
                  title="Stop Loss %"
                />
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span>Trailing Stop (%):</span>
              <input
                type="number"
                value={trailingStop}
                onChange={(e) => setTrailingStop(Number(e.target.value))}
                className="bg-slate-800 border border-slate-700 w-20 px-2 py-1 rounded text-right"
              />
            </div>
            <div className="flex justify-between items-center pt-1">
              <span>Dynamic Volatility Risk:</span>
              <input
                type="checkbox"
                checked={useDynamicRisk}
                onChange={(e) => setUseDynamicRisk(e.target.checked)}
                className="accent-emerald-500 rounded"
              />
            </div>
          </div>
        </div>

        {/* Engine Overview */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col justify-between">
          <h3 className="text-sm font-bold text-slate-300">Engine Status</h3>
          <div className="text-center py-2">
            <span className={`text-lg font-bold ${isRunning ? "text-emerald-400" : "text-rose-500"}`}>
              {isRunning ? "RUNNING & SCANNING" : "ENGINE PAUSED"}
            </span>
          </div>
          <div className="text-xs text-slate-400 space-y-1">
            <div className="flex justify-between">
              <span>Smart Consensus:</span>
              <span className="text-emerald-400">Min 2 Wallet</span>
            </div>
            <div className="flex justify-between">
              <span>Anti-DCA Guard:</span>
              <span className="text-emerald-400">ACTIVE</span>
            </div>
          </div>
        </div>
      </div>

      {/* Manual Execution & Preset Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Manual Order Input */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl md:col-span-2">
          <h3 className="text-sm font-bold text-slate-300 mb-3 flex items-center gap-2">
            <Zap size={16} className="text-amber-400" /> Manual Instant Buy Order
          </h3>
          <form onSubmit={handleManualBuy} className="flex flex-col md:flex-row gap-3">
            <input
              type="text"
              placeholder="Token Symbol (e.g. PEPE)"
              value={manualSymbol}
              onChange={(e) => setManualSymbol(e.target.value)}
              className="bg-slate-800 border border-slate-700 px-3 py-2 rounded text-xs flex-1"
            />
            <input
              type="number"
              step="any"
              placeholder="Est. Price USD"
              value={manualPrice}
              onChange={(e) => setManualPrice(e.target.value)}
              className="bg-slate-800 border border-slate-700 px-3 py-2 rounded text-xs flex-1"
            />
            <button
              type="submit"
              className="bg-sky-600 hover:bg-sky-700 text-white font-bold px-4 py-2 rounded text-xs transition"
            >
              EXECUTE BUY
            </button>
          </form>
        </div>

        {/* Quick Hot Tokens Preset */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <h3 className="text-sm font-bold text-slate-300 mb-3">Hot Preset Sniper</h3>
          <div className="flex flex-wrap gap-2">
            {[
              { name: "BONK", price: 0.000024 },
              { name: "WIF", price: 2.15 },
              { name: "PEPE", price: 0.000008 }
            ].map((preset) => (
              <button
                key={preset.name}
                onClick={() => handleQuickBuy(preset.name, preset.price)}
                className="bg-slate-800 hover:bg-slate-700 border border-slate-700 px-3 py-1.5 rounded text-xs font-bold text-slate-300 flex items-center gap-1"
              >
                + Buy ${preset.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Grid: Open Positions & Live Console Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Positions */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <h2 className="text-sm font-bold text-slate-200 mb-4 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <RefreshCw size={16} className={isRunning ? "animate-spin text-emerald-400" : ""} />
              Active Positions ({activeTrades.length}/{maxPositions})
            </span>
          </h2>

          {activeTrades.length === 0 ? (
            <div className="text-xs text-slate-500 text-center py-12 border border-dashed border-slate-800 rounded-lg">
              Belum ada posisi terbuka.
            </div>
          ) : (
            <div className="space-y-3">
              {activeTrades.map((trade) => (
                <div key={trade.id} className="bg-slate-950 border border-slate-800 p-3 rounded-lg text-xs space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-emerald-400 flex items-center gap-2">
                      ${trade.symbol} {trade.isManual && <span className="text-[10px] bg-sky-950 text-sky-400 border border-sky-800 px-1.5 rounded">MANUAL</span>}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className={`font-bold ${trade.pnl >= 0 ? "text-emerald-400" : "text-rose-500"}`}>
                        {trade.pnl >= 0 ? "+" : ""}{trade.pnl.toFixed(2)}%
                      </span>
                      <button
                        onClick={() => handleForceClose(trade.id, trade.symbol, trade.currentPrice)}
                        className="text-slate-500 hover:text-rose-400 p-1 transition"
                        title="Force Close Position"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-slate-400">
                    <div>Entry: ${trade.entryPrice}</div>
                    <div>Current: ${trade.currentPrice}</div>
                    <div>TP: ${trade.takeProfit} (+{trade.tpPercent}%)</div>
                    <div>SL: ${trade.stopLoss} (-{trade.slPercent}%)</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Live Logs */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <h2 className="text-sm font-bold text-slate-200 mb-4">System Console Logs</h2>
          <div className="bg-slate-950 rounded-lg p-3 h-80 overflow-y-auto space-y-1 text-xs">
            {logs.length === 0 ? (
              <p className="text-slate-600">Bot idle. Tekan START BOT untuk mulai...</p>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="flex gap-2">
                  <span className="text-slate-500">[{log.timestamp}]</span>
                  <span
                    className={
                      log.type === "success"
                        ? "text-emerald-400 font-bold"
                        : log.type === "error"
                        ? "text-rose-400 font-bold"
                        : log.type === "warning"
                        ? "text-amber-400"
                        : "text-slate-300"
                    }
                  >
                    {log.message}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
