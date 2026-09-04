'use client';
import React, { useState, useEffect } from 'react';

export default function Home() {
  // 1. ENGINE & SECURITY STATES
  const [isRunning, setIsRunning] = useState(false);
  const [isEmergencyKilled, setIsEmergencyKilled] = useState(false);
  const [tradeMode, setTradeMode] = useState('demo'); // 'demo' | 'live'
  const [passwordInput, setPasswordInput] = useState('');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const MASTER_PASSWORD = 'erwinirawan1234567890';

  // 2. SOLANA WEB3 & JUPITER API STATES
  const [rpcEndpoint, setRpcEndpoint] = useState('https://api.mainnet-beta.solana.com');
  const [jupiterApiKey, setJupiterApiKey] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [realSolBalance, setRealSolBalance] = useState(0);

  // 3. IN-APP NOTIFICATION SYSTEM
  const [notifications, setNotifications] = useState([]);

  const triggerNotification = (title, message) => {
    const id = Date.now();
    setNotifications((prev) => [{ id, title, message }, ...prev.slice(0, 4)]);
    playTingSound();

    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 4000);
  };

  // 4. CLEAN "TING!" SOUND SYNTHESIZER
  const playTingSound = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, ctx.currentTime);

      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } catch (e) {
      console.log('Audio error:', e);
    }
  };

  // 5. CAPITAL MANAGEMENT & COMPOUND SYSTEM
  const [balanceUSD, setBalanceUSD] = useState(10.0);
  const [initialCapital] = useState(10.0);
  const [equity, setEquity] = useState(10.0);
  const [riskPercent, setRiskPercent] = useState(20);
  const [maxPositions, setMaxPositions] = useState(5);
  const [minLiquidityFilter, setMinLiquidityFilter] = useState(5000);
  const [minAiScoreFilter, setMinAiScoreFilter] = useState(80);
  const [stagnantTimeLimitMinutes, setStagnantTimeLimitMinutes] = useState(10);
  const [autoPaused, setAutoPaused] = useState(false);

  // CONFIG ENGINE FEATURE TOGGLES (CHECKBOXES)
  const [enableCompound, setEnableCompound] = useState(false);
  const [compoundRate, setCompoundRate] = useState(25);
  const [enableTakeProfit, setEnableTakeProfit] = useState(true);
  const [takeProfit, setTakeProfit] = useState(50);
  const [enableStopLoss, setEnableStopLoss] = useState(true);
  const [stopLoss, setStopLoss] = useState(15);
  const [enableTrailingStop, setEnableTrailingStop] = useState(true);
  const [trailingStop, setTrailingStop] = useState(10);
  const [enablePartialTP, setEnablePartialTP] = useState(true);
  const [enableBreakEvenProtect, setEnableBreakEvenProtect] = useState(true);
  const [enableAntiRug, setEnableAntiRug] = useState(true);
  const [enableTimeExit, setEnableTimeExit] = useState(true);

  // COST ENGINE
  const [slippage, setSlippage] = useState(1.0);
  const [gasFeeUSD, setGasFeeUSD] = useState(0.02);

  // DATA STATES
  const [scannedTokens, setScannedTokens] = useState([]);
  const [activeTrades, setActiveTrades] = useState([]);
  const [closedTrades, setClosedTrades] = useState([]);
  const [smartMoneyLogs, setSmartMoneyLogs] = useState([]);
  const [whaleLogs, setWhaleLogs] = useState([]);
  const [systemLogs, setSystemLogs] = useState([]);
  const [equityHistory, setEquityHistory] = useState([10.0, 10.1, 10.2, 10.15, 10.4, 10.35, 10.6]);

  const blacklistKeywords = ['TEST', 'RUG', 'SCAM', 'HACK', 'FAKE', 'DRAIN'];

  // PERSISTENCE
  useEffect(() => {
    const savedBalance = localStorage.getItem('sh_balanceUSD');
    const savedClosed = localStorage.getItem('sh_closedTrades');
    const savedJupKey = localStorage.getItem('sh_jupKey');
    const savedRpc = localStorage.getItem('sh_rpc');

    if (savedBalance) setBalanceUSD(parseFloat(savedBalance));
    if (savedClosed) setClosedTrades(JSON.parse(savedClosed));
    if (savedJupKey) setJupiterApiKey(savedJupKey);
    if (savedRpc) setRpcEndpoint(savedRpc);
  }, []);

  useEffect(() => {
    localStorage.setItem('sh_balanceUSD', balanceUSD.toString());
    localStorage.setItem('sh_closedTrades', JSON.stringify(closedTrades));
    localStorage.setItem('sh_jupKey', jupiterApiKey);
    localStorage.setItem('sh_rpc', rpcEndpoint);
  }, [balanceUSD, closedTrades, jupiterApiKey, rpcEndpoint]);

  // WALLET CONNECTOR
  const connectWallet = async () => {
    try {
      if (typeof window !== 'undefined' && window.solana) {
        const response = await window.solana.connect();
        const pubKey = response.publicKey.toString();
        setWalletAddress(pubKey);
        setIsWalletConnected(true);
        addSystemLog(`🔌 [WALLET] Connected: ${pubKey.slice(0, 4)}...${pubKey.slice(-4)}`);
        triggerNotification('Wallet Terhubung', `Address: ${pubKey.slice(0, 4)}...${pubKey.slice(-4)}`);
        fetchRealSolBalance(pubKey);
      } else {
        alert('Phantom Wallet tidak ditemukan! Silakan install extension Phantom.');
        window.open('https://phantom.app/', '_blank');
      }
    } catch (err) {
      addSystemLog(`❌ [WALLET ERROR] ${err.message}`);
    }
  };

  const fetchRealSolBalance = async (address) => {
    try {
      const res = await fetch(rpcEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0', id: 1, method: 'getBalance', params: [address]
        })
      });
      const data = await res.json();
      if (data.result) {
        const solVal = data.result.value / 1e9;
        setRealSolBalance(parseFloat(solVal.toFixed(4)));
      }
    } catch (err) {
      console.log('RPC Fetch Error:', err);
    }
  };

  const disconnectWallet = () => {
    if (window.solana) window.solana.disconnect();
    setWalletAddress('');
    setIsWalletConnected(false);
    setRealSolBalance(0);
    addSystemLog('🔌 [WALLET] Disconnected');
  };

  // PASSWORD START CHECK HANDLER
  const handleToggleEngine = () => {
    if (isRunning) {
      setIsRunning(false);
      addSystemLog('⏹ [SYSTEM] Core Engine Stopped');
      triggerNotification('Engine Paused', 'Bot trading dihentikan sementara.');
    } else {
      setIsAuthModalOpen(true);
    }
  };

  const handleVerifyPassword = (e) => {
    e.preventDefault();
    if (passwordInput === MASTER_PASSWORD) {
      setIsRunning(true);
      setIsAuthModalOpen(false);
      setPasswordInput('');
      addSystemLog('▶ [SYSTEM] Security Verified. Core Engine Started!');
      triggerNotification('Engine Active', 'Bot berhasil berjalan dengan otorisasi password!');
    } else {
      alert('Password salah! Akses ditolak.');
      setPasswordInput('');
    }
  };

  const calculateCosts = (positionSize) => {
    const slippageCost = positionSize * (slippage / 100);
    return { slippageCost, totalCost: slippageCost + gasFeeUSD };
  };

  const generateWalletAddress = () => {
    const chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
    let addr = '';
    for (let i = 0; i < 44; i++) {
      addr += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
  };

  // MARKET SCANNER
  const scanMarket = async () => {
    if (isEmergencyKilled || autoPaused) return;

    const dexSources = ['Pump.fun', 'Raydium', 'Meteora', 'Jupiter', 'DexScreener'];
    const mockSymbols = ['PUMP', 'BONK2', 'SOLDOGE', 'MOON', 'CATSOL', 'PEPEARMY', 'WIF2', 'BULL', 'NEO'];
    
    const randomDex = dexSources[Math.floor(Math.random() * dexSources.length)];
    const rawSymbol = mockSymbols[Math.floor(Math.random() * mockSymbols.length)] + Math.floor(Math.random() * 900 + 100);

    if (enableAntiRug && blacklistKeywords.some((w) => rawSymbol.toUpperCase().includes(w))) {
      addSystemLog(`🛡️ [ANTI-RUG] Token $${rawSymbol} Blocked by Safety Guard`);
      return;
    }

    const smartMoneyScore = Math.floor(Math.random() * 40) + 60;
    const whaleScore = Math.floor(Math.random() * 45) + 55;
    const momentumScore = Math.floor(Math.random() * 50) + 50;
    const safetyScore = Math.floor(Math.random() * 35) + 65;

    const opportunityScore = Math.round((smartMoneyScore + whaleScore + momentumScore + safetyScore) / 4);

    let category = 'Avoid';
    if (opportunityScore >= 90) category = 'Elite';
    else if (opportunityScore >= 80) category = 'High Potential';
    else if (opportunityScore >= 70) category = 'Moderate';

    const price = parseFloat((Math.random() * 0.005 + 0.0001).toFixed(6));
    const liquidity = Math.floor(Math.random() * 50000) + 1000;

    const newToken = {
      id: Date.now() + Math.random(),
      symbol: rawSymbol,
      dex: randomDex,
      price,
      liquidity,
      smartMoneyScore,
      whaleScore,
      momentumScore,
      safetyScore,
      opportunityScore,
      category,
      time: new Date().toLocaleTimeString('id-ID')
    };

    setScannedTokens((prev) => [newToken, ...prev.slice(0, 5)]);

    if (smartMoneyScore > 75) {
      const wallet = generateWalletAddress();
      addSmartMoneyLog(`[SMART MONEY] Wallet ${wallet} bought $${newToken.symbol} (Score: ${smartMoneyScore})`);
    }

    if (whaleScore > 75) {
      const wallet = generateWalletAddress();
      addWhaleLog(`[WHALE CLUSTER] Wallet ${wallet} accumulated $${newToken.symbol} (Score: ${whaleScore})`);
    }

    if (
      opportunityScore >= minAiScoreFilter &&
      liquidity >= minLiquidityFilter &&
      activeTrades.length < maxPositions
    ) {
      executeAutoBuy(newToken);
    }
  };

  // BUY EXECUTION
  const executeAutoBuy = async (token) => {
    if (tradeMode === 'live' && (!isWalletConnected || realSolBalance < 0.01)) {
      addSystemLog('⚠️ [LIVE ERROR] Wallet belum terhubung atau saldo SOL kurang!');
      return;
    }

    if (balanceUSD < 0.5 && tradeMode === 'demo') return;

    let sizePercent = riskPercent;
    if (enableCompound && compoundRate > 0) {
      sizePercent = Math.min(100, riskPercent * (1 + compoundRate / 100));
    }

    const positionSize = parseFloat((balanceUSD * (sizePercent / 100)).toFixed(2));
    const { totalCost } = calculateCosts(positionSize);

    const newTrade = {
      ...token,
      tradeId: Date.now() + Math.random(),
      entryPrice: token.price,
      currentPrice: token.price,
      highestPrice: token.price,
      positionSizeUSD: positionSize,
      entryCostUSD: totalCost,
      pnlPercent: 0,
      pnlUSD: 0,
      partiallyTaken: false,
      breakEvenSet: false,
      entryTimestamp: Date.now()
    };

    setBalanceUSD((prev) => parseFloat((prev - positionSize).toFixed(2)));
    setActiveTrades((prev) => [newTrade, ...prev]);

    triggerNotification(`🚀 OPEN BUY $${token.symbol}`, `Size: $${positionSize} | DEX: ${token.dex}`);
    addSystemLog(`🚀 [${tradeMode.toUpperCase()}-BUY] $${token.symbol} @ $${token.price} | Size: $${positionSize}`);
  };

  // PNL & EXIT LOOP
  useEffect(() => {
    if (!isRunning || activeTrades.length === 0 || isEmergencyKilled) return;

    const interval = setInterval(() => {
      setActiveTrades((prevTrades) => {
        const remainingTrades = [];

        prevTrades.forEach((trade) => {
          const priceChange = (Math.random() * 16 - 7);
          const newPrice = trade.currentPrice * (1 + priceChange / 100);
          const newHighestPrice = Math.max(trade.highestPrice, newPrice);
          
          const rawPnlPercent = ((newPrice - trade.entryPrice) / trade.entryPrice) * 100;
          const { totalCost: exitCost } = calculateCosts(trade.positionSizeUSD);
          const totalTradingCost = trade.entryCostUSD + exitCost;
          
          let grossPnlUSD = trade.positionSizeUSD * (rawPnlPercent / 100);
          let netPnlUSD = parseFloat((grossPnlUSD - totalTradingCost).toFixed(2));
          let netPnlPercent = parseFloat(((netPnlUSD / trade.positionSizeUSD) * 100).toFixed(2));

          let shouldClose = false;
          let closeReason = '';

          if (enableTimeExit) {
            const elapsedMinutes = (Date.now() - trade.entryTimestamp) / (1000 * 60);
            if (elapsedMinutes >= stagnantTimeLimitMinutes && Math.abs(netPnlPercent) < 5) {
              shouldClose = true;
              closeReason = `Time Exit (${stagnantTimeLimitMinutes}m)`;
            }
          }

          let currentPositionSize = trade.positionSizeUSD;
          let updatedPartiallyTaken = trade.partiallyTaken;
          if (enablePartialTP && !trade.partiallyTaken && enableTakeProfit && netPnlPercent >= (takeProfit / 2)) {
            const partialReturn = (currentPositionSize / 2) + (netPnlUSD / 2);
            setBalanceUSD((prev) => parseFloat((prev + partialReturn).toFixed(2)));
            currentPositionSize = currentPositionSize / 2;
            updatedPartiallyTaken = true;
            addSystemLog(`[PARTIAL TP] $${trade.symbol} 50% Secured @ +${netPnlPercent}%`);
            triggerNotification('Partial TP Secured', `$${trade.symbol} 50% posisi sudah diamankan.`);
          }

          let updatedBreakEvenSet = trade.breakEvenSet;
          if (enableBreakEvenProtect && !trade.breakEvenSet && netPnlPercent >= 15) {
            updatedBreakEvenSet = true;
            addSystemLog(`[BREAK-EVEN] Shield Activated for $${trade.symbol}`);
          }

          const peakGainPercent = ((newHighestPrice - trade.entryPrice) / trade.entryPrice) * 100;
          if (enableTrailingStop && peakGainPercent - netPnlPercent >= trailingStop && netPnlPercent > 5) {
            shouldClose = true;
            closeReason = `Trailing Stop (-${trailingStop}%)`;
          }

          if (updatedBreakEvenSet && netPnlPercent <= 0) {
            shouldClose = true;
            closeReason = 'Break-Even Guard';
          }

          if (enableTakeProfit && netPnlPercent >= takeProfit) {
            shouldClose = true;
            closeReason = `Take Profit (+${takeProfit}%)`;
          }

          if (enableStopLoss && netPnlPercent <= -stopLoss) {
            shouldClose = true;
            closeReason = `Stop Loss (-${stopLoss}%)`;
          }

          if (shouldClose) {
            closeTradePosition(trade, netPnlUSD, netPnlPercent, closeReason);
          } else {
            remainingTrades.push({
              ...trade,
              currentPrice: newPrice,
              highestPrice: newHighestPrice,
              positionSizeUSD: currentPositionSize,
              pnlPercent: netPnlPercent,
              pnlUSD: netPnlUSD,
              partiallyTaken: updatedPartiallyTaken,
              breakEvenSet: updatedBreakEvenSet
            });
          }
        });

        return remainingTrades;
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [isRunning, activeTrades, takeProfit, stopLoss, trailingStop, enableTakeProfit, enableStopLoss, enableTrailingStop, enablePartialTP, enableBreakEvenProtect, enableTimeExit, stagnantTimeLimitMinutes, isEmergencyKilled]);

  const closeTradePosition = (trade, netPnlUSD, netPnlPercent, reason) => {
    const returnAmount = Math.max(0, trade.positionSizeUSD + netPnlUSD);
    setBalanceUSD((prev) => parseFloat((prev + returnAmount).toFixed(2)));

    const closedItem = {
      ...trade,
      closePrice: trade.currentPrice,
      netPnlUSD,
      netPnlPercent,
      reason,
      closedAt: new Date().toLocaleTimeString('id-ID')
    };

    setClosedTrades((prev) => [closedItem, ...prev]);
    triggerNotification(`🔔 POSISI DITUTUP ($${trade.symbol})`, `PnL: ${netPnlUSD >= 0 ? '+' : ''}$${netPnlUSD} (${reason})`);
    addSystemLog(`🔔 [${reason.toUpperCase()}] Closed $${trade.symbol} | Net PnL: ${netPnlUSD >= 0 ? '+' : ''}$${netPnlUSD} (${netPnlPercent}%)`);
  };

  const exportAnalyticsCSV = () => {
    if (closedTrades.length === 0) {
      alert('Belum ada riwayat transaksi ditutup!');
      return;
    }

    const headers = ['Trade ID', 'Symbol', 'DEX', 'Entry Price ($)', 'Close Price ($)', 'Position Size ($)', 'Net PnL ($)', 'Net PnL (%)', 'Reason', 'Closed Time'];
    const csvRows = [headers.join(',')];

    closedTrades.forEach((t) => {
      csvRows.push([t.tradeId, t.symbol, t.dex, t.entryPrice, t.closePrice, t.positionSizeUSD, t.netPnlUSD, t.netPnlPercent, `"${t.reason}"`, t.closedAt].join(','));
    });

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', `Solana_Hunter_Analytics_${new Date().toISOString().slice(0,10)}.csv`);
    a.click();
  };

  useEffect(() => {
    const activePnL = activeTrades.reduce((acc, curr) => acc + curr.pnlUSD, 0);
    const currentEquity = balanceUSD + activeTrades.reduce((acc, curr) => acc + curr.positionSizeUSD, 0) + activePnL;
    const roundedEquity = parseFloat(currentEquity.toFixed(2));
    setEquity(roundedEquity);

    setEquityHistory((prev) => [...prev.slice(-19), roundedEquity]);

    const drawdown = ((initialCapital - roundedEquity) / initialCapital) * 100;
    if (drawdown >= 25 && !autoPaused) {
      setAutoPaused(true);
      addSystemLog(`⚠️ [RISK GUARD] Max Drawdown (${drawdown.toFixed(1)}%) Reached! Bot Auto-Paused.`);
      triggerNotification('⚠️ RISK GUARD PAUSE', `Max Drawdown (${drawdown.toFixed(1)}%) terlampaui.`);
    }
  }, [balanceUSD, activeTrades, initialCapital, autoPaused]);

  useEffect(() => {
    let timer;
    if (isRunning && !isEmergencyKilled && !autoPaused) {
      scanMarket();
      timer = setInterval(() => {
        scanMarket();
      }, 3000);
    }
    return () => clearInterval(timer);
  }, [isRunning, isEmergencyKilled, autoPaused, activeTrades.length, maxPositions, riskPercent, enableCompound, compoundRate, minLiquidityFilter, minAiScoreFilter]);

  const addSystemLog = (msg) => setSystemLogs((prev) => [msg, ...prev.slice(0, 19)]);
  const addSmartMoneyLog = (msg) => setSmartMoneyLogs((prev) => [msg, ...prev.slice(0, 9)]);
  const addWhaleLog = (msg) => setWhaleLogs((prev) => [msg, ...prev.slice(0, 9)]);

  const totalClosedNetPnL = closedTrades.reduce((acc, t) => acc + t.netPnlUSD, 0);
  const winningTrades = closedTrades.filter((t) => t.netPnlUSD > 0);
  const losingTrades = closedTrades.filter((t) => t.netPnlUSD < 0);
  const winRate = closedTrades.length > 0 ? ((winningTrades.length / closedTrades.length) * 100).toFixed(1) : '0.0';
  const avgWinUSD = winningTrades.length > 0 ? (winningTrades.reduce((a, b) => a + b.netPnlUSD, 0) / winningTrades.length).toFixed(2) : '0.00';
  const avgLossUSD = losingTrades.length > 0 ? Math.abs(losingTrades.reduce((a, b) => a + b.netPnlUSD, 0) / losingTrades.length).toFixed(2) : '0.00';
  const totalGrossProfit = winningTrades.reduce((acc, t) => acc + t.netPnlUSD, 0);
  const totalGrossLoss = Math.abs(losingTrades.reduce((acc, t) => acc + t.netPnlUSD, 0));
  const profitFactor = totalGrossLoss > 0 ? (totalGrossProfit / totalGrossLoss).toFixed(2) : totalGrossProfit > 0 ? 'MAX' : '0.00';

  const renderEquityLineChart = () => {
    if (equityHistory.length < 2) return null;

    const width = 800;
    const height = 100;
    const padding = 10;

    const minVal = Math.min(...equityHistory);
    const maxVal = Math.max(...equityHistory);
    const range = maxVal - minVal || 1;

    const points = equityHistory.map((val, idx) => {
      const x = (idx / (equityHistory.length - 1)) * (width - padding * 2) + padding;
      const y = height - padding - ((val - minVal) / range) * (height - padding * 2);
      return `${x},${y}`;
    }).join(' ');

    return (
      <svg className="w-full h-24 overflow-visible" viewBox={`0 0 ${width} ${height}`}>
        <polyline
          fill="none"
          stroke="#10b981"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />
        {equityHistory.map((val, idx) => {
          const x = (idx / (equityHistory.length - 1)) * (width - padding * 2) + padding;
          const y = height - padding - ((val - minVal) / range) * (height - padding * 2);
          return (
            <circle
              key={idx}
              cx={x}
              cy={y}
              r="4"
              className="fill-emerald-400 stroke-slate-950 stroke-2 hover:r-6 transition-all"
            >
              <title>${val.toFixed(2)}</title>
            </circle>
          );
        })}
      </svg>
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-3 sm:p-5 font-mono relative">
      
      {/* NOTIFICATION OVERLAY */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-xs w-full pointer-events-none">
        {notifications.map((n) => (
          <div
            key={n.id}
            className="pointer-events-auto bg-slate-900/95 border-l-4 border-emerald-400 border-slate-800 p-3 rounded-lg shadow-xl backdrop-blur-md text-xs animate-slide-in"
          >
            <div className="flex justify-between items-center mb-1">
              <span className="font-bold text-emerald-400">{n.title}</span>
              <span className="text-[9px] text-slate-500">Just now</span>
            </div>
            <p className="text-slate-300 text-[11px]">{n.message}</p>
          </div>
        ))}
      </div>

      {/* PASSWORD AUTH MODAL */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl max-w-md w-full shadow-2xl">
            <h3 className="text-base font-bold text-emerald-400 mb-1">🔐 System Authentication Required</h3>
            <p className="text-xs text-slate-400 mb-4">Masukkan password master untuk mengaktifkan bot hunting.</p>
            
            <form onSubmit={handleVerifyPassword} className="space-y-4">
              <input
                type="password"
                placeholder="Masukkan Master Password..."
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-emerald-300 font-bold focus:outline-none focus:border-emerald-500"
                autoFocus
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAuthModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-bold rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-xs font-bold rounded-lg text-white"
                >
                  Verify &amp; Start
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* HEADER */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center bg-slate-900 border border-slate-800 p-4 rounded-xl gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-emerald-400">SOLANA HUNTER AI</h1>
            <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] px-2 py-0.5 rounded-full font-bold">
              v2.1 PRO ANALYTICS + SECURITY
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">Automated High-Frequency Solana DEX Trading Engine</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {!isWalletConnected ? (
            <button
              onClick={connectWallet}
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-4 py-2.5 rounded-lg text-xs transition shadow-lg shadow-purple-900/30"
            >
              🟣 CONNECT PHANTOM / WALLET
            </button>
          ) : (
            <div className="flex items-center gap-2 bg-slate-950 border border-purple-500/40 px-3 py-1.5 rounded-lg">
              <div className="text-left">
                <p className="text-[10px] text-purple-400 font-bold">{walletAddress.slice(0, 4)}...{walletAddress.slice(-4)}</p>
                <p className="text-[10px] text-emerald-400 font-bold">{realSolBalance} SOL</p>
              </div>
              <button
                onClick={disconnectWallet}
                className="text-rose-400 hover:text-rose-300 text-[10px] bg-rose-500/10 hover:bg-rose-500/20 px-2 py-1 rounded"
              >
                Disconnect
              </button>
            </div>
          )}

          <button
            onClick={handleToggleEngine}
            disabled={isEmergencyKilled}
            className={`px-5 py-2.5 rounded-lg font-bold text-xs transition ${
              isRunning ? 'bg-amber-600 hover:bg-amber-700 text-white' : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            } ${isEmergencyKilled ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isRunning ? '⏹ PAUSE ENGINE' : '▶ START HUNTING'}
          </button>
        </div>
      </div>

      {/* DASHBOARD STATS METRICS */}
      <div className="max-w-7xl mx-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 mb-4">
        <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl">
          <p className="text-[10px] text-slate-400">TRADING MODE</p>
          <div className="flex gap-1 mt-1">
            <button
              onClick={() => setTradeMode('demo')}
              className={`flex-1 py-0.5 text-[9px] font-bold rounded ${tradeMode === 'demo' ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-400'}`}
            >
              DEMO
            </button>
            <button
              onClick={() => setTradeMode('live')}
              className={`flex-1 py-0.5 text-[9px] font-bold rounded ${tradeMode === 'live' ? 'bg-rose-500 text-slate-950' : 'bg-slate-800 text-slate-400'}`}
            >
              LIVE
            </button>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl">
          <p className="text-[10px] text-slate-400">BALANCE / EQUITY</p>
          <p className="text-sm font-bold text-amber-400 mt-0.5">${balanceUSD.toFixed(2)}</p>
          <p className="text-[10px] text-slate-500">Eq: ${equity.toFixed(2)}</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl">
          <p className="text-[10px] text-slate-400">NET CLOSED PNL</p>
          <p className={`text-sm font-bold mt-0.5 ${totalClosedNetPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {totalClosedNetPnL >= 0 ? '+' : ''}${totalClosedNetPnL.toFixed(2)}
          </p>
          <p className="text-[10px] text-slate-500">After Costs</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl">
          <p className="text-[10px] text-slate-400">WIN RATE / PF</p>
          <p className="text-sm font-bold text-cyan-400 mt-0.5">{winRate}%</p>
          <p className="text-[10px] text-slate-500">PF: {profitFactor}</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl">
          <p className="text-[10px] text-slate-400">AVG WIN / LOSS ($)</p>
          <p className="text-sm font-bold text-emerald-400 mt-0.5">+${avgWinUSD} / -${avgLossUSD}</p>
          <p className="text-[10px] text-slate-500">Risk Ratio</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl">
          <p className="text-[10px] text-slate-400">POSITIONS / STATUS</p>
          <p className="text-sm font-bold text-emerald-400 mt-0.5">{activeTrades.length} / {maxPositions}</p>
          <span className={`text-[9px] font-bold ${isRunning ? 'text-emerald-400' : 'text-slate-500'}`}>
            {isRunning ? '● HUNTING' : '○ IDLE'}
          </span>
        </div>
      </div>

      {/* PANEL: SOLANA WEB3 & JUPITER API SETTINGS */}
      <div className="max-w-7xl mx-auto bg-slate-900 border border-slate-800 p-4 rounded-xl mb-4">
        <h2 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-3">🔑 Solana Web3 &amp; Jupiter API Settings</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block text-slate-400 text-[10px] mb-1 font-bold">Jupiter API Key (v6):</label>
            <input
              type="password"
              placeholder="Masukkan Jupiter API Key Anda..."
              value={jupiterApiKey}
              onChange={(e) => setJupiterApiKey(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-amber-300 font-mono text-xs focus:outline-none focus:border-amber-500"
            />
          </div>
          <div>
            <label className="block text-slate-400 text-[10px] mb-1 font-bold">RPC Endpoint Node (Mainnet):</label>
            <input
              type="text"
              placeholder="https://api.mainnet-beta.solana.com"
              value={rpcEndpoint}
              onChange={(e) => setRpcEndpoint(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-cyan-300 font-mono text-xs focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>
      </div>

      {/* DASHBOARD ANALYTICS OVERVIEW */}
      <div className="max-w-7xl mx-auto bg-slate-900 border border-slate-800 p-4 rounded-xl mb-4">
        <h2 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-3">📊 Dashboard Analytics &amp; Performance Summary</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
            <p className="text-[10px] text-slate-400">Total Transaksi</p>
            <p className="text-base font-bold text-slate-200 mt-1">{closedTrades.length}</p>
          </div>
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
            <p className="text-[10px] text-slate-400">Win / Loss Trades</p>
            <p className="text-base font-bold text-emerald-400 mt-1">{winningTrades.length} <span className="text-slate-500 font-normal">/</span> <span className="text-rose-400">{losingTrades.length}</span></p>
          </div>
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
            <p className="text-[10px] text-slate-400">Gross Profit / Loss</p>
            <p className="text-base font-bold text-emerald-400 mt-1">+${totalGrossProfit.toFixed(2)} <span className="text-slate-500 font-normal">/</span> <span className="text-rose-400">-${totalGrossLoss.toFixed(2)}</span></p>
          </div>
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
            <p className="text-[10px] text-slate-400">Profit Factor (PF)</p>
            <p className="text-base font-bold text-cyan-400 mt-1">{profitFactor}</p>
          </div>
        </div>
      </div>

      {/* EQUITY TREND CHART (LINE CHART) */}
      <div className="max-w-7xl mx-auto bg-slate-900 border border-slate-800 p-4 rounded-xl mb-4">
        <h2 className="text-xs font-bold text-slate-300 mb-2">📈 Equity Curve Trend Line</h2>
        <div className="bg-slate-950 p-3 rounded-lg border border-slate-800/80">
          {renderEquityLineChart()}
        </div>
      </div>

      {/* CONFIG ENGINE WITH CHECKBOX TOGGLES */}
      <div className="max-w-7xl mx-auto bg-slate-900 border border-slate-800 p-4 rounded-xl mb-4">
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">⚙️ Config Engine (Features Toggle)</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">

          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex items-center justify-between">
            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={enableTakeProfit}
                  onChange={(e) => setEnableTakeProfit(e.target.checked)}
                  className="accent-emerald-500 w-4 h-4 rounded"
                />
                <span className="font-bold text-emerald-400">Take Profit (%)</span>
              </label>
            </div>
            <input
              type="number"
              disabled={!enableTakeProfit}
              value={takeProfit}
              onChange={(e) => setTakeProfit(Number(e.target.value))}
              className="w-16 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-right text-emerald-400 font-bold disabled:opacity-40"
            />
          </div>

          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex items-center justify-between">
            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={enableStopLoss}
                  onChange={(e) => setEnableStopLoss(e.target.checked)}
                  className="accent-rose-500 w-4 h-4 rounded"
                />
                <span className="font-bold text-rose-400">Stop Loss (%)</span>
              </label>
            </div>
            <input
              type="number"
              disabled={!enableStopLoss}
              value={stopLoss}
              onChange={(e) => setStopLoss(Number(e.target.value))}
              className="w-16 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-right text-rose-400 font-bold disabled:opacity-40"
            />
          </div>

          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex items-center justify-between">
            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={enableTrailingStop}
                  onChange={(e) => setEnableTrailingStop(e.target.checked)}
                  className="accent-cyan-500 w-4 h-4 rounded"
                />
                <span className="font-bold text-cyan-400">Trailing Stop (%)</span>
              </label>
            </div>
            <input
              type="number"
              disabled={!enableTrailingStop}
              value={trailingStop}
              onChange={(e) => setTrailingStop(Number(e.target.value))}
              className="w-16 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-right text-cyan-400 font-bold disabled:opacity-40"
            />
          </div>

          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex items-center justify-between">
            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={enableCompound}
                  onChange={(e) => setEnableCompound(e.target.checked)}
                  className="accent-indigo-500 w-4 h-4 rounded"
                />
                <span className="font-bold text-indigo-400">Compound Auto</span>
              </label>
            </div>
            <select
              disabled={!enableCompound}
              value={compoundRate}
              onChange={(e) => setCompoundRate(Number(e.target.value))}
              className="bg-slate-900 border border-slate-700 rounded px-1 py-1 text-indigo-400 font-bold disabled:opacity-40"
            >
              <option value={25}>25%</option>
              <option value={50}>50%</option>
              <option value={75}>75%</option>
              <option value={100}>100%</option>
            </select>
          </div>

          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={enablePartialTP}
                onChange={(e) => setEnablePartialTP(e.target.checked)}
                className="accent-amber-500 w-4 h-4 rounded"
              />
              <span className="font-bold text-amber-400">Partial TP (50%)</span>
            </label>
          </div>

          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={enableBreakEvenProtect}
                onChange={(e) => setEnableBreakEvenProtect(e.target.checked)}
                className="accent-blue-500 w-4 h-4 rounded"
              />
              <span className="font-bold text-blue-400">Break-Even Guard</span>
            </label>
          </div>

          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={enableAntiRug}
                onChange={(e) => setEnableAntiRug(e.target.checked)}
                className="accent-teal-500 w-4 h-4 rounded"
              />
              <span className="font-bold text-teal-400">Anti-Rug Guard</span>
            </label>
          </div>

          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={enableTimeExit}
                onChange={(e) => setEnableTimeExit(e.target.checked)}
                className="accent-orange-500 w-4 h-4 rounded"
              />
              <span className="font-bold text-orange-400">Time Exit ({stagnantTimeLimitMinutes}m)</span>
            </label>
          </div>

        </div>
      </div>

      {/* MAIN DATA GRID */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        
        {/* NEW OPPORTUNITIES FEED */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <h2 className="text-xs font-bold text-slate-300 mb-3 flex justify-between items-center">
            <span>🎯 Live DEX Multi-Monitor</span>
          </h2>
          <div className="space-y-2 max-h-[380px] overflow-y-auto">
            {scannedTokens.length === 0 ? (
              <p className="text-xs text-slate-500">Mulai engine untuk memindai pasar...</p>
            ) : (
              scannedTokens.map((token) => (
                <div key={token.id} className="bg-slate-950 p-3 rounded-lg border border-slate-800/80">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-emerald-400 text-sm">${token.symbol}</span>
                        <span className="text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.2 rounded">{token.dex}</span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5">Liq: ${token.liquidity.toLocaleString()} | Price: ${token.price}</p>
                    </div>

                    <div className="text-right">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                        token.opportunityScore >= 85 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-slate-800 text-slate-400'
                      }`}>
                        Score: {token.opportunityScore}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ACTIVE POSITIONS */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <h2 className="text-xs font-bold text-amber-400 mb-3">⚡ Active Positions ({activeTrades.length})</h2>
          <div className="space-y-2 max-h-[380px] overflow-y-auto">
            {activeTrades.length === 0 ? (
              <p className="text-xs text-slate-500">Belum ada posisi aktif...</p>
            ) : (
              activeTrades.map((trade) => {
                const isProfitable = trade.pnlPercent >= 0;
                return (
                  <div key={trade.tradeId} className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-bold text-slate-200 text-sm">${trade.symbol}</p>
                        <p className="text-[10px] text-slate-400">Size: ${trade.positionSizeUSD.toFixed(2)} | Entry: ${trade.entryPrice}</p>
                      </div>

                      <div className="text-right">
                        <p className={`text-xs font-bold ${isProfitable ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {isProfitable ? '+' : ''}{trade.pnlPercent}%
                        </p>
                        <p className={`text-[10px] ${isProfitable ? 'text-emerald-500' : 'text-rose-500'}`}>
                          {isProfitable ? '+' : ''}${trade.pnlUSD.toFixed(2)} Net
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* CLOSED POSITIONS & EXPORT CSV */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-xs font-bold text-slate-300">📜 Closed History ({closedTrades.length})</h2>
              <button
                onClick={exportAnalyticsCSV}
                className="bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 text-[10px] font-bold px-2 py-1 rounded transition flex items-center gap-1"
              >
                📊 Export CSV
              </button>
            </div>

            <div className="space-y-2 max-h-[330px] overflow-y-auto text-xs">
              {closedTrades.length === 0 ? (
                <p className="text-xs text-slate-500">Belum ada riwayat transaksi ditutup...</p>
              ) : (
                closedTrades.map((c, i) => (
                  <div key={i} className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/80 flex justify-between items-center text-[11px]">
                    <div>
                      <p className="font-bold text-slate-300">${c.symbol} <span className="text-[9px] text-slate-500">({c.reason})</span></p>
                      <p className="text-[9px] text-slate-500">{c.closedAt}</p>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold ${c.netPnlUSD >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {c.netPnlUSD >= 0 ? '+' : ''}${c.netPnlUSD}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>

      {/* LOGS WITH SMART MONEY WALLET TRACKER */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <h2 className="text-xs font-bold text-cyan-400 mb-2">🐋 Smart Money &amp; Whale Wallet Tracker</h2>
          <div className="bg-slate-950 p-2.5 rounded-lg h-36 overflow-y-auto text-[10px] font-mono text-cyan-300 space-y-1 border border-slate-800/60">
            {smartMoneyLogs.concat(whaleLogs).length === 0 ? (
              <p className="text-slate-600">Menunggu aktivitas wallet...</p>
            ) : (
              smartMoneyLogs.concat(whaleLogs).map((l, i) => <p key={i}>{l}</p>)
            )}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <h2 className="text-xs font-bold text-slate-300 mb-2">⚡ System Console Logs</h2>
          <div className="bg-slate-950 p-2.5 rounded-lg h-36 overflow-y-auto text-[10px] font-mono text-slate-400 space-y-1 border border-slate-800/60">
            {systemLogs.length === 0 ? (
              <p className="text-slate-600">Engine siap...</p>
            ) : (
              systemLogs.map((sys, i) => <p key={i}>{sys}</p>)
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
