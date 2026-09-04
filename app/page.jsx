'use client';
import React, { useState, useEffect } from 'react';

export default function Home() {
  const [isRunning, setIsRunning] = useState(false);
  const [isPausedDrawdown, setIsPausedDrawdown] = useState(false);
  const [tradeMode, setTradeMode] = useState('demo'); // 'demo' | 'live'
  
  // 8. CAPITAL MANAGEMENT ($10 Default)
  const [balanceUSD, setBalanceUSD] = useState(10.0);
  const [initialCapital] = useState(10.0);
  const [riskPercent, setRiskPercent] = useState(20);
  const [takeProfit, setTakeProfit] = useState(50);
  const [stopLoss, setStopLoss] = useState(15);
  const [maxPositions, setMaxPositions] = useState(3);
  const [dailyLossLimit, setDailyLossLimit] = useState(3.0); // Pause jika rugi $3 hari ini
  const [dailyLossCurrent, setDailyLossCurrent] = useState(0.0);

  // 9. COMPOUND SYSTEM
  const [compoundRate, setCompoundRate] = useState(0); // 0, 0.25, 0.50, 0.75, 1.0

  // 10. COST ENGINE SETTINGS
  const [gasFeeUSD] = useState(0.002);
  const [priorityFeeUSD] = useState(0.005);
  const [slippagePercent] = useState(1.0);

  // DATA STORES
  const [scannedTokens, setScannedTokens] = useState([]);
  const [activeTrades, setActiveTrades] = useState([]);
  const [whaleLogs, setWhaleLogs] = useState([]);
  const [smartMoneyLogs, setSmartMoneyLogs] = useState([]);
  const [logs, setLogs] = useState([]);

  // 1. DISCOVERY & SCORE GENERATOR ENGINE (Pump.fun, Raydium, Meteora, Jupiter, DexScreener, Birdeye)
  const dexSources = ['Pump.fun', 'Raydium', 'Meteora', 'Jupiter', 'DexScreener', 'Birdeye'];

  const generateDiscoveryToken = () => {
    const mockSymbols = ['PEPE', 'SOLWIF', 'BONK', 'PUMP', 'MOON', 'DOGE', 'CAT', 'BULL', 'NEIRO', 'PENGU'];
    const symbol = mockSymbols[Math.floor(Math.random() * mockSymbols.length)] + Math.floor(Math.random() * 900 + 100);
    const sourceDEX = dexSources[Math.floor(Math.random() * dexSources.length)];
    
    // 2-5. SUB-SCORES ENGINE
    const smartMoneyScore = Math.floor(Math.random() * 35) + 65; // 65-100
    const whaleScore = Math.floor(Math.random() * 40) + 60;      // 60-100
    const momentumScore = Math.floor(Math.random() * 30) + 70;   // 70-100
    const safetyScore = Math.floor(Math.random() * 40) + 55;     // 55-95 (Honeypot/Rug Check)

    // 6. AI OPPORTUNITY SCORE (Weighted Combination)
    const oppScore = Math.round(
      smartMoneyScore * 0.25 + whaleScore * 0.25 + momentumScore * 0.25 + safetyScore * 0.25
    );

    let category = 'AVOID';
    if (oppScore >= 90) category = 'ELITE';
    else if (oppScore >= 80) category = 'HIGH POTENTIAL';
    else if (oppScore >= 70) category = 'MODERATE';

    const liquidity = Math.floor(Math.random() * 50000) + 3000;
    const price = parseFloat((Math.random() * 0.005 + 0.0001).toFixed(6));

    return {
      symbol,
      sourceDEX,
      price,
      liquidity,
      smartMoneyScore,
      whaleScore,
      momentumScore,
      safetyScore,
      oppScore,
      category,
      time: new Date().toLocaleTimeString('id-ID')
    };
  };

  // SCANNER LOOP
  const scanMarket = async () => {
    if (isPausedDrawdown) return;

    const newToken = generateDiscoveryToken();

    setScannedTokens((prev) => [newToken, ...prev.slice(0, 4)]);
    addLog(`[DISCOVERY] $${newToken.symbol} via ${newToken.sourceDEX} | AI Score: ${newToken.oppScore} (${newToken.category})`);

    if (newToken.smartMoneyScore >= 85) {
      addSmartMoneyLog(`[SMART MONEY] High Win-Rate Wallet bought $${newToken.symbol}`);
    }
    if (newToken.whaleScore >= 85) {
      addWhaleLog(`[WHALE] Large Cluster Accumulation di $${newToken.symbol}`);
    }

    // AUTO BUY CONDITION (Only Elite or High Potential & Safety > 70)
    if (newToken.oppScore >= 80 && newToken.safetyScore >= 70 && tradeMode === 'demo') {
      executeAutoBuy(newToken);
    }
  };

  // 7. AUTO TRADING & COMPOUND EXECUTION
  const executeAutoBuy = (token) => {
    if (activeTrades.length >= maxPositions) return;

    setBalanceUSD((prevBalance) => {
      // Net Profit untuk Compounding
      const totalNetProfit = Math.max(0, prevBalance - initialCapital);
      const compoundBonus = totalNetProfit * compoundRate;
      const baseCapital = prevBalance - compoundBonus;

      // Position Sizing + Risk Management
      const positionSize = parseFloat(((baseCapital + compoundBonus) * (riskPercent / 100)).toFixed(2));
      const totalCostPerTrade = gasFeeUSD + priorityFeeUSD + (positionSize * (slippagePercent / 100));

      if (prevBalance >= positionSize + totalCostPerTrade && positionSize >= 0.5) {
        const newTrade = {
          ...token,
          id: Date.now() + Math.random(),
          entryPrice: token.price,
          currentPrice: token.price,
          positionSizeUSD: positionSize,
          costUSD: totalCostPerTrade,
          pnlPercent: 0,
          pnlUSD: 0,
          netProfitUSD: -totalCostPerTrade, // potong biaya gas awal
          peakPnlPercent: 0,
          isPartialTPDone: false, // 7. Partial TP Flag
          isBreakEvenActive: false // 7. Break Even Flag
        };

        addLog(`[AUTO-BUY] $${token.symbol} | Size: $${positionSize} | Cost (Gas/Slippage): $${totalCostPerTrade.toFixed(3)}`);
        
        setTimeout(() => {
          setActiveTrades((prev) => [newTrade, ...prev]);
        }, 0);

        return parseFloat((prevBalance - positionSize - totalCostPerTrade).toFixed(2));
      }
      return prevBalance;
    });
  };

  // 7 & 10. REAL-TIME PnL, AUTO TP/SL, TRAILING STOP, BREAK EVEN, COST ENGINE
  useEffect(() => {
    if (!isRunning || activeTrades.length === 0) return;

    const interval = setInterval(() => {
      setActiveTrades((prevTrades) => {
        const updatedTrades = [];

        prevTrades.forEach((trade) => {
          // Fluktuasi harga acak (-7% s/d +9%)
          const priceChange = (Math.random() * 16 - 7);
          const newPnlPercent = parseFloat((trade.pnlPercent + priceChange).toFixed(2));
          const newPrice = trade.currentPrice * (1 + priceChange / 100);
          
          let currentSizeUSD = trade.positionSizeUSD;
          const grossPnlUSD = parseFloat((currentSizeUSD * (newPnlPercent / 100)).toFixed(2));
          const netPnlUSD = grossPnlUSD - trade.costUSD;

          // Record Peak PnL untuk Trailing Stop
          const peakPnl = Math.max(trade.peakPnlPercent || 0, newPnlPercent);

          // 7. PARTIAL TAKE PROFIT (Take 50% Profit saat +25%)
          let isPartialDone = trade.isPartialTPDone;
          let isBreakEven = trade.isBreakEvenActive;

          if (!isPartialDone && newPnlPercent >= takeProfit / 2) {
            isPartialDone = true;
            isBreakEven = true; // Activate Break Even Protection
            const realizedSize = currentSizeUSD * 0.5;
            const realizedGrossProfit = realizedSize * (newPnlPercent / 100);
            
            currentSizeUSD = currentSizeUSD * 0.5; // Sisa posisi 50%
            setBalanceUSD((b) => parseFloat((b + realizedSize + realizedGrossProfit).toFixed(2)));
            addLog(`[PARTIAL TP 💰] $${trade.symbol} Realized 50% Position @ +${newPnlPercent}%`);
          }

          // Effective Stop Loss (jika Break Even aktif, SL minimal di 0%)
          const effectiveSL = isBreakEven ? Math.max(0, -stopLoss) : -stopLoss;

          // 7. AUTO TAKE PROFIT (FULL)
          if (newPnlPercent >= takeProfit) {
            const returnAmount = currentSizeUSD + grossPnlUSD;
            closeTradeSuccess(trade, returnAmount, netPnlUSD, `[AUTO-TP 🎯] +${newPnlPercent}%`);
            return;
          }

          // 7. AUTO STOP LOSS & BREAK EVEN PROTECTION
          if (newPnlPercent <= effectiveSL) {
            const returnAmount = Math.max(0, currentSizeUSD + grossPnlUSD);
            closeTradeLoss(trade, returnAmount, netPnlUSD, `[AUTO-SL 🛑] ${newPnlPercent}%`);
            return;
          }

          // 7. TRAILING STOP LOSS (Rontok > 15% dari puncaknya)
          if (peakPnl >= 20 && (peakPnl - newPnlPercent) >= 15) {
            const returnAmount = Math.max(0, currentSizeUSD + grossPnlUSD);
            closeTradeSuccess(trade, returnAmount, netPnlUSD, `[TRAILING STOP 📈] Dropped from +${peakPnl}% to +${newPnlPercent}%`);
            return;
          }

          updatedTrades.push({
            ...trade,
            currentPrice: newPrice,
            positionSizeUSD: currentSizeUSD,
            pnlPercent: newPnlPercent,
            pnlUSD: grossPnlUSD,
            netProfitUSD: netPnlUSD,
            peakPnlPercent: peakPnl,
            isPartialTPDone: isPartialDone,
            isBreakEvenActive: isBreakEven
          });
        });

        return updatedTrades;
      });
    }, 2500);

    return () => clearInterval(interval);
  }, [isRunning, takeProfit, stopLoss, activeTrades.length]);

  // HANDLE CLOSE POSITIONS
  const closeTradeSuccess = (trade, returnAmount, netPnlUSD, reason) => {
    setBalanceUSD((prev) => parseFloat((prev + returnAmount).toFixed(2)));
    addLog(`${reason} | $${trade.symbol} Net Profit: +$${netPnlUSD.toFixed(2)}`);
  };

  const closeTradeLoss = (trade, returnAmount, netPnlUSD, reason) => {
    const lossVal = Math.abs(netPnlUSD);
    setBalanceUSD((prev) => parseFloat((prev + returnAmount).toFixed(2)));
    
    // 8. CAPITAL MANAGEMENT: Daily Loss Circuit Breaker
    setDailyLossCurrent((prevLoss) => {
      const totalLoss = prevLoss + lossVal;
      if (totalLoss >= dailyLossLimit) {
        setIsPausedDrawdown(true);
        addLog(`[CIRCUIT BREAKER 🚨] Daily Loss Limit ($${dailyLossLimit}) Reached! Bot Paused.`);
      }
      return totalLoss;
    });

    addLog(`${reason} | $${trade.symbol} Net Loss: -$${lossVal.toFixed(2)}`);
  };

  const manualCloseTrade = (tradeId) => {
    setActiveTrades((prevTrades) => {
      const trade = prevTrades.find((t) => t.id === tradeId);
      if (trade) {
        const returnAmount = Math.max(0, trade.positionSizeUSD + trade.pnlUSD);
        setBalanceUSD((prev) => parseFloat((prev + returnAmount).toFixed(2)));
        addLog(`[MANUAL SELL 🚨] $${trade.symbol} Closed @ Net: $${trade.netProfitUSD.toFixed(2)}`);
      }
      return prevTrades.filter((t) => t.id !== tradeId);
    });
  };

  const addLog = (msg) => setLogs((prev) => [msg, ...prev.slice(0, 14)]);
  const addWhaleLog = (msg) => setWhaleLogs((prev) => [msg, ...prev.slice(0, 5)]);
  const addSmartMoneyLog = (msg) => setSmartMoneyLogs((prev) => [msg, ...prev.slice(0, 5)]);

  // MAIN RUNNER
  useEffect(() => {
    let timer;
    if (isRunning && !isPausedDrawdown) {
      scanMarket();
      timer = setInterval(() => scanMarket(), 3500);
    }
    return () => clearInterval(timer);
  }, [isRunning, isPausedDrawdown, tradeMode, riskPercent, compoundRate]);

  // CALCULATE TOTAL EQUITY
  const openPositionsValue = activeTrades.reduce((acc, t) => acc + t.positionSizeUSD + t.pnlUSD, 0);
  const totalEquity = balanceUSD + openPositionsValue;
  const netProfitTotal = totalEquity - initialCapital;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 font-mono">
      {/* Header */}
      <div className="max-w-6xl mx-auto flex justify-between items-center bg-slate-900 border border-slate-800 p-4 rounded-xl mb-4">
        <div>
          <h1 className="text-xl font-bold text-emerald-400">SOLANA HUNTER AI</h1>
          <p className="text-xs text-slate-400">Pump.fun • Raydium • Meteora • Jupiter • DexScreener • Birdeye</p>
        </div>
        <div className="flex gap-2">
          {isPausedDrawdown && (
            <button
              onClick={() => {
                setIsPausedDrawdown(false);
                setDailyLossCurrent(0);
                addLog('[SYSTEM] Circuit Breaker Reset manually.');
              }}
              className="bg-amber-600 hover:bg-amber-700 px-3 py-2 rounded-lg font-bold text-xs"
            >
              RESET LOSS LIMIT
            </button>
          )}
          <button
            onClick={() => {
              const nextState = !isRunning;
              setIsRunning(nextState);
              addLog(nextState ? '[SYSTEM] Engine Hunting Started...' : '[SYSTEM] Engine Stopped.');
            }}
            className={`px-5 py-2.5 rounded-lg font-bold text-sm transition ${
              isRunning ? 'bg-rose-600 hover:bg-rose-700' : 'bg-emerald-600 hover:bg-emerald-700'
            }`}
          >
            {isRunning ? '⏹ STOP BOT' : '▶ START HUNTING'}
          </button>
        </div>
      </div>

      {/* Stats Summary & Compound Engine */}
      <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
        <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl">
          <p className="text-[10px] text-slate-400">BALANCE / EQUITY</p>
          <p className="text-base font-bold text-amber-400">${balanceUSD.toFixed(2)}</p>
          <p className="text-[10px] text-slate-400">Eq: ${totalEquity.toFixed(2)}</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl">
          <p className="text-[10px] text-slate-400">NET PROFIT TOTAL</p>
          <p={`text-base font-bold ${netProfitTotal >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {netProfitTotal >= 0 ? '+' : ''}${netProfitTotal.toFixed(2)}
          </p>
          <p className="text-[10px] text-slate-500">After Gas & Slippage</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl">
          <p className="text-[10px] text-slate-400">9. COMPOUND SYSTEM</p>
          <select
            value={compoundRate}
            onChange={(e) => setCompoundRate(Number(e.target.value))}
            className="w-full mt-1 bg-slate-950 border border-slate-800 text-xs font-bold text-emerald-400 rounded p-1 focus:outline-none"
          >
            <option value={0}>OFF (0%)</option>
            <option value={0.25}>25% Reinvest</option>
            <option value={0.50}>50% Reinvest</option>
            <option value={0.75}>75% Reinvest</option>
            <option value={1.0}>100% Full Compound</option>
          </select>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl">
          <p className="text-[10px] text-slate-400">DAILY LOSS LIMIT</p>
          <p className="text-xs font-bold text-rose-400">${dailyLossCurrent.toFixed(2)} / ${dailyLossLimit}</p>
          <p className="text-[10px] text-slate-500">{isPausedDrawdown ? '🚨 PAUSED' : 'OK'}</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl">
          <p className="text-[10px] text-slate-400">MODE / STATUS</p>
          <div className="flex gap-1 mt-1">
            <button
              onClick={() => setTradeMode('demo')}
              className={`flex-1 py-0.5 text-[10px] font-bold rounded ${tradeMode === 'demo' ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-400'}`}
            >
              DEMO
            </button>
            <button
              onClick={() => setTradeMode('live')}
              className={`flex-1 py-0.5 text-[10px] font-bold rounded ${tradeMode === 'live' ? 'bg-rose-500 text-slate-950' : 'bg-slate-800 text-slate-400'}`}
            >
              LIVE
            </button>
          </div>
        </div>
      </div>

      {/* Risk Management & Controls */}
      <div className="max-w-6xl mx-auto bg-slate-900 border border-slate-800 p-3.5 rounded-xl mb-4">
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">⚙️ Capital Management & Risk Guard</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div>
            <label className="text-[10px] text-slate-400 block mb-1">Risk / Trade (%):</label>
            <input
              type="number"
              value={riskPercent}
              onChange={(e) => setRiskPercent(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-amber-400 font-bold focus:outline-none"
            />
          </div>
          <div>
            <label className="text-[10px] text-slate-400 block mb-1">Take Profit (%):</label>
            <input
              type="number"
              value={takeProfit}
              onChange={(e) => setTakeProfit(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-emerald-400 font-bold focus:outline-none"
            />
          </div>
          <div>
            <label className="text-[10px] text-slate-400 block mb-1">Stop Loss (%):</label>
            <input
              type="number"
              value={stopLoss}
              onChange={(e) => setStopLoss(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-rose-400 font-bold focus:outline-none"
            />
          </div>
          <div>
            <label className="text-[10px] text-slate-400 block mb-1">Max Positions:</label>
            <input
              type="number"
              value={maxPositions}
              onChange={(e) => setMaxPositions(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-cyan-400 font-bold focus:outline-none"
            />
          </div>
          <div>
            <label className="text-[10px] text-slate-400 block mb-1">Daily Loss Limit ($):</label>
            <input
              type="number"
              value={dailyLossLimit}
              onChange={(e) => setDailyLossLimit(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-rose-500 font-bold focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Main Feed & Active Trade Engine */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* Token Discovery Feed */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <h2 className="text-sm font-bold text-slate-300 mb-2">🎯 Multi-DEX Discovery & AI Score Breakdown</h2>
          <div className="space-y-2">
            {scannedTokens.length === 0 ? (
              <p className="text-xs text-slate-500">Tekan "START HUNTING" untuk memindai pasar...</p>
            ) : (
              scannedTokens.map((item, idx) => (
                <div key={idx} className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <div className="flex justify-between items-center mb-1">
                    <div>
                      <span className="font-bold text-emerald-400 text-sm">${item.symbol}</span>
                      <span className="text-[9px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded ml-2">{item.sourceDEX}</span>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                      item.oppScore >= 90 ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                      item.oppScore >= 80 ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                    }`}>
                      AI Score: {item.oppScore} ({item.category})
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-1 text-[9px] text-slate-400 border-t border-slate-900 pt-1.5 mt-1">
                    <div>SmartMoney: <span className="text-slate-200 font-bold">{item.smartMoneyScore}</span></div>
                    <div>Whale: <span className="text-slate-200 font-bold">{item.whaleScore}</span></div>
                    <div>Momentum: <span className="text-slate-200 font-bold">{item.momentumScore}</span></div>
                    <div>Safety: <span className="text-slate-200 font-bold">{item.safetyScore}</span></div>
                  </div>
                </div>
              ))
           
