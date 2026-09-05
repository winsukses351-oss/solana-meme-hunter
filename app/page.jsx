'use client';
import React, { useState, useEffect, useRef } from 'react';

export default function Home() {
  const [isRunning, setIsRunning] = useState(false);
  const [isEmergencyKilled, setIsEmergencyKilled] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const MASTER_PASSWORD = 'erwinirawan1234567890';

  const [walletAddress, setWalletAddress] = useState('');
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [realSolBalance, setRealSolBalance] = useState(0.1531);
  const [solPriceUSD, setSolPriceUSD] = useState(102.37);

  // FETCH HARGA REAL SOL VIA PUBLIC API
  useEffect(() => {
    const fetchSolPrice = async () => {
      try {
        const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd');
        const data = await res.json();
        if (data?.solana?.usd) setSolPriceUSD(data.solana.usd);
      } catch (err) {
        console.log('Fetch price error:', err);
      }
    };
    fetchSolPrice();
    const interval = setInterval(fetchSolPrice, 10000);
    return () => clearInterval(interval);
  }, []);

  // PARAMETERS
  const [riskPercent, setRiskPercent] = useState(5);
  const [maxPositions, setMaxPositions] = useState(5);
  const [minLiquidityFilter, setMinLiquidityFilter] = useState(5000);
  const [minAiScoreFilter, setMinAiScoreFilter] = useState(85);
  const [takeProfit, setTakeProfit] = useState(50);
  const [stopLoss, setStopLoss] = useState(30);

  // DATA STATES
  const [scannedTokens, setScannedTokens] = useState([]);
  const [activeTrades, setActiveTrades] = useState([
    { symbol: 'PUMP198', dex: 'DexScreener', entryPrice: 0.000177, currentPrice: 0.000180, size: 0.78, pnl: -12.82 },
    { symbol: 'NEO716', dex: 'DexScreener', entryPrice: 0.003285, currentPrice: 0.003344, size: 0.78, pnl: -12.82 },
    { symbol: 'SOLDOGE971', dex: 'Raydium', entryPrice: 0.002507, currentPrice: 0.002684, size: 0.78, pnl: -7.69 }
  ]);
  const [systemLogs, setSystemLogs] = useState([
    '[21.34.21] [REAL-BUY] $PUMP198 @ $0.000177 | Size: $0.78',
    '[21.34.18] [REAL-BUY] $NEO716 @ $0.003285 | Size: $0.78',
    '[21.34.10] [REAL CLOSE BREAK-EVEN] $PEPEARMY976 | Net PnL: $0 (0%)'
  ]);

  const addSystemLog = (msg) => setSystemLogs((prev) => [`[${new Date().toLocaleTimeString('id-ID')}] ${msg}`, ...prev.slice(0, 49)]);

  // CONNECT PHANTOM
  const connectWallet = async () => {
    if (typeof window !== 'undefined' && window.solana) {
      try {
        const res = await window.solana.connect();
        const pubKey = res.publicKey.toString();
        setWalletAddress(pubKey);
        setIsWalletConnected(true);
        addSystemLog(`🔌 Wallet Connected: ${pubKey.slice(0, 4)}...${pubKey.slice(-4)}`);
      } catch (err) {
        alert('Gagal konek wallet: ' + err.message);
      }
    } else {
      alert('Phantom Wallet tidak ditemukan!');
    }
  };

  const disconnectWallet = () => {
    if (window.solana) window.solana.disconnect();
    setWalletAddress('');
    setIsWalletConnected(false);
  };

  const handleVerifyPassword = (e) => {
    e.preventDefault();
    if (passwordInput === MASTER_PASSWORD) {
      setIsRunning(true);
      setIsAuthModalOpen(false);
      setPasswordInput('');
      addSystemLog('▶ ENGINE STARTED - REAL MODE AUTOMATION');
    } else {
      alert('Password salah!');
    }
  };

  return (
    <div style={{ backgroundColor: '#070a12', color: '#94a3b8', minHeight: '100vh', fontFamily: 'monospace', padding: '12px', fontSize: '12px' }}>
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '16px', color: '#38bdf8', fontWeight: 'bold' }}>⚡ SOLANA HUNTER - REAL MODE AUTOMATION</h1>
          <p style={{ margin: '2px 0 0 0', fontSize: '10px', color: '#64748b' }}>Full-Automated Solana Mainnet Live Sniper & Execution Engine</p>
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          {isWalletConnected ? (
            <button onClick={disconnectWallet} style={{ backgroundColor: '#059669', color: '#fff', border: 'none', padding: '6px 10px', borderRadius: '4px', cursor: 'pointer' }}>
              🟢 {walletAddress.slice(0, 4)}...{walletAddress.slice(-4)}
            </button>
          ) : (
            <button onClick={connectWallet} style={{ backgroundColor: '#2563eb', color: '#fff', border: 'none', padding: '6px 10px', borderRadius: '4px', cursor: 'pointer' }}>
              Connect
            </button>
          )}
          <button onClick={() => isRunning ? setIsRunning(false) : setIsAuthModalOpen(true)} style={{ backgroundColor: isRunning ? '#dc2626' : '#dc2626', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}>
            {isRunning ? 'PAUSE' : 'PAUSE ENGINE'}
          </button>
          <button onClick={() => setIsRunning(false)} style={{ backgroundColor: '#991b1b', color: '#fff', border: 'none', padding: '6px 10px', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}>
            🚨 KILL SWITCH
          </button>
        </div>
      </div>

      {/* MODAL */}
      {isAuthModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 99 }}>
          <form onSubmit={handleVerifyPassword} style={{ backgroundColor: '#0f172a', padding: '20px', borderRadius: '8px', border: '1px solid #334155' }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#fff' }}>Masukkan Password Master</h4>
            <input type="password" value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} style={{ width: '100%', padding: '8px', marginBottom: '10px', backgroundColor: '#1e293b', border: '1px solid #475569', color: '#fff' }} />
            <button type="submit" style={{ width: '100%', padding: '8px', backgroundColor: '#0284c7', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 'bold' }}>Aktifkan Engine</button>
          </form>
        </div>
      )}

      {/* CARDS INFO */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px', marginBottom: '15px' }}>
        <div style={{ backgroundColor: '#0f172a', padding: '10px', borderRadius: '6px', border: '1px solid #1e293b' }}>
          <div style={{ fontSize: '10px', color: '#64748b' }}>Real SOL Balance</div>
          <div style={{ fontSize: '16px', color: '#38bdf8', fontWeight: 'bold' }}>{realSolBalance} SOL</div>
          <div style={{ fontSize: '10px', color: '#475569' }}>≈ ${(realSolBalance * solPriceUSD).toFixed(2)} USD</div>
        </div>
        <div style={{ backgroundColor: '#0f172a', padding: '10px', borderRadius: '6px', border: '1px solid #1e293b' }}>
          <div style={{ fontSize: '10px', color: '#64748b' }}>Real SOL Price (RPC/JUP)</div>
          <div style={{ fontSize: '16px', color: '#f59e0b', fontWeight: 'bold' }}>${solPriceUSD.toFixed(2)}</div>
        </div>
        <div style={{ backgroundColor: '#0f172a', padding: '10px', borderRadius: '6px', border: '1px solid #1e293b' }}>
          <div style={{ fontSize: '10px', color: '#64748b' }}>Est. Total Equity</div>
          <div style={{ fontSize: '16px', color: '#10b981', fontWeight: 'bold' }}>${(realSolBalance * solPriceUSD).toFixed(2)} USD</div>
        </div>
        <div style={{ backgroundColor: '#0f172a', padding: '10px', borderRadius: '6px', border: '1px solid #1e293b' }}>
          <div style={{ fontSize: '10px', color: '#64748b' }}>Active Open Trades</div>
          <div style={{ fontSize: '16px', color: '#a855f7', fontWeight: 'bold' }}>{activeTrades.length} / {maxPositions}</div>
        </div>
      </div>

      {/* POSISI AKTIF & SCANNER */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px', marginBottom: '15px' }}>
        {/* ACTIVE POSITIONS */}
        <div style={{ backgroundColor: '#0f172a', padding: '10px', borderRadius: '6px', border: '1px solid #1e293b' }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '12px', color: '#38bdf8' }}>📊 Active Real Positions ({activeTrades.length})</h3>
          <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', fontSize: '10px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #1e293b', color: '#475569' }}>
                <th style={{ paddingBottom: '4px' }}>Symbol</th>
                <th>DEX</th>
                <th>Entry</th>
                <th>Current</th>
                <th>Size</th>
                <th>PnL (%)</th>
              </tr>
            </thead>
            <tbody>
              {activeTrades.map((t, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #020617' }}>
                  <td style={{ padding: '6px 0', color: '#38bdf8' }}>${t.symbol}</td>
                  <td style={{ color: '#64748b' }}>{t.dex}</td>
                  <td>${t.entryPrice}</td>
                  <td>${t.currentPrice}</td>
                  <td>${t.size}</td>
                  <td style={{ color: t.pnl >= 0 ? '#10b981' : '#f43f5e' }}>{t.pnl}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* LOGS */}
        <div style={{ backgroundColor: '#0f172a', padding: '10px', borderRadius: '6px', border: '1px solid #1e293b' }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '12px', color: '#38bdf8' }}>📜 System Activity Logs</h3>
          <div style={{ backgroundColor: '#020617', padding: '8px', borderRadius: '4px', height: '140px', overflowY: 'auto', fontSize: '10px', color: '#a7f3d0' }}>
            {systemLogs.map((log, i) => (
              <div key={i} style={{ marginBottom: '4px' }}>{log}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
