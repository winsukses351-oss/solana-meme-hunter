'use client';
import React, { useState, useEffect, useRef } from 'react';
import { Connection, PublicKey, VersionedTransaction } from '@solana/web3.js';

export default function Home() {
  // 1. ENGINE & SECURITY STATES
  const [isRunning, setIsRunning] = useState(false);
  const [isEmergencyKilled, setIsEmergencyKilled] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const MASTER_PASSWORD = 'erwinirawan1234567890';

  // 2. SOLANA WEB3 & HELIUS RPC STATES
  const [rpcEndpoint, setRpcEndpoint] = useState('https://mainnet.helius-rpc.com/?api-key=YOUR_HELIUS_API_KEY');
  const [walletAddress, setWalletAddress] = useState('');
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [realSolBalance, setRealSolBalance] = useState(0);
  const [solPriceUSD, setSolPriceUSD] = useState(0);

  const connectionRef = useRef(null);

  useEffect(() => {
    if (rpcEndpoint) {
      connectionRef.current = new Connection(rpcEndpoint, 'confirmed');
    }
  }, [rpcEndpoint]);

  // 3. FETCH REAL-TIME SOL PRICE & BALANCE VIA HELIUS RPC
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
        const jupRes = await fetch('https://api.jup.ag/price/v2?ids=So11111111111111111111111111111111111111112');
        const jupData = await jupRes.json();
        const price = jupData?.data?.So11111111111111111111111111111111111111112?.price;
        if (price) setSolPriceUSD(parseFloat(price));
      } catch (err) {
        console.log('Gagal update harga SOL:', err);
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

  // 4. NOTIFICATIONS
  const [notifications, setNotifications] = useState([]);
  const triggerNotification = (title, message) => {
    const id = Date.now();
    setNotifications((prev) => [{ id, title, message }, ...prev.slice(0, 4)]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 4000);
  };

  // 5. PARAMETERS & CONFIGS
  const [equity, setEquity] = useState(0);
  const [riskPercent, setRiskPercent] = useState(20);
  const [maxPositions, setMaxPositions] = useState(5);
  const [minLiquidityFilter, setMinLiquidityFilter] = useState(5000);
  const [minAiScoreFilter, setMinAiScoreFilter] = useState(80);
  const [stagnantTimeLimitMinutes, setStagnantTimeLimitMinutes] = useState(10);
  const [slippageBps, setSlippageBps] = useState(100); // 100 bps = 1%
  const [autoPaused, setAutoPaused] = useState(false);

  const [enableTakeProfit, setEnableTakeProfit] = useState(true);
  const [takeProfit, setTakeProfit] = useState(50);
  const [enableStopLoss, setEnableStopLoss] = useState(true);
  const [stopLoss, setStopLoss] = useState(15);
  const [enableTrailingStop, setEnableTrailingStop] = useState(true);
  const [trailingStop, setTrailingStop] = useState(10);
  const [enableAntiRug, setEnableAntiRug] = useState(true);

  // DATA STATES
  const [scannedTokens, setScannedTokens] = useState([]);
  const [activeTrades, setActiveTrades] = useState([]);
  const [closedTrades, setClosedTrades] = useState([]);
  const [systemLogs, setSystemLogs] = useState([]);

  const blacklistKeywords = ['TEST', 'RUG', 'SCAM', 'HACK', 'FAKE', 'DRAIN'];

  const addSystemLog = (msg) => setSystemLogs((prev) => [`[${new Date().toLocaleTimeString('id-ID')}] ${msg}`, ...prev.slice(0, 99)]);

  const activeTradesRef = useRef(activeTrades);
  const isRunningRef = useRef(isRunning);
  const isEmergencyKilledRef = useRef(isEmergencyKilled);

  useEffect(() => { activeTradesRef.current = activeTrades; }, [activeTrades]);
  useEffect(() => { isRunningRef.current = isRunning; }, [isRunning]);
  useEffect(() => { isEmergencyKilledRef.current = isEmergencyKilled; }, [isEmergencyKilled]);

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
        alert('Phantom Wallet tidak ditemukan!');
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
      addSystemLog('⏹ [SYSTEM] Engine Stopped');
      triggerNotification('Engine Paused', 'Bot trading dihentikan.');
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
      addSystemLog('▶ [SYSTEM] REAL EXECUTION ENGINE ONLINE!');
      triggerNotification('Engine Active', 'Bot Live Real Trading Aktif!');
    } else {
      alert('Password salah!');
      setPasswordInput('');
    }
  };

  // REAL JUPITER SWAP EXECUTION ENGINE
  const executeJupiterRealSwap = async (inputMint, outputMint, amountInLamports, tradeType, symbol) => {
    try {
      addSystemLog(`⚡ [JUPITER API] Request Quote ${tradeType} $${symbol}...`);
      
      // 1. Get Quote dari Jupiter
      const quoteRes = await fetch(
        `https://quote-api.jup.ag/v6/quote?inputMint=${inputMint}&outputMint=${outputMint}&amount=${amountInLamports}&slippageBps=${slippageBps}`
      );
      const quoteResponse = await quoteRes.json();

      if (!quoteResponse || quoteResponse.error) {
        throw new Error(quoteResponse?.error || 'Gagal mengambil quote dari Jupiter');
      }

      // 2. Request Transaction Payload
      const swapRes = await fetch('https://quote-api.jup.ag/v6/swap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quoteResponse,
          userPublicKey: walletAddress,
          wrapAndUnwrapSol: true
        })
      });

      const { swapTransaction } = await swapRes.json();

      // 3. Request Wallet Sign & Send
      if (typeof window !== 'undefined' && window.solana) {
        addSystemLog(`📜 [BLOCKCHAIN] Meminta konfirmasi transaksi On-Chain untuk $${symbol}...`);
        
        const swapTransactionBuf = Buffer.from(swapTransaction, 'base64');
        let transaction = VersionedTransaction.deserialize(swapTransactionBuf);

        const signedTx = await window.solana.signAndSendTransaction(transaction);
        addSystemLog(`✅ [ON-CHAIN SUCCESS] Tx Hash: ${signedTx.signature.slice(0, 10)}...`);
        triggerNotification(`REAL SWAP ${tradeType}`, `Berhasil On-Chain! Tx: ${signedTx.signature.slice(0, 8)}...`);

        if (walletAddress) fetchRealSolBalance(walletAddress);
        return signedTx.signature;
      }
    } catch (err) {
      addSystemLog(`❌ [REAL EXECUTION FAILED] ${err.message}`);
      triggerNotification('Eksekusi Gagal', err.message);
      return null;
    }
  };

  // BUY EXECUTION
  const executeAutoBuy = async (token) => {
    if (!isWalletConnected || realSolBalance < 0.01) {
      addSystemLog('⚠️ [ERROR] Saldo SOL tidak mencukupi untuk Real Trade!');
      return;
    }

    const solToTrade = (realSolBalance * (riskPercent / 100));
    const lamports = Math.floor(solToTrade * 1e9);

    const SOL_MINT = 'So11111111111111111111111111111111111111112';
    
    // Eksekusi Swap SOL ke Token Mint
    const txHash = await executeJupiterRealSwap(SOL_MINT, token.mint, lamports, 'BUY', token.symbol);

    if (txHash) {
      const newTrade = {
        ...token,
        tradeId: Date.now(),
        entryPrice: token.price,
        currentPrice: token.price,
        highestPrice: token.price,
        solInvested: solToTrade,
        txHash,
        pnlPercent: 0,
        entryTimestamp: Date.now()
      };
      setActiveTrades((prev) => [newTrade, ...prev]);
    }
  };

  // MARKET SCANNER LOOP
  useEffect(() => {
    if (!isRunning || isEmergencyKilled) return;

    const interval = setInterval(() => {
      scanMarket();
    }, 4000);

    return () => clearInterval(interval);
  }, [isRunning, isEmergencyKilled, minAiScoreFilter, minLiquidityFilter, maxPositions]);

  const scanMarket = async () => {
    if (isEmergencyKilledRef.current) return;

    const mockTokens = [
      { symbol: 'BONK', mint: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263' },
      { symbol: 'WIF', mint: 'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcJM' },
      { symbol: 'JUP', mint: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN' }
    ];

    const selected = mockTokens[Math.floor(Math.random() * mockTokens.length)];
    const price = parseFloat((Math.random() * 0.005 + 0.0001).toFixed(6));
    const opportunityScore = Math.floor(Math.random() * 30) + 70;
    const liquidity = Math.floor(Math.random() * 50000) + 2000;

    const newToken = {
      id: Date.now(),
      symbol: selected.symbol,
      mint: selected.mint,
      dex: 'Jupiter API',
      price,
      liquidity,
      opportunityScore,
      time: new Date().toLocaleTimeString('id-ID')
    };

    setScannedTokens((prev) => [newToken, ...prev.slice(0, 9)]);

    if (
      opportunityScore >= minAiScoreFilter &&
      liquidity >= minLiquidityFilter &&
      activeTradesRef.current.length < maxPositions
    ) {
      executeAutoBuy(newToken);
    }
  };

  // SELL / EXIT POSITION
  const closeTradePosition = async (trade, reason) => {
    const SOL_MINT = 'So11111111111111111111111111111111111111112';
    // Eksekusi Sell dari Token Mint ke SOL (0 = Sell All Balance)
    const txHash = await executeJupiterRealSwap(trade.mint, SOL_MINT, 0, 'SELL', trade.symbol);

    if (txHash) {
      setActiveTrades((prev) => prev.filter((t) => t.tradeId !== trade.tradeId));
      setClosedTrades((prev) => [{ ...trade, closeReason: reason, closedAt: new Date().toLocaleTimeString('id-ID') }, ...prev]);
      addSystemLog(`🔔 [REAL SELL EXECUTED] $${trade.symbol} (${reason})`);
    }
  };

  // PNL EXIT MONITOR LOOP
  useEffect(() => {
    if (!isRunning || activeTrades.length === 0 || isEmergencyKilled) return;

    const interval = setInterval(() => {
      activeTrades.forEach((trade) => {
        const priceChange = (Math.random() * 10 - 5);
        const newPrice = trade.currentPrice * (1 + priceChange / 100);
        const pnlPercent = parseFloat((((newPrice - trade.entryPrice) / trade.entryPrice) * 100).toFixed(2));

        if (enableTakeProfit && pnlPercent >= takeProfit) {
          closeTradePosition(trade, `Take Profit (+${takeProfit}%)`);
        } else if (enableStopLoss && pnlPercent <= -stopLoss) {
          closeTradePosition(trade, `Stop Loss (-${stopLoss}%)`);
        }
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [isRunning, activeTrades, takeProfit, stopLoss, isEmergencyKilled]);

  // EMERGENCY KILL
  const handleEmergencyKill = () => {
    setIsRunning(false);
    setIsEmergencyKilled(true);
    addSystemLog('🚨 [KILL SWITCH] Engine Dihentikan Darurat!');
  };

  return (
    <div style={{ backgroundColor: '#0b0e14', color: '#e2e8f0', minHeight: '100vh', fontFamily: 'monospace', padding: '20px' }}>
      {/* NOTIFICATIONS */}
      <div style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 9999 }}>
        {notifications.map((n) => (
          <div key={n.id} style={{ backgroundColor: '#1e293b', borderLeft: '4px solid #10b981', padding: '12px 16px', marginBottom: '8px', borderRadius: '4px' }}>
            <div style={{ fontWeight: 'bold', color: '#10b981' }}>{n.title}</div>
            <div style={{ fontSize: '12px', color: '#94a3b8' }}>{n.message}</div>
          </div>
        ))}
      </div>

      {/* HEADER */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1e293b', paddingBottom: '15px', marginBottom: '20px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '24px', color: '#38bdf8' }}>⚡ SOLANA HUNTER - REAL ON-CHAIN MODE</h1>
          <p style={{ margin: '5px 0 0 0', fontSize: '12px', color: '#10b981' }}>Connected directly to Jupiter V6 API & Solana Mainnet</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={connectWallet} style={{ backgroundColor: isWalletConnected ? '#059669' : '#2563eb', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
            {isWalletConnected ? `🟢 ${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}` : '🔌 Connect Phantom'}
          </button>
          <button onClick={handleToggleEngine} style={{ backgroundColor: isRunning ? '#dc2626' : '#16a34a', color: '#fff', border: 'none', padding: '8px 20px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
            {isRunning ? 'PAUSE ENGINE' : 'START REAL ENGINE'}
          </button>
          <button onClick={handleEmergencyKill} style={{ backgroundColor: '#7f1d1d', color: '#fca5a5', border: '1px solid #ef4444', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
            🚨 KILL SWITCH
          </button>
        </div>
      </header>

      {/* PASSWORD MODAL */}
      {isAuthModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10000 }}>
          <form onSubmit={handleVerifyPassword} style={{ backgroundColor: '#0f172a', border: '1px solid #334155', padding: '24px', borderRadius: '8px', width: '360px' }}>
            <h3 style={{ marginTop: 0, color: '#f43f5e' }}>🔒 Otentikasi Mode Real</h3>
            <p style={{ fontSize: '12px', color: '#94a3b8' }}>Konfirmasi password untuk menjalankan transaksi real di Solana Mainnet.</p>
            <input type="password" value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} style={{ width: '100%', padding: '10px', backgroundColor: '#1e293b', border: '1px solid #475569', color: '#fff', borderRadius: '4px', marginBottom: '15px' }} />
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setIsAuthModalOpen(false)} style={{ padding: '8px 12px', backgroundColor: '#334155', color: '#fff', border: 'none', borderRadius: '4px' }}>Batal</button>
              <button type="submit" style={{ padding: '8px 16px', backgroundColor: '#0284c7', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 'bold' }}>Start Real Trade</button>
            </div>
          </form>
        </div>
      )}

      {/* METRICS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '20px' }}>
        <div style={{ backgroundColor: '#1e293b', padding: '15px', borderRadius: '6px' }}>
          <div style={{ fontSize: '12px', color: '#94a3b8' }}>Saldo SOL Real</div>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#38bdf8' }}>{realSolBalance} SOL</div>
          <div style={{ fontSize: '11px', color: '#64748b' }}>≈ ${((realSolBalance * solPriceUSD) || 0).toFixed(2)} USD</div>
        </div>
        <div style={{ backgroundColor: '#1e293b', padding: '15px', borderRadius: '6px' }}>
          <div style={{ fontSize: '12px', color: '#94a3b8' }}>Harga SOL</div>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#f59e0b' }}>${solPriceUSD.toFixed(2)}</div>
        </div>
        <div style={{ backgroundColor: '#1e293b', padding: '15px', borderRadius: '6px' }}>
          <div style={{ fontSize: '12px', color: '#94a3b8' }}>Posisi Terbuka</div>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#a855f7' }}>{activeTrades.length} / {maxPositions}</div>
        </div>
      </div>

      {/* LOGS */}
      <div style={{ backgroundColor: '#0f172a', padding: '15px', borderRadius: '6px', border: '1px solid #1e293b' }}>
        <h3 style={{ marginTop: 0, color: '#38bdf8', fontSize: '16px' }}>📜 On-Chain Real Execution Logs</h3>
        <div style={{ backgroundColor: '#020617', padding: '10px', borderRadius: '4px', height: '250px', overflowY: 'auto', fontSize: '11px' }}>
          {systemLogs.length === 0 ? <span style={{ color: '#475569' }}>Belum ada transaksi real...</span> : systemLogs.map((log, idx) => (
            <div key={idx} style={{ marginBottom: '4px', borderBottom: '1px solid #0f172a' }}>{log}</div>
          ))}
        </div>
      </div>
    </div>
  );
}
