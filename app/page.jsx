"use client";

import { useState, useEffect } from 'react';
import { calculateOpportunityScore, fetchLatestSolanaTokens } from '../lib/hunterEngine';
import { Play, Pause, Activity, Cpu } from 'lucide-react';

export default function Home() {
  const [isRunning, setIsRunning] = useState(false);
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [tokens, setTokens] = useState([]);
  const [balance, setBalance] = useState(10.0);
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    let interval = null;

    if (isRunning) {
      interval = setInterval(async () => {
        addLog("Scanning market (Pump.fun / DexScreener)...");
        const rawTokens = await fetchLatestSolanaTokens();
        
        const processed = rawTokens.map((t) => {
          const mockMetrics = {
            safetyScore: Math.floor(Math.random() * 40) + 60,
            smartMoneyScore: Math.floor(Math.random() * 50) + 50,
            momentumScore: Math.floor(Math.random() * 50) + 50,
            whaleScore: Math.floor(Math.random() * 50) + 50,
          };

          const evaluation = calculateOpportunityScore(mockMetrics);

          return {
            address: t.tokenAddress,
            url: t.url,
            icon: t.icon,
            metrics: mockMetrics,
            evaluation
          };
        });

        setTokens(processed);
      }, 5000);
    } else {
      clearInterval(interval);
    }

    return () => clearInterval(interval);
  }, [isRunning]);

  const addLog = (msg) => {
    setLogs((prev) => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev.slice(0, 19)]);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 font-mono text-sm">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 border-b border-slate-800 pb-4 mb-4">
        <div>
          <h1 className="text-lg font-bold text-emerald-400 flex items-center gap-2">
            <Cpu className="w-5 h-5" /> SOLANA HUNTER ENGINE
          </h1>
          <p className="text-[11px] text-slate-400">Browser Execution Engine (Active while tab is open)</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setIsRunning(!isRunning);
              addLog(isRunning ? "Bot Stopped." : "Bot Started 24/7 Scanning Loop...");
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-xs ${
              isRunning ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'
            }`}
          >
            {isRunning ? <><Pause className="w-4 h-4"/> PAUSE BOT</> : <><Play className="w-4 h-4"/> START BOT</>}
          </button>

          <button
            onClick={() => setIsLiveMode(!isLiveMode)}
            className={`px-3 py-2 rounded-lg text-xs font-bold border ${
              isLiveMode 
                ? 'bg-red-950/80 border-red-500 text-red-400' 
                : 'bg-amber-950/80 border-amber-500 text-amber-400'
            }`}
          >
            {isLiveMode ? 'LIVE MODE' : 'DEMO MODE'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg">
          <div className="text-slate-500 text-[10px]">CURRENT BALANCE</div>
          <div className="text-lg font-bold text-white">${balance.toFixed(2)}</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg">
          <div className="text-slate-500 text-[10px]">SCANNER STATUS</div>
          <div className={`text-lg font-bold ${isRunning ? 'text-emerald-400' : 'text-slate-500'}`}>
            {isRunning ? 'RUNNING' : 'IDLE'}
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg">
          <div className="text-slate-500 text-[10px]">MAX DRAWDOWN LIMIT</div>
          <div className="text-lg font-bold text-amber-400">20% ($2.00)</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg">
          <div className="text-slate-500 text-[10px]">AUTO-COMPOUND</div>
          <div className="text-lg font-bold text-blue-400">OFF (Fixed $10)</div>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 mb-4">
        <h2 className="text-xs font-bold text-slate-300 mb-3 flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-400"/> LIVE DETECTED OPPORTUNITIES
        </h2>
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {tokens.length === 0 ? (
            <div className="text-xs text-slate-600 text-center py-4">Tekan "START BOT" untuk mulai memindai token...</div>
          ) : (
            tokens.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center bg-slate-950 p-2 rounded border border-slate-800 text-xs">
                <div>
                  <div className="font-bold text-emerald-400">{item.address.slice(0, 8)}...</div>
                  <div className="text-[10px] text-slate-500">Safety: {item.metrics.safetyScore}/100</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-white">Score: {item.evaluation.score}</div>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded ${
                    item.evaluation.category === 'Elite' ? 'bg-emerald-500/20 text-emerald-400' :
                    item.evaluation.category === 'High Potential' ? 'bg-blue-500/20 text-blue-400' : 'bg-red-500/20 text-red-400'
                  }`}>
                    {item.evaluation.category}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-lg p-3">
        <h3 className="text-[11px] font-bold text-slate-400 mb-2">SYSTEM ACTIVITY LOGS</h3>
        <div className="bg-slate-950 p-2 rounded text-[10px] text-slate-400 font-mono h-28 overflow-y-auto space-y-1">
          {logs.map((log, i) => <div key={i}>{log}</div>)}
        </div>
      </div>
    </div>
  );
          }
              
