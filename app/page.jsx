"use client";

import React, { useState, useEffect, useRef } from "react";
import { Play, Square, RefreshCw, ShieldAlert, TrendingUp, DollarSign } from "lucide-react";

export default function MemeBotDashboard() {
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState([]);
  const [activeTrades, setActiveTrades] = useState([]);
  const [smartMoneyQueue, setSmartMoneyQueue] = useState({}); // Queue untuk Smart Money Consensus

  // Parameters
  const [minAiScore, setMinAiScore] = useState(75);
  const [minLiquidity, setMinLiquidity] = useState(10000); // $10k min liq
  const [minVolume24h, setMinVolume24h] = useState(20000);  // NEW: $20k min volume
  const [minHolders, setMinHolders] = useState(150);        // NEW: Min 150 holders
  const [tradeAmount, setTradeAmount] = useState(0.1);      // SOL
  const [maxPositions, setMaxPositions] = useState(3);

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
    setLogs((prev) => [{ id: Date.now(), timestamp, message, type }, ...prev.slice(0, 49)]);
  };

  // 1. DYNAMIC TP/SL CALCULATOR BASED ON VOLATILITY
  const calculateDynamicLevels = (entryPrice, volatilityPercent) => {
    // Basic Risk-Reward 1:2, dilebarkan saat volatilitas tinggi
    const baseSL = 0.12; // 12%
    const baseTP = 0.24; // 24%
    
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

  // 2. SMART MONEY CONSENSUS CHECKER
  const processSmartMoneyConsensus = (token) => {
    const now = Date.now();
    const consensusWindowMs = 5 * 60 * 1000; // Window 5 menit
    const existingEntry = smartMoneyQueueRef.current[token.symbol] || { count: 0, firstSeen: now };

    // Reset jika transaksi sudah kadaluwarsa (> 5 menit)
    if (now - existingEntry.firstSeen > consensusWindowMs) {
      existingEntry.count = 0;
      existingEntry.firstSeen = now;
    }

    const newCount = existingEntry.count + 1;
    
    // Update State Queue
    setSmartMoneyQueue((prev) => ({
      ...prev,
      [token.symbol]: { count: newCount, firstSeen: existingEntry.firstSeen }
    }));

    addLog(`🔍 Smart Money detected on $${token.symbol} (${newCount}/2 confirmations)`, "warning");

    // Eksekusi jika minimal 2 Smart Money masuk
    if (newCount >= 2) {
      addLog(`🔥 CONSENSUS REACHED! 2+ Smart Money bought $${token.symbol}. Proceeding entry...`, "success");
      // Reset Queue untuk token ini
      setSmartMoneyQueue((prev) => {
        const copy = { ...prev };
        delete copy[token.symbol];
        return copy;
      });
      return true;
    }

    return false;
  };

  // 3. EXECUTE AUTO BUY WITH ANTI-DCA GUARD
  const executeAutoBuy = (token) => {
    // Guard 1: Max Position Check
    if (activeTradesRef.current.length >= maxPositions) {
      addLog(`⚠️ [GUARD] Max position limit reached (${maxPositions}). Skipped $${token.symbol}`, "warning");
      return;
    }

    // Guard 2: Anti-DCA / Anti-Duplicate Entry
    const isAlreadyOpen = activeTradesRef.current.some((trade) => trade.symbol === token.symbol);
    if (isAlreadyOpen) {
      addLog(`⚠️ [GUARD] Position $${token.symbol} is already active. Duplicate skipped!`, "warning");
      return;
    }

    // Calculate Dynamic Risk
    const volatility = Math.floor(Math.random() * 20) + 5; // Dynamic volatility 5-25%
    const levels = calculateDynamicLevels(token.price, volatility);

    const newPosition = {
      id: Date.now(),
      symbol: token.symbol,
      entryPrice: token.price,
      currentPrice: token.price,
      amount: tradeAmount,
      stopLoss: levels.stopLoss,
      takeProfit: levels.takeProfit,
      slPercent: levels.slPercent,
      tpPercent: levels.tpPercent,
      pnl: 0,
    };

    setActiveTrades((prev) => [...prev, newPosition]);
    addLog(`🚀 BOUGHT $${token.symbol} @ $${token.price} | Dynamic TP: +${levels.tpPercent}% | SL: -${levels.slPercent}%`, "success");
  };

  // 4. MARKET SCANNER SIMULATION
  useEffect(() => {
    if (!isRunning) return;

    const scannerInterval = setInterval(() => {
      // Mock Scanning DATA
      const mockTokens = ["PEPE2", "DOGE3", "SOLAPE", "CATCOIN", "BONK2"];
      const randomSymbol = mockTokens[Math.floor(Math.random() * mockTokens.length)];
      
      const tokenCandidate = {
        symbol: randomSymbol,
        price: Number((Math.random() * 0.001 + 0.0001).toFixed(6)),
        aiScore: Math.floor(Math.random() * 40) + 60,
        liquidity: Math.floor(Math.random() * 30000) + 5000,
        volume24h: Math.floor(Math.random() * 50000) + 5000,
        holderCount: Math.floor(Math.random() * 500) + 50,
      };

      // Apply Hard Filters
      if (
        tokenCandidate.aiScore >= minAiScore &&
        tokenCandidate.liquidity >= minLiquidity &&
        tokenCandidate.volume24h >= minVolume24h &&
        tokenCandidate.holderCount >= minHolders
      ) {
        // Pass to Smart Money Consensus Engine
        const isConsensusPassed = processSmartMoneyConsensus(tokenCandidate);
        if (isConsensusPassed) {
          executeAutoBuy(tokenCandidate);
        }
      }
    }, 4000);

    return () => clearInterval(scannerInterval);
  }, [isRunning, minAiScore, minLiquidity, minVolume24h, minHolders, tradeAmount, maxPositions]);

  // 5. POSITION MONITOR & PNL ENGINE
  useEffect(() => {
    if (!isRunning || activeTrades.length === 0) return;

    const monitorInterval = setInterval(() => {
      setActiveTrades((prevTrades) =>
        prevTrades
          .map((trade) => {
            // Fluktuasi harga acak
            const priceChange = (Math.random() * 0.08 - 0.038); // Slanted slightly positive
            const updatedPrice = Number((trade.currentPrice * (1 + priceChange)).toFixed(6));
            const pnlPercent = ((updatedPrice - trade.entryPrice) / trade.entryPrice) * 100;

            // Trigger TP / SL Check
            if (updatedPrice >= trade.takeProfit) {
              addLog(`🎯 [TAKE PROFIT] $${trade.symbol} closed @ $${updatedPrice} (+${pnlPercent.toFixed(2)}%)`, "success");
              return null; // Remove position
            }
            if (updatedPrice <= trade.stopLoss) {
              addLog(`🛑 [STOP LOSS] $${trade.symbol} closed @ $${updatedPrice} (${pnlPercent.toFixed(2)}%)`, "error");
              return null; // Remove position
            }

            return { ...trade, currentPrice: updatedPrice, pnl: pnlPercent };
          })
          .filter(Boolean)
      );
    }, 2500);

    return () => clearInterval(monitorInterval);
  }, [isRunning, activeTrades]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 font-mono">
      {/* Header */}
      <div className="flex justify-between items-center mb-8 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-emerald-400 flex items-center gap-2">
            <TrendingUp /> MEMEBOT PRO ENGINE v2.0
          </h1>
          <p className="text-xs text-slate-400">Consensus Engine + Dynamic Risk Management</p>
        </div>
        <button
          onClick={() => setIsRunning(!isRunning)}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold transition ${
            isRunning ? "bg-rose-600 hover:bg-rose-700" : "bg-emerald-600 hover:bg-emerald-700"
          }`}
        >
          {isRunning ? <Square size={18} /> : <Play size={18} />}
          {isRunning ? "STOP BOT" : "START BOT"}
        </button>
      </div>

      {/* Control Panel Parameters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-3">
          <h3 className="text-sm font-bold text-slate-300 flex items-center gap-2">
            <ShieldAlert size={16} className="text-amber-400" /> Filters & Requirements
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
              <span>Min Volume 24h ($):</span>
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

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-3">
          <h3 className="text-sm font-bold text-slate-300 flex items-center gap-2">
            <DollarSign size={16} className="text-emerald-400" /> Position Controls
          </h3>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span>Trade Amount (SOL):</span>
              <input
                type="number"
                step="0.05"
                value={tradeAmount}
                onChange={(e) => setTradeAmount(Number(e.target.value))}
                className="bg-slate-800 border border-slate-700 w-20 px-2 py-1 rounded text-right"
              />
            </div>
            <div className="flex justify-between items-center">
              <span>Max Active Positions:</span>
              <input
                type="number"
                value={maxPositions}
                onChange={(e) => setMaxPositions(Number(e.target.value))}
                className="bg-slate-800 border border-slate-700 w-20 px-2 py-1 rounded text-right"
              />
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col justify-between">
          <h3 className="text-sm font-bold text-slate-300">Active Engine Status</h3>
          <div className="text-center py-2">
            <span className={`text-xl font-bold ${isRunning ? "text-emerald-400" : "text-rose-500"}`}>
              {isRunning ? "RUNNING & SCANNING" : "ENGINE PAUSED"}
            </span>
          </div>
          <div className="text-xs text-slate-400 flex justify-between">
            <span>Consensus Target: 2 Smart Wallet</span>
            <span>Risk-Reward: Dynamic 1:2+</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Open Positions & Live Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Positions */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <h2 className="text-sm font-bold text-slate-200 mb-4 flex items-center gap-2">
            <RefreshCw size={16} className={isRunning ? "animate-spin text-emerald-400" : ""} />
            Active Positions ({activeTrades.length}/{maxPositions})
          </h2>

          {activeTrades.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-8">Belum ada posisi terbuka.</p>
          ) : (
            <div className="space-y-3">
              {activeTrades.map((trade) => (
                <div key={trade.id} className="bg-slate-950 border border-slate-800 p-3 rounded-lg text-xs space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-emerald-400">${trade.symbol}</span>
                    <span className={`font-bold ${trade.pnl >= 0 ? "text-emerald-400" : "text-rose-500"}`}>
                      {trade.pnl >= 0 ? "+" : ""}{trade.pnl.toFixed(2)}%
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-slate-400">
                    <div>Entry: ${trade.entryPrice}</div>
                    <div>Current: ${trade.currentPrice}</div>
                    <div>TP Target: ${trade.takeProfit} (+{trade.tpPercent}%)</div>
                    <div>SL Target: ${trade.stopLoss} (-{trade.slPercent}%)</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Console Logs */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <h2 className="text-sm font-bold text-slate-200 mb-4">System & Trade Logs</h2>
          <div className="bg-slate-950 rounded-lg p-3 h-80 overflow-y-auto space-y-1 text-xs">
            {logs.map((log) => (
              <div key={log.id} className="flex gap-2">
                <span className="text-slate-500">[{log.timestamp}]</span>
                <span
                  className={
                    log.type === "success"
                      ? "text-emerald-400"
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
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
