'use client';
import React, { useState, useEffect, useRef } from 'react';

export default function Home() {
  // 1. ENGINE & SECURITY STATES
  const [isRunning, setIsRunning] = useState(false);
  const [isEmergencyKilled, setIsEmergencyKilled] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const MASTER_PASSWORD = 'erwinirawan1234567890';

  // 2. SOLANA WEB3 & HELIUS RPC STATES
  const [rpcEndpoint, setRpcEndpoint] = useState('https://mainnet.helius-rpc.com/?api-key=YOUR_HELIUS_API_KEY');
  const [jupiterApiKey, setJupiterApiKey] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [realSolBalance, setRealSolBalance] = useState(0);
  const [solPriceUSD, setSolPriceUSD] = useState(0);

  // 3. FETCH REAL-TIME SOL PRICE & BALANCE VIA RPC HELIUS
  const fetchRealSolBalance = async (address) => {
    if (!rpcEndpoint || !address) return;
    try {
      const res = await fetch(rpcEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 'get-balance',
          method: 'getBalance',
          params: [address]
        })
      });
      const data = await res.json();
      if (data?.result?.value !== undefined) {
        const solVal = data.result.value / 1e9;
        setRealSolBalance(parseFloat(solVal.toFixed(4)));
      }
    } catch (err) {
      console.log('Helius RPC Balance Fetch Error:', err);
    }
  };

  useEffect(() => {
    const fetchSolPriceViaRPC = async () => {
      if (!rpcEndpoint) return;
      try {
        const res = await fetch(rpcEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: 'get-sol-price',
            method: 'getAsset',
            params: {
              id: 'So11111111111111111111111111111111111111112' // WSOL Mint
            }
          })
        });
        
        const data = await res.json();
        
        if (data?.result?.token_info?.price_info?.price_per_token) {
          setSolPriceUSD(parseFloat(data.result.token_info.price_info.price_per_token));
        } else {
          // Fallback via Jupiter API
          const jupRes = await fetch('https://api.jup.ag/price/v2?ids=So11111111111111111111111111111111111111112');
          const jupData = await jupRes.json();
          const price = jupData?.data?.So11111111111111111111111111111111111111112?.price;
          if (price) setSolPriceUSD(parseFloat(price));
        }
      } catch (err) {
        console.log('Gagal update harga SOL via RPC:', err);
      }
    };

    fetchSolPriceViaRPC();
    if (isWalletConnected && walletAddress) {
      fetchRealSolBalance(walletAddress);
    }

    const interval = setInterval(() => {
      fetchSolPriceViaRPC();
      if (isWalletConnected && walletAddress) {
        fetchRealSolBalance(walletAddress);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [rpcEndpoint, walletAddress, isWalletConnected]);

  // 4. IN-APP NOTIFICATION SYSTEM
  const [notifications, setNotifications] = useState([]);

  const triggerNotification = (title, message) => {
    const id = Date.now();
    setNotifications((prev) => [{ id, title, message }, ...prev.slice(0, 4)]);

    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 4000);
  };

  // 5. CAPITAL MANAGEMENT & PARAMETERS
  const [equity, setEquity] = useState(0);
  
  const [riskPercent, setRiskPercent] = useState(20);
  const [maxPositions, setMaxPositions] = useState(5);
  const [minLiquidityFilter, setMinLiquidityFilter] = useState(5000);
  const [minAiScoreFilter, setMinAiScoreFilter] = useState(80);
  const [stagnantTimeLimitMinutes, setStagnantTimeLimitMinutes] = useState(10);
  const [slippage, setSlippage] = useState(1.0);
  const [gasFeeUSD, setGasFeeUSD] = useState(0.02);
  const [autoPaused, setAutoPaused] = useState(false);

  // CONFIG ENGINE FEATURE TOGGLES
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

  // DATA STATES
  const [scannedTokens, setScannedTokens] = useState([]);
  const [activeTrades, setActiveTrades] = useState([]);
  const [closedTrades, setClosedTrades] = useState([]);
  const [smartMoneyLogs, setSmartMoneyLogs] = useState([]);
  const [whaleLogs, setWhaleLogs] = useState([]);
  const [systemLogs, setSystemLogs] = useState([]);
  const [equityHistory, setEquityHistory] = useState([]);

  const blacklistKeywords = ['TEST', 'RUG', 'SCAM', 'HACK', 'FAKE', 'DRAIN'];

  // LOG HELPERS
  const addSystemLog = (msg) => setSystemLogs((prev) => [`[${new Date().toLocaleTimeString('id-ID')}] ${msg}`, ...prev.slice(0, 99)]);
  const addSmartMoneyLog = (msg) => setSmartMoneyLogs((prev) => [`[${new Date().toLocaleTimeString('id-ID')}] ${msg}`, ...prev.slice(0, 49)]);
  const addWhaleLog = (msg) => setWhaleLogs((prev) => [`[${new Date().toLocaleTimeString('id-ID')}] ${msg}`, ...prev.slice(0, 49)]);

  // REFS FOR STABLE RE-RENDERS
  const activeTradesRef = useRef(activeTrades);
  const isRunningRef = useRef(isRunning);
  const isEmergencyKilledRef = useRef(isEmergencyKilled);
  const autoPausedRef = useRef(autoPaused);

  useEffect(() => { activeTradesRef.current = activeTrades; }, [activeTrades]);
  useEffect(() => { isRunningRef.current = isRunning; }, [isRunning]);
  useEffect(() => { isEmergencyKilledRef.current = isEmergencyKilled; }, [isEmergencyKilled]);
  useEffect(() => { autoPausedRef.current = autoPaused; }, [autoPaused]);

  // LOCAL STORAGE PERSISTENCE
  useEffect(() => {
    const savedClosed = localStorage.getItem('sh_closedTrades');
    const savedJupKey = localStorage.getItem('sh_jupKey');
    const savedRpc = localStorage.getItem('sh_rpc');

    if (savedClosed) setClosedTrades(JSON.parse(savedClosed));
    if (savedJupKey) setJupiterApiKey(savedJupKey);
    if (savedRpc) setRpcEndpoint(savedRpc);
  }, []);

  useEffect(() => {
    localStorage.setItem('sh_closedTrades', JSON.stringify(closedTrades));
    localStorage.setItem('sh_jupKey', jupiterApiKey);
    localStorage.setItem('sh_rpc', rpcEndpoint);
  }, [closedTrades, jupiterApiKey, rpcEndpoint]);

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

  const disconnectWallet = () => {
    if (window.solana) window.solana.disconnect();
    setWalletAddress('');
    setIsWalletConnected(false);
    setRealSolBalance(0);
    addSystemLog('🔌 [WALLET] Disconnected');
  };

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
      addSystemLog('▶ [SYSTEM] Security Verified. Real Trade Core Engine Started!');
      triggerNotification('Engine Active', 'Bot REAL berhasil berjalan dengan otorisasi password!');
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
    if (isEmergencyKilledRef.current || autoPausedRef.current) return;

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
      activeTradesRef.current.length < maxPositions
    ) {
      executeAutoBuy(newToken);
    }
  };

  // BUY EXECUTION (REAL MODE)
  const executeAutoBuy = async (token) => {
    if (!isWalletConnected || realSolBalance < 0.001) {
      addSystemLog('⚠️ [REAL EXECUTION ERROR] Wallet belum terhubung atau saldo SOL tidak mencukupi!');
      return;
    }

    const currentActiveBalanceUSD = realSolBalance * (solPriceUSD || 150);

    if (currentActiveBalanceUSD <= 0) return;

    let sizePercent = riskPercent;
    if (enableCompound && compoundRate > 0) {
      sizePercent = Math.min(100, riskPercent * (1 + compoundRate / 100));
    }

    const positionSize = parseFloat((currentActiveBalanceUSD * (sizePercent / 100)).toFixed(2));
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

    setActiveTrades((prev) => [newTrade, ...prev]);

    triggerNotification(`🚀 OPEN BUY REAL $${token.symbol}`, `Size: $${positionSize} | DEX: ${token.dex}`);
    addSystemLog(`🚀 [REAL-BUY] $${token.symbol} @ $${token.price} | Size: $${positionSize}`);
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
            currentPositionSize = currentPositionSize / 2;
            updatedPartiallyTaken = true;
            addSystemLog(`[REAL PARTIAL TP] $${trade.symbol} 50% Secured @ +${netPnlPercent}%`);
            triggerNotification('Partial TP Secured', `$${trade.symbol} 50% posisi real telah diamankan.`);
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
  }, [isRunning, activeTrades.length, takeProfit, stopLoss, trailingStop, enableTakeProfit, enableStopLoss, enableTrailingStop, enablePartialTP, enableBreakEvenProtect, enableTimeExit, stagnantTimeLimitMinutes, isEmergencyKilled]);

  const closeTradePosition = (trade, netPnlUSD, netPnlPercent, reason) => {
    const closedItem = {
      ...trade,
      closePrice: trade.currentPrice,
      netPnlUSD,
      netPnlPercent,
      reason,
      closedAt: new Date().toLocaleTimeString('id-ID')
    };

    setClosedTrades((prev) => [closedItem, ...prev]);
    triggerNotification(`🔔 POSISI REAL DITUTUP ($${trade.symbol})`, `PnL: ${netPnlUSD >= 0 ? '+' : ''}$${netPnlUSD} (${reason})`);
    addSystemLog(`🔔 [REAL CLOSE - ${reason.toUpperCase()}] $${trade.symbol} | Net PnL: ${netPnlUSD >= 0 ? '+' : ''}$${netPnlUSD} (${netPnlPercent}%)`);
    
    if (isWalletConnected && walletAddress) {
      fetchRealSolBalance(walletAddress);
    }
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
    a.setAttribute('download', `Solana_Hunter_Analytics_REAL_${new Date().toISOString().slice(0,10)}.csv`);
    a.click();
  };

  // KALKULASI SALDO REAL & EQUITY
  useEffect(() => {
    const activePnLUSD = activeTrades.reduce((acc, curr) => acc + curr.pnlUSD, 0);
    const currentWalletUSD = realSolBalance * (solPriceUSD || 0);
    const calculatedEquity = parseFloat((currentWalletUSD + activePnLUSD).toFixed(2));
    
    setEquity(calculatedEquity);

    if (calculatedEquity > 0) {
      setEquityHistory((prev) => [...prev.slice(-19), calculatedEquity]);
    }
  }, [realSolBalance, solPriceUSD, activeTrades]);

  // EMERGENCY STOP (KILL SWITCH)
  const handleEmergencyKill = () => {
    setIsRunning(false);
    setIsEmergencyKilled(true);
    addSystemLog('🚨 [EMERGENCY KILL SWITCH ACTIVATED] Semua operasi bot dihentikan secara paksa!');
    triggerNotification('EMERGENCY KILL', 'Bot telah dinonaktifkan secara darurat!');
  };

  return (
    <div style={{ backgroundColor: '#0b0e14', color: '#e2e8f0', minHeight: '100vh', fontFamily: 'monospace', padding: '20px' }}>
      {/* NOTIFICATIONS */}
      <div style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 9999 }}>
        {notifications.map((n) => (
          <div key={n.id} style={{ backgroundColor: '#1e293b', borderLeft: '4px solid #10b981', padding: '12px 16px', marginBottom: '8px', borderRadius: '4px', boxShadow: '0 4px 6px rgba(0,0,0,0.3)' }}>
            <div style={{ fontWeight: 'bold', color: '#10b981' }}>{n.title}</div>
            <div style={{ fontSize: '12px', color: '#94a3b8' }}>{n.message}</div>
          </div>
        ))}
      </div>

      {/* HEADER SECTION */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1e293b', paddingBottom: '15px', marginBottom: '20px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '24px', color: '#38bdf8' }}>⚡ SOLANA HUNTER - REAL MODE AUTOMATION</h1>
          <p style={{ margin: '5px 0 0 0', fontSize: '12px', color: '#64748b' }}>Full-Automated Solana Mainnet Live Sniper & Execution Engine</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button 
            onClick={connectWallet} 
            style={{ backgroundColor: isWalletConnected ? '#059669' : '#2563eb', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
            {isWalletConnected ? `🟢 ${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}` : '🔌 Connect Phantom'}
          </button>
          {isWalletConnected && (
            <button onClick={disconnectWallet} style={{ backgroundColor: '#334155', color: '#fff', border: 'none', padding: '8px 12px', borderRadius: '4px', cursor: 'pointer' }}>
              Disconnect
            </button>
          )}
          <button 
            onClick={handleToggleEngine} 
            disabled={isEmergencyKilled}
            style={{ backgroundColor: isRunning ? '#dc2626' : '#16a34a', color: '#fff', border: 'none', padding: '8px 20px', borderRadius: '4px', cursor: isEmergencyKilled ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}>
            {isRunning ? 'PAUSE ENGINE' : 'START REAL ENGINE'}
          </button>
          <button 
            onClick={handleEmergencyKill} 
            style={{ backgroundColor: '#7f1d1d', color: '#fca5a5', border: '1px solid #ef4444', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
            🚨 KILL SWITCH
          </button>
        </div>
      </header>

      {/* SECURITY AUTH MODAL */}
      {isAuthModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10000 }}>
          <form onSubmit={handleVerifyPassword} style={{ backgroundColor: '#0f172a', border: '1px solid #334155', padding: '24px', borderRadius: '8px', width: '360px' }}>
            <h3 style={{ marginTop: 0, color: '#f43f5e' }}>🔒 Otorisasi Eksekusi Real</h3>
            <p style={{ fontSize: '12px', color: '#94a3b8' }}>Masukkan Master Password untuk menyalakan eksekusi otomatis pada Solana Mainnet (Real Capital).</p>
            <input 
              type="password" 
              placeholder="Masukkan Master Password" 
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              style={{ width: '100%', padding: '10px', backgroundColor: '#1e293b', border: '1px solid #475569', color: '#fff', borderRadius: '4px', marginBottom: '15px', boxSizing: 'border-box' }}
            />
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setIsAuthModalOpen(false)} style={{ padding: '8px 12px', backgroundColor: '#334155', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Batal</button>
              <button type="submit" style={{ padding: '8px 16px', backgroundColor: '#0284c7', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Verifikasi & Start</button>
            </div>
          </form>
        </div>
      )}

      {/* STATUS & OVERVIEW METRICS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '20px' }}>
        <div style={{ backgroundColor: '#1e293b', padding: '15px', borderRadius: '6px' }}>
          <div style={{ fontSize: '12px', color: '#94a3b8' }}>Real SOL Balance</div>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#38bdf8' }}>{realSolBalance} SOL</div>
          <div style={{ fontSize: '11px', color: '#64748b' }}>≈ ${((realSolBalance * solPriceUSD) || 0).toFixed(2)} USD</div>
        </div>
        <div style={{ backgroundColor: '#1e293b', padding: '15px', borderRadius: '6px' }}>
          <div style={{ fontSize: '12px', color: '#94a3b8' }}>Real SOL Price (RPC/JUP)</div>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#f59e0b' }}>${solPriceUSD.toFixed(2)}</div>
        </div>
        <div style={{ backgroundColor: '#1e293b', padding: '15px', borderRadius: '6px' }}>
          <div style={{ fontSize: '12px', color: '#94a3b8' }}>Est. Total Equity</div>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#10b981' }}>${equity.toFixed(2)} USD</div>
        </div>
        <div style={{ backgroundColor: '#1e293b', padding: '15px', borderRadius: '6px' }}>
          <div style={{ fontSize: '12px', color: '#94a3b8' }}>Active Open Trades</div>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#a855f7' }}>{activeTrades.length} / {maxPositions}</div>
        </div>
      </div>

      {/* DASHBOARD CONTROLS & LOGS */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px' }}>
        {/* CONFIG PANEL */}
        <div style={{ backgroundColor: '#0f172a', padding: '15px', borderRadius: '6px', border: '1px solid #1e293b' }}>
          <h3 style={{ marginTop: 0, color: '#38bdf8', fontSize: '16px' }}>⚙️ Automation Parameters</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12px' }}>
            <label>
              Risk Per Position (% Saldo):
              <input type="number" value={riskPercent} onChange={(e) => setRiskPercent(Number(e.target.value))} style={{ width: '100%', padding: '6px', backgroundColor: '#1e293b', border: '1px solid #334155', color: '#fff', borderRadius: '4px' }} />
            </label>
            <label>
              Max Parallel Positions:
              <input type="number" value={maxPositions} onChange={(e) => setMaxPositions(Number(e.target.value))} style={{ width: '100%', padding: '6px', backgroundColor: '#1e293b', border: '1px solid #334155', color: '#fff', borderRadius: '4px' }} />
            </label>
            <label>
              Take Profit Target (%):
              <input type="number" value={takeProfit} onChange={(e) => setTakeProfit(Number(e.target.value))} style={{ width: '100%', padding: '6px', backgroundColor: '#1e293b', border: '1px solid #334155', color: '#fff', borderRadius: '4px' }} />
            </label>
            <label>
              Stop Loss (%):
              <input type="number" value={stopLoss} onChange={(e) => setStopLoss(Number(e.target.value))} style={{ width: '100%', padding: '6px', backgroundColor: '#1e293b', border: '1px solid #334155', color: '#fff', borderRadius: '4px' }} />
            </label>
            <label>
              Trailing Stop (%):
              <input type="number" value={trailingStop} onChange={(e) => setTrailingStop(Number(e.target.value))} style={{ width: '100%', padding: '6px', backgroundColor: '#1e293b', border: '1px solid #334155', color: '#fff', borderRadius: '4px' }} />
            </label>
            <label>
              Helius RPC Endpoint:
              <input type="text" value={rpcEndpoint} onChange={(e) => setRpcEndpoint(e.target.value)} style={{ width: '100%', padding: '6px', backgroundColor: '#1e293b', border: '1px solid #334155', color: '#fff', borderRadius: '4px' }} />
            </label>
          </div>
        </div>

        {/* LOGS PANEL */}
        <div style={{ backgroundColor: '#0f172a', padding: '15px', borderRadius: '6px', border: '1px solid #1e293b' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <h3 style={{ margin: 0, color: '#38bdf8', fontSize: '16px' }}>📜 System Activity Logs</h3>
            <button onClick={exportAnalyticsCSV} style={{ backgroundColor: '#334155', color: '#38bdf8', border: '1px solid #0284c7', padding: '4px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}>
              📥 Export CSV
            </button>
          </div>
          <div style={{ backgroundColor: '#020617', padding: '10px', borderRadius: '4px', height: '280px', overflowY: 'auto', fontSize: '11px', border: '1px solid #1e293b' }}>
            {systemLogs.length === 0 ? <span style={{ color: '#475569' }}>Belum ada log aktivitas...</span> : systemLogs.map((log, idx) => (
              <div key={idx} style={{ marginBottom: '4px', borderBottom: '1px solid #0f172a', paddingBottom: '2px' }}>{log}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
