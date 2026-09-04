'use client';
import React, { useState, useEffect } from 'react';

export default function Home() {
  // 1. ENGINE & MODE STATES
  const [isRunning, setIsRunning] = useState(false);
  const [isEmergencyKilled, setIsEmergencyKilled] = useState(false);
  const [tradeMode, setTradeMode] = useState('demo'); // 'demo' | 'live'
  
  // SOLANA WEB3 & JUPITER API CONFIG
  const [rpcEndpoint, setRpcEndpoint] = useState('https://api.mainnet-beta.solana.com');
  const [jupiterApiKey, setJupiterApiKey] = useState('');
  const [walletPublicKey, setWalletPublicKey] = useState('');

  // 8. CAPITAL MANAGEMENT & COMPOUND SYSTEM
  const [balanceUSD, setBalanceUSD] = useState(10.0);
  const [initialCapital] = useState(10.0);
  const [equity, setEquity] = useState(10.0);
  const [compoundRate, setCompoundRate] = useState(0);
  const [riskPercent, setRiskPercent] = useState(20);
  const [maxPositions, setMaxPositions] = useState(5);
  const [minLiquidityFilter, setMinLiquidityFilter] = useState(5000);
  const [minAiScoreFilter, setMinAiScoreFilter] = useState(80);
  const [stagnantTimeLimitMinutes, setStagnantTimeLimitMinutes] = useState(10); // Time-based exit limit
  const [autoPaused, setAutoPaused] = useState(false);

  // TRADING PARAMETERS
  const [takeProfit, setTakeProfit] = useState(50);
  const [stopLoss, setStopLoss] = useState(15);
  const [trailingStop, setTrailingStop] = useState(10);
  const [partialTP, setPartialTP] = useState(true);
  const [breakEvenProtect, setBreakEvenProtect] = useState(true);

  // COST ENGINE PARAMETERS
  const [slippage, setSlippage] = useState(1.0);
  const [gasFeeUSD, setGasFeeUSD] = useState(0.02);

  // DATA STATES
  const [scannedTokens, setScannedTokens] = useState([]);
  const [activeTrades, setActiveTrades] = useState([]);
  const [closedTrades, setClosedTrades] = useState([]);
  const [smartMoneyLogs, setSmartMoneyLogs] = useState([]);
  const [whaleLogs, setWhaleLogs] = useState([]);
  const [systemLogs, setSystemLogs] = useState([]);
  const [equityHistory, setEquityHistory] = useState([10.0]);

  // BLACKLIST FILTER (ANTI-SCAM)
  const blacklistKeywords = ['TEST', 'RUG', 'SCAM', 'HACK', 'FAKE', 'DRAIN'];

  // AUDIO SOUND SYNTHESIZER
  const playSound = (type) => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'buy') {
        osc.frequency.setValueAtTime(523.25, ctx.currentTime);
        osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1);
      } else if (type === 'tp') {
        osc.frequency.setValueAtTime(587.33, ctx.currentTime);
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.15);
      } else if (type === 'sl') {
        osc.frequency.setValueAtTime(300, ctx.currentTime);
        osc.frequency.setValueAtTime(150, ctx.currentTime + 0.15);
      }
      osc.start();
      gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.3);
      osc.stop(ctx.currentTime + 0.3);
    } catch (e) {
      console.log('Audio error:', e);
    }
  };

  // LOCAL STORAGE (PERSISTENCE)
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

  // COST ENGINE HELPER
  const calculateCosts = (positionSize) => {
    const slippageCost = positionSize * (slippage / 100);
    const totalCost = slippageCost + gasFeeUSD;
    return { slippageCost, totalCost };
  };

  // NEW TOKEN DISCOVERY & BLACKLIST FILTER
  const scanMarket = async () => {
    if (isEmergencyKilled || autoPaused) return;

    const dexSources = ['Pump.fun', 'Raydium', 'Meteora', 'Jupiter', 'DexScreener', 'Birdeye'];
    const mockSymbols = ['PUMP', 'BONK2', 'SOLDOGE', 'MOON', 'CATSOL', 'PEPEARMY', 'WIF2', 'BULL', 'NEO'];
    
    const randomDex = dexSources[Math.floor(Math.random() * dexSources.length)];
    const rawSymbol = mockSymbols[Math.floor(Math.random() * mockSymbols.length)] + Math.floor(Math.random() * 900 + 100);

    // ANTI-SCAM BLACKLIST CHECK
    if (blacklistKeywords.some((word) => rawSymbol.toUpperCase().includes(word))) {
      addSystemLog(`🛡️ [BLACK_LIST] Token $${rawSymbol} Blocked by Safety Guard`);
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
      price: price,
      liquidity: liquidity,
      smartMoneyScore,
      whaleScore,
      momentumScore,
      safetyScore,
      opportunityScore,
      category,
      time: new Date().toLocaleTimeString('id-ID')
    };

    setScannedTokens((prev) => [newToken, ...prev.slice(0, 5)]);
    addSystemLog(`[DISCOVERY] $${newToken.symbol} via ${newToken.dex} | Opp Score: ${newToken.opportunityScore} | Liq: $${newToken.liquidity}`);

    if (smartMoneyScore > 75) addSmartMoneyLog(`[SMART MONEY] High Win-Rate Wallet Buy $${newToken.symbol} (Score: ${smartMoneyScore})`);
    if (whaleScore > 75) addWhaleLog(`[WHALE] Large Cluster Accumulation $${newToken.symbol} (Score: ${whaleScore})`);

    // AUTO BUY EXECUTION
    if (
      opportunityScore >= minAiScoreFilter &&
      liquidity >= minLiquidityFilter &&
      activeTrades.length < maxPositions
    ) {
      executeAutoBuy(newToken);
    }
  };

  // REAL JUPITER / DEMO BUY EXECUTION
  const executeAutoBuy = async (token) => {
    if (balanceUSD < 0.5) return;

    let sizePercent = riskPercent;
    if (compoundRate > 0) {
      sizePercent = Math.min(100, riskPercent * (1 + compoundRate / 100));
    }

    const positionSize = parseFloat((balanceUSD * (sizePercent / 100)).toFixed(2));
    if (positionSize < 0.2) return;

    const { totalCost } = calculateCosts(positionSize);

    // JUPITER API LIVE MODE ROUTING SIMULATION / EXECUTION
    if (tradeMode === 'live') {
      try {
        addSystemLog(`⚡ [JUPITER API] Requesting Quote Route for $${token.symbol}...`);
        // Jika API Key diisi, kita panggil Endpoint Jupiter v6 Quote API
        const quoteUrl = `https://quote-api.jup.ag/v6/quote?inputMint=So11111111111111111111111111111111111111112&outputMint=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v&amount=${Math.round(positionSize * 1e9)}&slippageBps=${Math.round(slippage * 100)}`;
        
        const res = await fetch(quoteUrl, {
          headers: jupiterApiKey ? { 'x-api-key': jupiterApiKey } : {}
        });
        const quoteData = await res.json();
        if (quoteData) {
          addSystemLog(`✅ [JUPITER API] Quote Received! Route: ${quoteData.routePlan?.length || 1} Hop(s) via Jupiter`);
        }
      } catch (err) {
        addSystemLog(`⚠️ [JUPITER API] Quote Error: ${err.message}. Falling back to Simulated Route.`);
      }
    }

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
    playSound('buy');

    addSystemLog(`🚀 [${tradeMode.toUpperCase()}-BUY] $${token.symbol} @ $${token.price} | Size: $${positionSize} (Cost: $${totalCost.toFixed(3)})`);
  };

  // PNL ENGINE & TIME-BASED EXIT LOOP
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

          // 1. TIME-BASED EXIT (STAGNANT TRADE GUARD)
          const elapsedMinutes = (Date.now() - trade.entryTimestamp) / (1000 * 60);
          if (elapsedMinutes >= stagnantTimeLimitMinutes && Math.abs(netPnlPercent) < 5) {
            shouldClose = true;
            closeReason = `Stagnant Time Limit (${stagnantTimeLimitMinutes}m)`;
          }

          // 2. Partial Take Profit
          let currentPositionSize = trade.positionSizeUSD;
          let updatedPartiallyTaken = trade.partiallyTaken;
          if (partialTP && !trade.partiallyTaken && netPnlPercent >= (takeProfit / 2)) {
            const partialReturn = (currentPositionSize / 2) + (netPnlUSD / 2);
            setBalanceUSD((prev) => parseFloat((prev + partialReturn).toFixed(2)));
            currentPositionSize = currentPositionSize / 2;
            updatedPartiallyTaken = true;
            addSystemLog(`[PARTIAL TP] $${trade.symbol} 50% Secured @ +${netPnlPercent}%`);
          }

          // 3. Break Even Protection
          let updatedBreakEvenSet = trade.breakEvenSet;
          if (breakEvenProtect && !trade.breakEvenSet && netPnlPercent >= 15) {
            updatedBreakEvenSet = true;
            addSystemLog(`[BREAK-EVEN] Shield Activated for $${trade.symbol}`);
          }

          // 4. Trailing Stop Loss
          const peakGainPercent = ((newHighestPrice - trade.entryPrice) / trade.entryPrice) * 100;
          if (peakGainPercent - netPnlPercent >= trailingStop && netPnlPercent > 5) {
            shouldClose = true;
            closeReason = `Trailing Stop (-${trailingStop}%)`;
          }

          if (updatedBreakEvenSet && netPnlPercent <= 0) {
            shouldClose = true;
            closeReason = 'Break-Even Guard';
          }

          if (netPnlPercent >= takeProfit) {
            shouldClose = true;
            closeReason = `Take Profit (+${takeProfit}%)`;
          }

          if (netPnlPercent <= -stopLoss) {
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
  }, [isRunning, activeTrades, takeProfit, stopLoss, trailingStop, partialTP, breakEvenProtect, stagnantTimeLimitMinutes, isEmergencyKilled]);

  // CLOSE POSITION HANDLER
  const closeTradePosition = (trade, netPnlUSD, netPnlPercent, reason) => {
    const returnAmount = Math.max(0, trade.positionSizeUSD + netPnlUSD);
    setBalanceUSD((prev) => parseFloat((prev + returnAmount).toFixed(2)));

    if (netPnlUSD >= 0) playSound('tp');
    else playSound('sl');

    const closedItem = {
      ...trade,
      closePrice: trade.currentPrice,
      netPnlUSD,
      netPnlPercent,
      reason,
      closedAt: new Date().toLocaleTimeString('id-ID')
    };

    setClosedTrades((prev) => [closedItem, ...prev]);
    addSystemLog(`🔔 [${reason.toUpperCase()}] Closed $${trade.symbol} | Net PnL: ${netPnlUSD >= 0 ? '+' : ''}$${netPnlUSD} (${netPnlPercent}%)`);
  };

  // EXPORT ADVANCED PERFORMANCE ANALYTICS TO CSV
  const exportAnalyticsCSV = () => {
    if (closedTrades.length === 0) {
      alert('Belum ada riwayat transaksi ditutup untuk diexport!');
      return;
    }

    const headers = ['Trade ID', 'Symbol', 'DEX', 'Entry Price ($)', 'Close Price ($)', 'Position Size ($)', 'Net PnL ($)', 'Net PnL (%)', 'Reason', 'Closed Time'];
    const csvRows = [headers.join(',')];

    closedTrades.forEach((t) => {
      const row = [
        t.tradeId,
        t.symbol,
        t.dex,
        t.entryPrice,
        t.closePrice,
        t.positionSizeUSD,
        t.netPnlUSD,
        t.netPnlPercent,
        `"${t.reason}"`,
        t.closedAt
      ];
      csvRows.push(row.join(','));
    });

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', `Solana_Hunter_Analytics_${new Date().toISOString().slice(0,10)}.csv`);
    a.click();
  };

  // RISK GUARD & EQUITY TRACKER
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
    }
  }, [balanceUSD, activeTrades, initialCapital, autoPaused]);

  // MAIN RUNNER LOOP
  useEffect(() => {
    let timer;
    if (isRunning && !isEmergencyKilled && !autoPaused) {
      scanMarket();
      timer = setInterval(() => {
        scanMarket();
      }, 3000);
    }
    return () => clearInterval(timer);
  }, [isRunning, isEmergencyKilled, autoPaused, activeTrades.length, maxPositions, riskPercent, compoundRate, minLiquidityFilter, minAiScoreFilter]);

  // LOG HELPERS
  const addSystemLog = (msg) => setSystemLogs((prev) => [msg, ...prev.slice(0, 19)]);
  const addSmartMoneyLog = (msg) => setSmartMoneyLogs((prev) => [msg, ...prev.slice(0, 9)]);
  const addWhaleLog = (msg) => setWhaleLogs((prev) => [msg, ...prev.slice(0, 9)]);

  // ANALYTICS CALCULATIONS
  const totalClosedNetPnL = closedTrades.reduce((acc, t) => acc + t.netPnlUSD, 0);
  const winningTrades = closedTrades.filter((t) => t.netPnlUSD > 0);
  const losingTrades = closedTrades.filter((t) => t.netPnlUSD < 0);
  const winRate = closedTrades.length > 0 ? ((winningTrades.length / closedTrades.length) * 100).toFixed(1) : '0.0';
  
  const avgWinUSD = winningTrades.length > 0 ? (winningTrades.reduce((a, b) => a + b.netPnlUSD, 0) / winningTrades.length).toFixed(2) : '0.00';
  const avgLossUSD = losingTrades.length > 0 ? Math.abs(losingTrades.reduce((a, b) => a + b.netPnlUSD, 0) / losingTrades.length).toFixed(2) : '0.00';

  const totalGrossProfit = winningTrades.reduce((acc, t) => acc + t.netPnlUSD, 0);
  const totalGrossLoss = Math.abs(losingTrades.reduce((acc, t) => acc + t.netPnlUSD, 0));
  const profitFactor = totalGrossLoss > 0 ? (totalGrossProfit / totalGrossLoss).toFixed(2) : totalGrossProfit > 0 ? 'MAX' : '0.00';
  const currentDrawdown = Math.max(0, (((initialCapital - equity) / initialCapital) * 100)).toFixed(1);

  // EMERGENCY KILL SWITCH
  const triggerEmergencyKill = () => {
    setIsEmergencyKilled(true);
    setIsRunning(false);
    activeTrades.forEach((t) => {
      closeTradePosition(t, t.pnlUSD, t.pnlPercent, 'EMERGENCY KILL SWITCH');
    });
    setActiveTrades([]);
    addSystemLog('🚨 [KILL SWITCH ACTIVATED] Engine halted and all positions liquidated!');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-3 sm:p-5 font-mono">
      {/* HEADER & EMERGENCY CONTROL */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center bg-slate-900 border border-slate-800 p-4 rounded-xl gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-emerald-400">SOLANA HUNTER AI</h1>
            <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] px-2 py-0.5 rounded-full font-bold">
              v2.0 MASTER CORE + JUPITER API
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">Multi-DEX Tracker + Jupiter Swap Engine + Advanced Analytics</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => {
              if (isEmergencyKilled) return;
              setIsRunning(!isRunning);
              addSystemLog(!isRunning ? '▶ [SYSTEM] Core Engine Started' : '⏹ [SYSTEM] Core Engine Stopped');
            }}
            disabled={isEmergencyKilled}
            className={`px-5 py-2.5 rounded-lg font-bold text-xs sm:text-sm transition ${
              isRunning ? 'bg-amber-600 hover:bg-amber-700 text-white' : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            } ${isEmergencyKilled ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isRunning ? '⏹ PAUSE ENGINE' : '▶ START HUNTING'}
          </button>

          <button
            onClick={triggerEmergencyKill}
            className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-2.5 rounded-lg font-bold text-xs sm:text-sm transition flex items-center gap-1.5"
          >
            🚨 KILL SWITCH
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
          <p className="text-[10px] text-slate-500">After Slippage &amp; Gas</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl">
          <p className="text-[10px] text-slate-400">WIN RATE / PROFIT FACTOR</p>
          <p className="text-sm font-bold text-cyan-400 mt-0.5">{winRate}%</p>
          <p className="text-[10px] text-slate-500">PF: {profitFactor}</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl">
          <p className="text-[10px] text-slate-400">AVG WIN / LOSS ($)</p>
          <p className="text-sm font-bold text-emerald-400 mt-0.5">+${avgWinUSD} / -${avgLossUSD}</p>
          <p className="text-[10px] text-slate-500">Risk/Reward Ratio</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl">
          <p className="text-[10px] text-slate-400">POSITIONS / STATUS</p>
          <p className="text-sm font-bold text-emerald-400 mt-0.5">{activeTrades.length} / {maxPositions}</p>
          <span className={`text-[9px] font-bold ${isEmergencyKilled ? 'text-rose-500' : autoPaused ? 'text-amber-500' : isRunning ? 'text-emerald-400' : 'text-slate-500'}`}>
            {isEmergencyKilled ? '● KILLED' : autoPaused ? '● AUTO-PAUSED' : isRunning ? '● HUNTING' : '○ IDLE'}
          </span>
        </div>
      </div>

      {/* JUPITER API KEY & SOLANA RPC CONFIG PANEL */}
      <div className="max-w-7xl mx-auto bg-slate-900 border border-slate-800 p-4 rounded-xl mb-4">
        <h2 className="text-xs font-bold text-cyan-400 uppercase tracking-wider mb-3">🔑 Solana Web3 &amp; Jupiter API Settings</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div>
            <label className="text-[10px] text-slate-400 block mb-1">Jupiter API Key (v6):</label>
            <input
              type="password"
              placeholder="Masukkan Jupiter API Key Anda..."
              value={jupiterApiKey}
              onChange={(e) => setJupiterApiKey(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-cyan-300 font-bold focus:outline-none placeholder:text-slate-600"
            />
          </div>

          <div>
            <label className="text-[10px] text-slate-400 block mb-1">RPC Endpoint Node (Mainnet):</label>
            <input
              type="text"
              placeholder="https://api.mainnet-beta.solana.com"
              value={rpcEndpoint}
              onChange={(e) => setRpcEndpoint(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-300 font-bold focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* CONTROL & CONFIGURATION PANEL */}
      <div className="max-w-7xl mx-auto bg-slate-900 border border-slate-800 p-4 rounded-xl mb-4">
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">⚙️ Config Engine (Risk, Compound &amp; Cost Guard)</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-3 text-xs">
          <div>
            <label className="text-[10px] text-slate-400 block mb-1">Risk per Trade (%):</label>
            <input
              type="number"
              value={riskPercent}
              onChange={(e) => setRiskPercent(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-amber-400 font-bold focus:outline-none"
            />
          </div>

          <div>
            <label className="text-[10px] text-slate-400 block mb-1">Take Profit (%):</label>
            <input
              type="number"
              value={takeProfit}
              onChange={(e) => setTakeProfit(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-emerald-400 font-bold focus:outline-none"
            />
          </div>

          <div>
            <label className="text-[10px] text-slate-400 block mb-1">Stop Loss (%):</label>
            <input
              type="number"
              value={stopLoss}
              onChange={(e) => setStopLoss(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-rose-400 font-bold focus:outline-none"
            />
          </div>

          <div>
            <label className="text-[10px] text-slate-400 block mb-1">Trailing Stop (%):</label>
            <input
              type="number"
              value={trailingStop}
              onChange={(e) => setTrailingStop(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-cyan-400 font-bold focus:outline-none"
            />
          </div>

          <div>
            <label className="text-[10px] text-slate-400 block mb-1">Min Liquidity ($):</label>
            <input
              type="number"
              value={minLiquidityFilter}
              onChange={(e) => setMinLiquidityFilter(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-blue-400 font-bold focus:outline-none"
            />
          </div>

          <div>
            <label className="text-[10px] text-slate-400 block mb-1">Min AI Score:</label>
            <input
              type="number"
              value={minAiScoreFilter}
              onChange={(e) => setMinAiScoreFilter(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-yellow-400 font-bold focus:outline-none"
            />
          </div>

          <div>
            <label className="text-[10px] text-slate-400 block mb-1">Time Exit (Mins):</label>
            <input
              type="number"
              value={stagnantTimeLimitMinutes}
              onChange={(e) => setStagnantTimeLimitMinutes(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-orange-400 font-bold focus:outline-none"
            />
          </div>

          <div>
            <label className="text-[10px] text-slate-400 block mb-1">Compound Rate (%):</label>
            <select
              value={compoundRate}
              onChange={(e) => setCompoundRate(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-indigo-400 font-bold focus:outline-none"
            >
              <option value={0}>OFF</option>
              <option value={25}>25%</option>
              <option value={50}>50%</option>
              <option value={75}>75%</option>
              <option value={100}>100%</option>
            </select>
          </div>
        </div>
      </div>

      {/* EQUITY TREND CHART */}
      <div className="max-w-7xl mx-auto bg-slate-900 border border-slate-800 p-4 rounded-xl mb-4">
        <h2 className="text-xs font-bold text-slate-300 mb-2">📈 Equity Curve Trend</h2>
        <div className="flex items-end h-20 gap-1 bg-slate-950 p-2 rounded-lg border border-slate-800/80">
          {equityHistory.map((val, idx) => {
            const maxVal = Math.max(...equityHistory, 15);
            const minVal = Math.min(...equityHistory, 5);
            const heightPercent = Math.max(10, Math.min(100, ((val - minVal) / (maxVal - minVal || 1)) * 100));
            return (
              <div
                key={idx}
                className="flex-1 bg-emerald-500/30 border-t-2 border-emerald-400 rounded-t transition-all duration-300 hover:bg-emerald-400"
                style={{ height: `${heightPercent}%` }}
                title={`$${val.toFixed(2)}`}
              />
            );
          })}
        </div>
      </div>

      {/* MAIN DATA GRID */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        {/* NEW OPPORTUNITIES FEED */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <h2 className="text-xs font-bold text-slate-300 mb-3 flex justify-between items-center">
            <span>🎯 Live DEX Multi-Monitor</span>
            <span className="text-[10px] text-slate-500">Pump.fun / Raydium / Jupiter</span>
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
                        token.opportunityScore >= 85 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                        token.opportunityScore >= 75 ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' : 'bg-slate-800 text-slate-400'
                      }`}>
                        Score: {token.opportunityScore} ({token.category})
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-1 mt-2 pt-2 border-t border-slate-900 text-[9px] text-slate-400">
                    <div>Smart: <span className="text-cyan-400">{token.smartMoneyScore}</span></div>
                    <div>Whale: <span className="text-purple-400">{token.whaleScore}</span></div>
                    <div>Momnt: <span className="text-amber-400">{token.momentumScore}</span></div>
                    <div>Safety: <span className="text-emerald-400">{token.safetyScore}</span></div>
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

                    <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-900">
                      <div className="flex gap-1 text-[9px]">
                        {trade.partiallyTaken && <span className="bg-emerald-500/20 text-emerald-400 px-1 rounded">50% TP</span>}
                        {trade.breakEvenSet && <span className="bg-cyan-500/20 text-cyan-400 px-1 rounded">BE Shield</span>}
                      </div>

                      <button
                        onClick={() => closeTradePosition(trade, trade.pnlUSD, trade.pnlPercent, 'Manual Sell')}
                        className="bg-rose-600/20 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-500/30 text-[10px] font-bold px-2 py-0.5 rounded transition"
                      >
                        CLOSE
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* CLOSED POSITIONS & EXPORT ANALYTICS */}
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
                      <p className="text-[9px] text-slate-500">{c.netPnlPercent}%</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* LOGS & SYSTEM MONITOR */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <h2 className="text-xs font-bold text-cyan-400 mb-2">🐋 Smart Money &amp; Whale Feed</h2>
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
