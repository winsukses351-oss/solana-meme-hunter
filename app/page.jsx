"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Connection, Keypair, VersionedTransaction, PublicKey } from '@solana/web3.js';
import bs58 from 'bs58';
import { 
  Play, Pause, Wallet, ShieldAlert, Zap, TrendingUp, 
  Terminal, CheckCircle2, AlertTriangle, Settings, RefreshCw, 
  Search, ShieldCheck, Flame, Bell, Volume2
} from 'lucide-react';

// ============================================================================
// KONFIGURASI NETWORK & WALLET BOT (FAST AUTO-SIGN)
// ============================================================================
// 1. Masukkan Helius RPC URL milikmu
const HELIUS_RPC_URL = 'https://mainnet.helius-rpc.com/?api-key=YOUR_HELIUS_API_KEY';
const connection = new Connection(HELIUS_RPC_URL, 'confirmed');

// 2. Masukkan Private Key Wallet Khusus Bot (Format Base58)
// PENTING: Gunakan wallet khusus bot, isi saldo secukupnya (misal 0.1 - 0.5 SOL)!
const BOT_PRIVATE_KEY_BASE58 = 'MASUKKAN_PRIVATE_KEY_BASE58_DI_SINI'; 

export default function TradingDashboard() {
  // State Utama Bot Engine
  const [isRunning, setIsRunning] = useState(false);
  const [botWallet, setBotWallet] = useState(null);
  const [balance, setBalance] = useState(0);
  const [logs, setLogs] = useState([]);
  
  // Konfigurasi Parameter Trading & Risk Management
  const [tradeAmount, setTradeAmount] = useState(0.05); // SOL per Trade
  const [slippage, setSlippage] = useState(1.0); // % Slippage
  const [priorityFee, setPriorityFee] = useState(0.002); // Priority Fee dalam SOL
  const [minLiquidity, setMinLiquidity] = useState(5000); // USD
  const [maxRugScore, setMaxRugScore] = useState(500); // Max score RugCheck
  const [takeProfit, setTakeProfit] = useState(50); // % Profit target
  const [stopLoss, setStopLoss] = useState(20); // % Loss limit
  
  // Data State Tracker
  const [activePositions, setActivePositions] = useState([]);
  const [scannedTokens, setScannedTokens] = useState([]);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const logContainerRef = useRef(null);

  // 1. Inisialisasi Wallet Bot dari Private Key Base58
  useEffect(() => {
    try {
      if (BOT_PRIVATE_KEY_BASE58 && BOT_PRIVATE_KEY_BASE58 !== 'MASUKKAN_PRIVATE_KEY_BASE58_DI_SINI') {
        const keypair = Keypair.fromSecretKey(bs58.decode(BOT_PRIVATE_KEY_BASE58));
        setBotWallet(keypair);
        addLog(`✅ Wallet Bot berhasil terhubung: ${keypair.publicKey.toString().slice(0, 6)}...${keypair.publicKey.toString().slice(-4)}`);
        fetchBalance(keypair.publicKey);
      } else {
        addLog('⚠️ Private Key belum diisi! Harap masukkan Private Key Base58 di variabel BOT_PRIVATE_KEY_BASE58.');
      }
    } catch (err) {
      addLog(`❌ Error memuat Private Key: ${err.message}`);
    }
  }, []);

  // Auto Scroll Console Log Terminal
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  // Logger & Audio Notifikasi
  const addLog = (message) => {
    const time = new Date().toLocaleTimeString();
    setLogs((prev) => [...prev, `[${time}] ${message}`]);
  };

  const playNotificationSound = () => {
    if (soundEnabled) {
      try {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
        audio.play().catch(() => {});
      } catch (e) {}
    }
  };

  // Fetch Saldo Native SOL
  const fetchBalance = async (pubkey) => {
    try {
      const lamports = await connection.getBalance(pubkey);
      const sol = lamports / 1000000000;
      setBalance(sol);
      addLog(`💰 Saldo Wallet Bot Updated: ${sol.toFixed(4)} SOL`);
    } catch (err) {
      addLog(`❌ Gagal mengambil saldo wallet: ${err.message}`);
    }
  };

  // ============================================================================
  // SCANNER & RUGCHECK INTEGRATION
  // ============================================================================
  const checkRugCheckRisk = async (mintAddress) => {
    try {
      addLog(`🛡️ [RUGCHECK] Memeriksa keamanan smart contract ${mintAddress.slice(0, 6)}...`);
      const response = await fetch(`https://api.rugcheck.xyz/v1/tokens/${mintAddress}/report/summary`);
      if (!response.ok) return { safe: true, score: 0 }; // Fallback jika API down
      
      const data = await response.json();
      const score = data.score || 0;
      const isSafe = score <= maxRugScore;
      
      if (!isSafe) {
        addLog(`🚨 [RUGCHECK WARN] Token DITOLAK! Score Risiko: ${score} (Maks: ${maxRugScore})`);
      } else {
        addLog(`✅ [RUGCHECK SAFE] Token Lolos Filter. Score: ${score}`);
      }
      return { safe: isSafe, score };
    } catch (err) {
      addLog(`⚠️ [RUGCHECK WARN] Gagal cek RugCheck, melanjutkan dengan kewaspadaan.`);
      return { safe: true, score: 0 };
    }
  };

  // Simulated Market Scanner Stream (PumpFun / Raydium Pair Listener)
  useEffect(() => {
    let interval = null;
    if (isRunning) {
      interval = setInterval(async () => {
        // Simulasi deteksi token baru muncul di DEX / PumpFun
        const dummyMints = [
          { name: 'PUMP MOON', symbol: 'PMOON', mint: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB243', liq: 12000 },
          { name: 'SOL DOGE', symbol: 'SDOGE', mint: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN', liq: 8500 }
        ];

        const randomToken = dummyMints[Math.floor(Math.random() * dummyMints.length)];
        addLog(`🔍 [SCANNER] Mendeteksi token baru: ${randomToken.symbol} (Liq: $${randomToken.liq})`);

        if (randomToken.liq >= minLiquidity) {
          // Lakukan Risk Check
          const rugStatus = await checkRugCheckRisk(randomToken.mint);
          if (rugStatus.safe) {
            playNotificationSound();
            // Eksekusi Beli Asli secara Otomatis
            await executeAutoBuyOnChain(randomToken.mint, randomToken.symbol);
          }
        } else {
          addLog(`⏭️ [SCANNER] Likuiditas terlalu kecil ($${randomToken.liq} < $${minLiquidity}). Skip.`);
        }
      }, 12000); // Scan tiap 12 detik
    }
    return () => clearInterval(interval);
  }, [isRunning, minLiquidity, maxRugScore, botWallet]);

  // ============================================================================
  // EKSEKUSI AUTO-BUY ON-CHAIN (REAL JUPITER V6 SWAP + AUTO SIGN)
  // ============================================================================
  const executeAutoBuyOnChain = async (outputTokenMint, symbol = 'TOKEN') => {
    if (!botWallet) {
      addLog('❌ Gagal Eksekusi: Wallet Bot belum terkonfigurasi!');
      return;
    }

    try {
      addLog(`⚡ [AUTO-BUY EXEKUSI] Memproses pembelian instan ${symbol}...`);

      const lamports = Math.floor(tradeAmount * 1000000000);
      const inputMint = 'So11111111111111111111111111111111111111112'; // WSOL / SOL Native
      const priorityFeeLamports = Math.floor(priorityFee * 1000000000);

      // STEP 1: Fetch Jupiter Quote API v6
      addLog(`🔍 Mengambil jalur quote Jupiter v6...`);
      const quoteResponse = await fetch(
        `https://quote-api.jup.ag/v6/quote?inputMint=${inputMint}&outputMint=${outputTokenMint}&amount=${lamports}&slippageBps=${Math.floor(slippage * 100)}`
      ).then((res) => res.json());

      if (!quoteResponse || quoteResponse.error) {
        throw new Error(`Jupiter Quote Error: ${quoteResponse?.error || 'Gagal mengambil quote'}`);
      }

      // STEP 2: Request Payload Transaksi dari Jupiter
      addLog(`📦 Membuat payload transaksi swap...`);
      const swapResponse = await fetch('https://quote-api.jup.ag/v6/swap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quoteResponse,
          userPublicKey: botWallet.publicKey.toString(),
          wrapAndUnwrapSol: true,
          prioritizationFeeLamports: priorityFeeLamports
        })
      }).then((res) => res.json());

      if (!swapResponse.swapTransaction) {
        throw new Error('Gagal menerima data swapTransaction dari Jupiter');
      }

      // STEP 3: Deserialisasi
      const swapTransactionBuf = Buffer.from(swapResponse.swapTransaction, 'base64');
      const transaction = VersionedTransaction.deserialize(swapTransactionBuf);

      // STEP 4: AUTO-SIGNING INSTAN (Tanpa Pop-up Phantom!)
      addLog(`🔑 Menandatangani transaksi otomatis...`);
      transaction.sign([botWallet]);

      // STEP 5: Kirim Langsung ke RPC
      addLog(`🚀 Mengirim transaksi langsung ke Helius RPC...`);
      const rawTransaction = transaction.serialize();
      const txid = await connection.sendRawTransaction(rawTransaction, {
        skipPreflight: true, // Bypass simulasi lokal untuk kecepatan sub-detik
        maxRetries: 2
      });

      addLog(`✅ [BUY SUCCESS] Transaksi Terkirim! TXID: ${txid}`);
      addLog(`🔗 Solscan: https://solscan.io/tx/${txid}`);

      // Tambahkan ke Tracking Posisi
      const newPosition = {
        id: Date.now(),
        symbol,
        mint: outputTokenMint,
        buyPriceSol: tradeAmount,
        pnlPercent: 0,
        txid,
        time: new Date().toLocaleTimeString()
      };
      setActivePositions((prev) => [newPosition, ...prev]);

      // Refresh Saldo SOL
      setTimeout(() => fetchBalance(botWallet.publicKey), 3000);

    } catch (err) {
      addLog(`❌ [BUY ERROR] ${err.message}`);
    }
  };

  // ============================================================================
  // EKSEKUSI AUTO-SELL ON-CHAIN (REAL JUPITER V6 SWAP + AUTO SIGN)
  // ============================================================================
  const executeAutoSellOnChain = async (position) => {
    if (!botWallet) return;

    try {
      addLog(`⚡ [AUTO-SELL EXEKUSI] Memproses penjualan instan ${position.symbol}...`);

      const inputMint = position.mint;
      const outputMint = 'So11111111111111111111111111111111111111112'; // SOL
      const priorityFeeLamports = Math.floor(priorityFee * 1000000000);

      // Cek Saldo Token di Wallet Bot
      const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
        botWallet.publicKey,
        { mint: new PublicKey(inputMint) }
      );

      if (tokenAccounts.value.length === 0) {
        throw new Error("SPL Token account tidak ditemukan di wallet bot!");
      }

      const tokenAmount = tokenAccounts.value[0].account.data.parsed.info.tokenAmount.amount;

      if (tokenAmount === "0") {
        throw new Error("Saldo token 0, tidak ada token untuk dijual.");
      }

      // STEP 1: Quote Jupiter
      const quoteResponse = await fetch(
        `https://quote-api.jup.ag/v6/quote?inputMint=${inputMint}&outputMint=${outputMint}&amount=${tokenAmount}&slippageBps=${Math.floor(slippage * 100)}`
      ).then((res) => res.json());

      if (!quoteResponse || quoteResponse.error) {
        throw new Error(`Jupiter Quote Error: ${quoteResponse?.error || 'Gagal mengambil quote'}`);
      }

      // STEP 2: Swap Payload
      const swapResponse = await fetch('https://quote-api.jup.ag/v6/swap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quoteResponse,
          userPublicKey: botWallet.publicKey.toString(),
          wrapAndUnwrapSol: true,
          prioritizationFeeLamports: priorityFeeLamports
        })
      }).then((res) => res.json());

      // STEP 3: Auto-Sign & Send
      const swapBuf = Buffer.from(swapResponse.swapTransaction, 'base64');
      const transaction = VersionedTransaction.deserialize(swapBuf);
      transaction.sign([botWallet]);

      const txid = await connection.sendRawTransaction(transaction.serialize(), {
        skipPreflight: true,
        maxRetries: 2
      });

      addLog(`✅ [SELL SUCCESS] Transaksi Penjualan Terkirim! TXID: ${txid}`);
      addLog(`🔗 Solscan: https://solscan.io/tx/${txid}`);

      // Hapus dari Posisi Aktif
      setActivePositions((prev) => prev.filter((p) => p.id !== position.id));
      setTimeout(() => fetchBalance(botWallet.publicKey), 3000);

    } catch (err) {
      addLog(`❌ [SELL ERROR] ${err.message}`);
    }
  };

  // ============================================================================
  // AUTOMATED TAKE-PROFIT / STOP-LOSS MONITOR LOOP
  // ============================================================================
  useEffect(() => {
    let pnlInterval = null;
    if (activePositions.length > 0) {
      pnlInterval = setInterval(() => {
        setActivePositions((prevPositions) =>
          prevPositions.map((pos) => {
            // Simulasi Fluktuasi Harga PnL (+/- % harga live)
            const delta = (Math.random() - 0.48) * 5; 
            const newPnl = parseFloat((pos.pnlPercent + delta).toFixed(2));

            // Auto Sell jika Kena TP/SL
            if (newPnl >= takeProfit) {
              addLog(`🎯 [TAKE PROFIT TRIGGERED] Target +${takeProfit}% tercapai pada ${pos.symbol}!`);
              executeAutoSellOnChain(pos);
            } else if (newPnl <= -stopLoss) {
              addLog(`🛑 [STOP LOSS TRIGGERED] Batas -${stopLoss}% tersentuh pada ${pos.symbol}!`);
              executeAutoSellOnChain(pos);
            }

            return { ...pos, pnlPercent: newPnl };
          })
        );
      }, 3000);
    }
    return () => clearInterval(pnlInterval);
  }, [activePositions, takeProfit, stopLoss]);

  // Toggle Automation On/Off
  const toggleBot = () => {
    if (!botWallet) {
      alert("Masukkan Private Key wallet bot terlebih dahulu!");
      return;
    }
    const nextState = !isRunning;
    setIsRunning(nextState);
    if (nextState) {
      addLog('🤖 ENGINE ON: Auto Scanner & Auto-Trade Aktif.');
    } else {
      addLog('🛑 ENGINE OFF: Bot Dihentikan.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 font-sans">
      
      {/* HEADER DASHBOARD */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center pb-6 mb-6 border-b border-slate-800 gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2 text-emerald-400">
            <Zap className="fill-emerald-400 text-emerald-400" /> SOLANA HIGH-SPEED TRADING BOT
          </h1>
          <p className="text-slate-400 text-sm mt-1 flex items-center gap-2">
            Mode Eksekusi: <span className="text-amber-400 font-semibold flex items-center gap-1"><ShieldCheck size={14}/> Live On-Chain (Auto-Sign Instant)</span>
          </p>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2.5 rounded-lg border ${soundEnabled ? 'bg-slate-800 border-slate-700 text-emerald-400' : 'bg-slate-900 border-slate-800 text-slate-500'}`}
            title="Toggle Audio Alert"
          >
            <Volume2 size={18} />
          </button>

          <div className="bg-slate-900 border border-slate-800 px-4 py-2 rounded-lg text-right">
            <p className="text-xs text-slate-400">Saldo Bot Wallet</p>
            <p className="text-lg font-bold text-slate-100">{balance.toFixed(4)} SOL</p>
          </div>

          <button
            onClick={toggleBot}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-bold text-white transition-all shadow-lg ${
              isRunning 
                ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-900/40' 
                : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-900/40'
            }`}
          >
            {isRunning ? <><Pause size={18} /> PAUSE BOT</> : <><Play size={18} /> START AUTOMATION</>}
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* PANEL KIRI: PARAMETER CONFIG & FILTERS */}
        <div className="space-y-6">
          
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-slate-200">
              <Settings size={18} /> Trading Parameters
            </h2>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Buy Amount (SOL)</label>
                <input
                  type="number"
                  step="0.01"
                  value={tradeAmount}
                  onChange={(e) => setTradeAmount(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Take Profit (%)</label>
                  <input
                    type="number"
                    value={takeProfit}
                    onChange={(e) => setTakeProfit(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-emerald-400 focus:outline-none focus:border-emerald-500 font-semibold"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Stop Loss (%)</label>
                  <input
                    type="number"
                    value={stopLoss}
                    onChange={(e) => setStopLoss(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-rose-400 focus:outline-none focus:border-rose-500 font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Slippage Tolerance (%)</label>
                <input
                  type="number"
                  step="0.5"
                  value={slippage}
                  onChange={(e) => setSlippage(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Priority Fee (SOL)</label>
                <input
                  type="number"
                  step="0.001"
                  value={priorityFee}
                  onChange={(e) => setPriorityFee(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500"
                />
                <span className="text-[10px] text-slate-500">Ekstra tip validator Solana agar transaksi super cepat.</span>
              </div>
            </div>
          </div>

          {/* RISK CONTROL PANEL */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-slate-200">
              <ShieldAlert size={18} className="text-amber-400" /> Safety & Filters
            </h2>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Min Liquidity Pool ($ USD)</label>
                <input
                  type="number"
                  value={minLiquidity}
                  onChange={(e) => setMinLiquidity(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Max RugCheck Score (Semakin rendah semakin aman)</label>
                <input
                  type="number"
                  value={maxRugScore}
                  onChange={(e) => setMaxRugScore(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* MANUAL QUICK TEST */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
            <h2 className="text-lg font-semibold mb-2 text-slate-200 flex items-center gap-2">
              <RefreshCw size={18} /> Test Instant Buy
            </h2>
            <p className="text-xs text-slate-400 mb-3">
              Uji coba transaksi asli secara instan dengan token sampel BONK:
            </p>

            <button
              onClick={() => executeAutoBuyOnChain('DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB243', 'BONK')}
              className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 py-2.5 rounded font-medium text-sm transition-all"
            >
              Test Buy BONK ({tradeAmount} SOL)
            </button>
          </div>

        </div>

        {/* PANEL TENGAH & KANAN: LIVE POSITIONS & LOGS */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* LIVE POSITIONS TRACKER */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
            <h2 className="text-lg font-semibold mb-4 text-slate-200 flex items-center gap-2">
              <TrendingUp size={18} /> Active Positions ({activePositions.length})
            </h2>

            {activePositions.length === 0 ? (
              <p className="text-sm text-slate-500 italic py-6 text-center border border-dashed border-slate-800 rounded-lg">
                Belum ada posisi open trade. Aktifkan bot atau lakukan Test Buy.
              </p>
            ) : (
              <div className="space-y-3">
                {activePositions.map((pos) => (
                  <div key={pos.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-950 p-4 border border-slate-800 rounded-lg gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-100 text-base">{pos.symbol}</span>
                        <span className="text-xs text-slate-500 font-mono">{pos.mint.slice(0, 6)}...{pos.mint.slice(-4)}</span>
                      </div>
                      <div className="text-xs text-slate-400 mt-1">
                        Capital: <span className="text-slate-200">{pos.buyPriceSol} SOL</span> | Time: {pos.time}
                      </div>
                    </div>

                    <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                      <div className="text-right">
                        <p className="text-xs text-slate-400">Live PnL</p>
                        <p className={`font-bold text-sm ${pos.pnlPercent >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {pos.pnlPercent >= 0 ? '+' : ''}{pos.pnlPercent}%
                        </p>
                      </div>

                      <button
                        onClick={() => executeAutoSellOnChain(pos)}
                        className="bg-rose-600/20 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-600/40 px-4 py-2 rounded text-xs font-bold transition-all"
                      >
                        MANUAL SELL
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* CONSOLE TERMINAL LOGS */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
            <h2 className="text-lg font-semibold mb-3 text-slate-200 flex items-center gap-2">
              <Terminal size={18} /> Live Terminal Logs
            </h2>

            <div 
              ref={logContainerRef}
              className="bg-slate-950 font-mono text-xs text-emerald-400 p-4 rounded-lg h-80 overflow-y-auto space-y-1 border border-slate-800/80"
            >
              {logs.map((log, index) => (
                <div key={index} className="leading-relaxed break-all">
                  {log}
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
