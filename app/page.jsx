'use client';
import React, { useState, useEffect } from 'react';

export default function Home() {
  const [isRunning, setIsRunning] = useState(false);
  const [tradeMode, setTradeMode] = useState('demo');
  const [balanceUSD, setBalanceUSD] = useState(10.0);
  
  // Risk & Position Management
  const [riskPercent, setRiskPercent] = useState(20);
  const [takeProfit, setTakeProfit] = useState(50);
  const [stopLoss, setStopLoss] = useState(15);
  const [maxPositions, setMaxPositions] = useState(5); // Batas maksimal posisi aktif
  const [minLiquidity, setMinLiquidity] = useState(5000); // Minimal Liquidity $5k

  const [scannedTokens, setScannedTokens] = useState([]);
  const [activeTrades, setActiveTrades] = useState([]);
  const [whaleLogs, setWhaleLogs] = useState([]);
  const [logs, setLogs] = useState([]);

  // Mock Generator jika API error
  const generateMockToken = () => {
    const mockSymbols = ['PUMP', 'BONK2', 'SOLDOGE', 'MOON', 'CATSOL', 'PEPEARMY', 'WIF2', 'BULL'];
    const randomSymbol = mockSymbols[Math.floor(Math.random() * mockSymbols.length)] + Math.floor(Math.random() * 900 + 100);
    const aiScore = Math.floor(Math.random() * 25) + 75;
    const liquidity = Math.floor(Math.random() * 45000) + 3000;
    const price = parseFloat((Math.random() * 0.005 + 0.0001).toFixed(6));

    return {
      symbol: randomSymbol,
      name: randomSymbol,
      liquidity: liquidity,
      price: price,
      aiScore: aiScore,
      time: new Date().toLocaleTimeString('id-ID'),
      whaleVolume: Math.random() > 0.5 ? Math.floor(Math.random() * 4000) + 1000 : 0
    };
  };

  // 1. Scan Market
  const scanMarket = async () => {
    let newToken = null;

    try {
      const res = await fetch('https://api.dexscreener.com/latest/dex/tokens/solana', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data.pairs && data.pairs.length > 0) {
          const topPair = data.pairs[Math.floor(Math.random() * Math.min(10, data.pairs.length))];
          newToken = {
            symbol: topPair.baseToken.symbol,
            name: topPair.baseToken.name,
            liquidity: parseFloat(topPair.liquidity?.usd || 12000),
            price: parseFloat(topPair.priceUsd) || 0.00025,
            aiScore: Math.floor(Math.random() * 25) + 75,
            time: new Date().toLocaleTimeString('id-ID'),
            whaleVolume: Math.random() > 0.5 ? Math.floor(Math.random() * 5000) + 1000 : 0
          };
        }
      }
    } catch (e) {
      newToken = generateMockToken();
    }

    if (!newToken) newToken = generateMockToken();

    setScannedTokens((prev) => [newToken, ...prev.slice(0, 4)]);
    addLog(`[${newToken.time}] Scanned $${newToken.symbol} | Liq: $${Math.round(newToken.liquidity)} | Score: ${newToken.aiScore}/100`);

    if (newToken.whaleVolume > 0) {
      addWhaleLog(`[WHALE] Buy $${newToken.whaleVolume} di $${newToken.symbol}`);
    }

    // Auto Buy Criteria: Score >= 85 & Liq >= Minimal Filter & Max Position Belum Penuh
    if (newToken.aiScore >= 85 && newToken.liquidity >= minLiquidity && tradeMode === 'demo') {
      executeTrade(newToken);
    }
  };

  // 2. Eksekusi Beli
  const executeTrade = (token) => {
    setActiveTrades((currentTrades) => {
      if (currentTrades.length >= maxPositions) {
        return currentTrades; // Skip jika slot posisi penuh
      }

      setBalanceUSD((prevBalance) => {
        const positionSize = parseFloat((prevBalance * (riskPercent / 100)).toFixed(2));
        if (prevBalance >= positionSize && positionSize > 0.1) {
          const newTrade = {
            ...token,
            id: Date.now() + Math.random(),
            entryPrice: token.price,
            currentPrice: token.price,
            positionSizeUSD: positionSize,
            pnlPercent: 0,
            pnlUSD: 0
          };
          addLog(`[AUTO-BUY] $${token.symbol} | Allocated: $${positionSize} (${riskPercent}%)`);
          
          // Tambah ke list active trades
          setTimeout(() => {
            setActiveTrades((prev) => [newTrade, ...prev]);
          }, 0);

          return parseFloat((prevBalance - positionSize).toFixed(2));
        }
        return prevBalance;
      });

      return currentTrades;
    });
  };

  // 3. Simulated PnL Engine + Auto TP/SL
  useEffect(() => {
    if (!isRunning || activeTrades.length === 0) return;

    const interval = setInterval(() => {
      setActiveTrades((prevTrades) => {
        const updatedTrades = [];

        prevTrades.forEach((trade) => {
          // Simulasi Fluktuasi Harga (-8% sampai +10%)
          const changePercent = (Math.random() * 18 - 8);
          const newPnlPercent = parseFloat((trade.pnlPercent + changePercent).toFixed(2));
          const newPrice = trade.currentPrice * (1 + changePercent / 100);
          const newPnlUSD = parseFloat((trade.positionSizeUSD * (newPnlPercent / 100)).toFixed(2));

          // Cek AUTO TAKE PROFIT
          if (newPnlPercent >= takeProfit) {
            const returnAmount = trade.positionSizeUSD + newPnlUSD;
            setBalanceUSD((prev) => parseFloat((prev + returnAmount).toFixed(2)));
            addLog(`[AUTO-TP 🎯] Sold $${trade.symbol} @ +${newPnlPercent}% (Profit: +$${newPnlUSD.toFixed(2)})`);
            return; // Hapus dari activeTrades (Close Position)
          }

          // Cek AUTO STOP LOSS
          if (newPnlPercent <= -stopLoss) {
            const returnAmount = Math.max(0, trade.positionSizeUSD + newPnlUSD);
            setBalanceUSD((prev) => parseFloat((prev + returnAmount).toFixed(2)));
            addLog(`[AUTO-SL 🛑] Sold $${trade.symbol} @ ${newPnlPercent}% (Loss: -$${Math.abs(newPnlUSD).toFixed(2)})`);
            return; // Hapus dari activeTrades (Close Position)
          }

          // Jika belum TP/SL, simpan perubahan harga
          updatedTrades.push({
            ...trade,
            currentPrice: newPrice,
            pnlPercent: newPnlPercent,
            pnlUSD: newPnlUSD
          });
        });

        return updatedTrades;
      });
    }, 2500); // Update PnL tiap 2.5 detik

    return () => clearInterval(interval);
  }, [isRunning, takeProfit, stopLoss, activeTrades.length]);

  // 4. Emergency Manual Close (Sell Manual)
  const manualCloseTrade = (tradeId) => {
    setActiveTrades((prevTrades) => {
      const tradeToClose = prevTrades.find((t) => t.id === tradeId);
      if (tradeToClose) {
        const returnAmount = Math.max(0, tradeToClose.positionSizeUSD + tradeToClose.pnlUSD);
        setBalanceUSD((prev) => parseFloat((prev + returnAmount).toFixed(2)));
        addLog(`[EMERGENCY SELL 🚨] $${tradeToClose.symbol} Closed @ ${tradeToClose.pnlPercent}%`);
      }
      return prevTrades.filter((t) => t.id !== tradeId);
    });
  };

  const addLog = (msg) => {
    setLogs((prev) => [msg, ...prev.slice(0, 14)]);
  };

  const addWhaleLog = (msg) => {
    setWhaleLogs((prev) => [msg, ...prev.slice(0, 5)]);
  };

  // Main Loop Scanner
  useEffect(() => {
    let timer;
    if (isRunning) {
      scanMarket();
      timer = setInterval(() => {
        scanMarket();
      }, 3500);
    }
    return () => clearInterval(timer);
  }, [isRunning, tradeMode, riskPercent, minLiquidity, maxPositions]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 font-mono">
      {/* Header */}
      <div className="max-w-5xl mx-auto flex justify-between items-center bg-slate-900 border border-slate-800 p-4 rounded-xl mb-4">
        <div>
          <h1 className="text-xl font-bold text-emerald-400">SOLANA HUNTER AI</h1>
          <p className="text-xs text-slate-400">Real-Time DexScreener Engine + Auto TP/SL & Risk Guard</p>
        </div>
        <button
          onClick={() => {
            const nextState = !isRunning;
            setIsRunning(nextState);
            addLog(nextState ? '[SYSTEM] Engine Started...' : '[SYSTEM] Engine Stopped.');
          }}
          className={`px-5 py-2.5 rounded-lg font-bold text-sm transition ${
            isRunning ? 'bg-rose-600 hover:bg-rose-700' : 'bg-emerald-600 hover:bg-emerald-700'
          }`}
        >
          {isRunning ? '⏹ STOP BOT' : '▶ START HUNTING'}
        </button>
      </div>

      {/* Stats */}
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <p className="text-xs text-slate-400 mb-2">MODE TRADING</p>
          <div className="flex gap-2">
            <button
              onClick={() => setTradeMode('demo')}
              className={`flex-1 py-1.5 text-xs font-bold rounded transition ${
                tradeMode === 'demo' ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-400'
              }`}
            >
              DEMO (PAPER)
            </button>
            <button
              onClick={() => setTradeMode('live')}
              className={`flex-1 py-1.5 text-xs font-bold rounded transition ${
                tradeMode === 'live' ? 'bg-rose-500 text-slate-950' : 'bg-slate-800 text-slate-400'
              }`}
            >
              LIVE
            </button>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <p className="text-xs text-slate-400 mb-1">SALDO DEMO (VIRTUAL)</p>
          <p className="text-2xl font-bold text-amber-400">${balanceUSD.toFixed(2)}</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <p className="text-xs text-slate-400 mb-1">POSITIONS OPEN</p>
          <p className="text-2xl font-bold text-emerald-400">{activeTrades.length} / {maxPositions}</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <p className="text-xs text-slate-400 mb-1">ENGINE STATUS</p>
          <span className={`inline-block mt-1 px-2.5 py-1 text-xs font-bold rounded ${isRunning ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-400'}`}>
            {isRunning ? '● RUNNING' : '○ IDLE'}
          </span>
        </div>
      </div>

      {/* Settings Grid */}
      <div className="max-w-5xl mx-auto bg-slate-900 border border-slate-800 p-4 rounded-xl mb-4">
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">⚙️ Risk Management & Filters</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div>
            <label className="text-[10px] text-slate-400 block mb-1">Risk per Trade (%):</label>
            <input
              type="number"
              value={riskPercent}
              onChange={(e) => setRiskPercent(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-xs text-amber-400 font-bold focus:outline-none"
            />
          </div>
          <div>
            <label className="text-[10px] text-slate-400 block mb-1">Take Profit (%):</label>
            <input
              type="number"
              value={takeProfit}
              onChange={(e) => setTakeProfit(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-xs text-emerald-400 font-bold focus:outline-none"
            />
          </div>
          <div>
            <label className="text-[10px] text-slate-400 block mb-1">Stop Loss (%):</label>
            <input
              type="number"
              value={stopLoss}
              onChange={(e) => setStopLoss(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-xs text-rose-400 font-bold focus:outline-none"
            />
          </div>
          <div>
            <label className="text-[10px] text-slate-400 block mb-1">Max Positions:</label>
            <input
              type="number"
              value={maxPositions}
              onChange={(e) => setMaxPositions(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-xs text-cyan-400 font-bold focus:outline-none"
            />
          </div>
          <div>
            <label className="text-[10px] text-slate-400 block mb-1">Min Liquidity ($):</label>
            <input
              type="number"
              value={minLiquidity}
              onChange={(e) => setMinLiquidity(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-xs text-indigo-400 font-bold focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* Scanner Feed */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <h2 className="text-sm font-bold text-slate-300 mb-3">🎯 Live DexScreener Feed</h2>
          <div className="space-y-2">
            {scannedTokens.length === 0 ? (
              <p className="text-xs text-slate-500">Tekan "START HUNTING" untuk memindai token baru...</p>
            ) : (
              scannedTokens.map((item, idx) => (
                <div key={idx} className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex justify-between items-center">
                  <div>
                    <p className="font-bold text-emerald-400 text-sm">${item.symbol}</p>
                    <p className="text-[10px] text-slate-400">Liq: ${Math.round(item.liquidity).toLocaleString()} | Price: ${item.price}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded border border-emerald-500/20">
                      Score: {item.aiScore}/100
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Active Demo Positions with Dynamic PnL */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <h2 className="text-sm font-bold text-amber-400 mb-3">⚡ Active Demo Positions ({activeTrades.length})</h2>
          <div className="space-y-2 max-h-[320px] overflow-y-auto">
            {activeTrades.length === 0 ? (
              <p className="text-xs text-slate-500">Belum ada posisi terbuka. Bot otomatis eksekusi jika AI Score ≥ 85 &amp; lolos filter.</p>
            ) : (
              activeTrades.map((trade) => {
                const isProfit = trade.pnlPercent >= 0;
                return (
                  <div key={trade.id} className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex justify-between items-center">
                    <div>
                      <p className="font-bold text-slate-200 text-sm">${trade.symbol}</p>
                      <p className="text-[10px] text-slate-400">Size: ${trade.positionSizeUSD.toFixed(2)} | Entry: ${trade.entryPrice}</p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className={`text-xs font-bold ${isProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {isProfit ? '+' : ''}{trade.pnlPercent}%
                        </p>
                        <p className={`text-[10px] ${isProfit ? 'text-emerald-500' : 'text-rose-500'}`}>
                          {isProfit ? '+' : ''}${trade.pnlUSD.toFixed(2)}
                        </p>
                      </div>

                      <button
                        onClick={() => manualCloseTrade(trade.id)}
                        className="bg-rose-600/20 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-500/30 text-[10px] font-bold px-2 py-1 rounded transition"
                        title="Emergency Sell"
                      >
                        SELL
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Whale Tracker & Logs */}
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <h2 className="text-sm font-bold text-cyan-400 mb-2">🐋 Whale & Smart Money Tracker</h2>
          <div className="bg-slate-950 p-3 rounded-lg h-36 overflow-y-auto text-[11px] font-mono text-cyan-300 space-y-1">
            {whaleLogs.length === 0 ? <p className="text-slate-600">Menunggu pergerakan whale...</p> : whaleLogs.map((wLog, i) => <p key={i}>{wLog}</p>)}
          </div>
        </div>

        <div className="md:col-span-2 bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <h2 className="text-sm font-bold text-slate-300 mb-2">⚡ System Console Logs</h2>
          <div className="bg-slate-950 p-3 rounded-lg h-36 overflow-y-auto text-[11px] font-mono text-slate-400 space-y-1">
            {logs.length === 0 ? <p className="text-slate-600">Engine offline...</p> : logs.map((log, i) => <p key={i}>{log}</p>)}
          </div>
        </div>
      </div>
    </div>
  );
        }
      
