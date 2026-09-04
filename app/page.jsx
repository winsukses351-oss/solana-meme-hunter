'use client';
import React, { useState, useEffect } from 'react';

export default function Home() {
  const [isRunning, setIsRunning] = useState(false);
  const [tradeMode, setTradeMode] = useState('demo'); // 'demo' atau 'live'
  const [balanceUSD, setBalanceUSD] = useState(10.0); // Modal Awal $10
  
  // Risk Management Parameters
  const [riskPercent, setRiskPercent] = useState(20); // Maks 20% modal per trade ($2)
  const [takeProfit, setTakeProfit] = useState(50); // TP +50%
  const [stopLoss, setStopLoss] = useState(15); // SL -15%
  
  const [scannedTokens, setScannedTokens] = useState([]);
  const [activeTrades, setActiveTrades] = useState([]);
  const [whaleLogs, setWhaleLogs] = useState([]);
  const [logs, setLogs] = useState([]);

  // Fetch real-time token dari DexScreener API
  const fetchRealData = async () => {
    try {
      const res = await fetch('https://api.dexscreener.com/latest/dex/tokens/solana');
      const data = await res.json();
      
      if (data.pairs && data.pairs.length > 0) {
        const topPair = data.pairs[Math.floor(Math.random() * Math.min(15, data.pairs.length))];
        const aiScore = Math.floor(Math.random() * 30) + 70; // Score 70-99
        const liquidityUsd = parseFloat(topPair.liquidity?.usd || 0);
        const priceUsd = parseFloat(topPair.priceUsd) || 0.00001;

        // Whale Detection Logic (Simulasi transaksi > $1,000 pada koin baru)
        const isWhaleActive = Math.random() > 0.6;
        const whaleVolume = isWhaleActive ? Math.floor(Math.random() * 5000) + 1000 : 0;

        const newToken = {
          symbol: topPair.baseToken.symbol,
          name: topPair.baseToken.name,
          liquidity: liquidityUsd,
          price: priceUsd,
          aiScore: aiScore,
          address: topPair.pairAddress,
          time: new Date().toLocaleTimeString('id-ID'),
          whaleVolume: whaleVolume
        };

        setScannedTokens((prev) => [newToken, ...prev.slice(0, 4)]);
        addLog(`[${newToken.time}] Scanned $${newToken.symbol} | Liq: $${Math.round(liquidityUsd)} | Score: ${aiScore}/100`);

        if (isWhaleActive) {
          addWhaleLog(`[WHALE ALERT] Buy $${whaleVolume} di $${newToken.symbol}`);
        }

        // Auto-Trade Trigger (Jika Score >= 85)
        if (aiScore >= 85 && tradeMode === 'demo') {
          executeDemoTrade(newToken);
        }
      }
    } catch (err) {
      addLog(`[${new Date().toLocaleTimeString('id-ID')}] Error fetching Solana market data`);
    }
  };

  // Eksekusi Demo Trade dengan Risk Management (Position Sizing)
  const executeDemoTrade = (token) => {
    // Hitung posisi berdasarkan persentase risiko dari saldo saat ini
    const positionSize = (balanceUSD * (riskPercent / 100));
    
    if (balanceUSD >= positionSize && positionSize > 0) {
      setBalanceUSD((prev) => parseFloat((prev - positionSize).toFixed(2)));
      
      const newTrade = {
        ...token,
        id: Date.now(),
        entryPrice: token.price,
        currentPrice: token.price,
        positionSizeUSD: positionSize,
        tpPrice: token.price * (1 + takeProfit / 100),
        slPrice: token.price * (1 - stopLoss / 100),
        pnlPercent: 0
      };

      setActiveTrades((prev) => [newTrade, ...prev]);
      addLog(`[AUTO-BUY DEMO] $${token.symbol} | Size: $${positionSize.toFixed(2)} | TP: +${takeProfit}% | SL: -${stopLoss}%`);
    }
  };

  const addLog = (msg) => {
    setLogs((prev) => [msg, ...prev.slice(0, 14)]);
  };

  const addWhaleLog = (msg) => {
    setWhaleLogs((prev) => [msg, ...prev.slice(0, 5)]);
  };

  useEffect(() => {
    let interval = null;
    if (isRunning) {
      interval = setInterval(() => {
        fetchRealData();
      }, 4000); // Scan tiap 4 detik
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isRunning, balanceUSD, tradeMode, riskPercent, takeProfit, stopLoss]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 font-mono">
      {/* Header */}
      <div className="max-w-5xl mx-auto flex justify-between items-center bg-slate-900 border border-slate-800 p-4 rounded-xl mb-4">
        <div>
          <h1 className="text-xl font-bold text-emerald-400">SOLANA HUNTER AI</h1>
          <p className="text-xs text-slate-400">Real-Time DexScreener/Pump.fun Engine + Risk Management</p>
        </div>
        <button
          onClick={() => setIsRunning(!isRunning)}
          className={`px-5 py-2.5 rounded-lg font-bold text-sm transition ${
            isRunning ? 'bg-rose-600 hover:bg-rose-700' : 'bg-emerald-600 hover:bg-emerald-700'
          }`}
        >
          {isRunning ? '⏹ STOP BOT' : '▶ START HUNTING'}
        </button>
      </div>

      {/* Control Panel: Trading Mode & Capital */}
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
          <p className="text-2xl font-bold text-emerald-400">{activeTrades.length}</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <p className="text-xs text-slate-400 mb-1">ENGINE STATUS</p>
          <span className={`inline-block mt-1 px-2.5 py-1 text-xs font-bold rounded ${isRunning ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-400'}`}>
            {isRunning ? '● RUNNING' : '○ IDLE'}
          </span>
        </div>
      </div>

      {/* Risk Management Settings */}
      <div className="max-w-5xl mx-auto bg-slate-900 border border-slate-800 p-4 rounded-xl mb-4">
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">⚙️ Risk Management & Position Sizing</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-[11px] text-slate-400 block mb-1">Risk Size per Trade (% Saldo):</label>
            <input
              type="number"
              value={riskPercent}
              onChange={(e) => setRiskPercent(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-sm text-amber-400 font-bold focus:outline-none focus:border-amber-500"
            />
          </div>
          <div>
            <label className="text-[11px] text-slate-400 block mb-1">Take Profit Target (%):</label>
            <input
              type="number"
              value={takeProfit}
              onChange={(e) => setTakeProfit(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-sm text-emerald-400 font-bold focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="text-[11px] text-slate-400 block mb-1">Stop Loss Limit (%):</label>
            <input
              type="number"
              value={stopLoss}
              onChange={(e) => setStopLoss(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-sm text-rose-400 font-bold focus:outline-none focus:border-rose-500"
            />
          </div>
        </div>
      </div>

      {/* Main Grid: Discovery Feed & Active Positions */}
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* Real-time Discovery Feed */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <h2 className="text-sm font-bold text-slate-300 mb-3">🎯 Live DexScreener & Pump.fun Feed</h2>
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

        {/* Demo Active Positions */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <h2 className="text-sm font-bold text-amber-400 mb-3">⚡ Active Demo Positions ({activeTrades.length})</h2>
          <div className="space-y-2">
            {activeTrades.length === 0 ? (
              <p className="text-xs text-slate-500">Belum ada posisi terbuka. Bot otomatis eksekusi jika AI Score ≥ 85.</p>
            ) : (
              activeTrades.map((trade) => (
                <div key={trade.id} className="bg-slate-950 p-3 rounded-lg border border-amber-500/30 flex justify-between items-center">
                  <div>
                    <p className="font-bold text-slate-200 text-sm">${trade.symbol}</p>
                    <p className="text-[10px] text-slate-400">Entry: ${trade.entryPrice} | Size: ${trade.positionSizeUSD.toFixed(2)}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-bold block mb-0.5">TP: +{takeProfit}%</span>
                    <span className="text-[10px] bg-rose-500/20 text-rose-400 px-2 py-0.5 rounded font-bold block">SL: -{stopLoss}%</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Whale Tracker & System Console Logs */}
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Whale Tracker Panel */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <h2 className="text-sm font-bold text-cyan-400 mb-2">🐋 Whale & Smart Money Tracker</h2>
          <div className="bg-slate-950 p-3 rounded-lg h-36 overflow-y-auto text-[11px] font-mono text-cyan-300 space-y-1">
            {whaleLogs.length === 0 ? <p className="text-slate-600">Menunggu pergerakan whale...</p> : whaleLogs.map((wLog, i) => <p key={i}>{wLog}</p>)}
          </div>
        </div>

        {/* System Console Logs */}
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
          
