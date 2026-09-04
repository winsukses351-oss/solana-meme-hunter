'use client';

import React, { useState, useEffect } from 'react';
import { Play, Pause, ShieldAlert, Radar, Flame, Bot, Wallet, ExternalLink, Activity } from 'lucide-react';

export default function SolanaHunterDashboard() {
  const [isBotActive, setIsBotActive] = useState(false);
  const [logs, setLogs] = useState([]);
  const [detectedTokens, setDetectedTokens] = useState([]);
  const [stats, setStats] = useState({ scanned: 0, bought: 0, winRate: '0%' });

  // Simulation Engine for Client-Side Hunting
  useEffect(() => {
    let interval;
    if (isBotActive) {
      interval = setInterval(() => {
        const mockScore = Math.floor(Math.random() * 40) + 60;
        const newToken = {
          id: Date.now(),
          symbol: `$MEME${Math.floor(Math.random() * 900 + 100)}`,
          score: mockScore,
          liquidity: `$${(Math.random() * 15 + 2).toFixed(1)}k`,
          safety: mockScore > 80 ? 'HIGH' : 'MEDIUM',
          time: new Date().toLocaleTimeString(),
        };

        setDetectedTokens((prev) => [newToken, ...prev.slice(0, 4)]);
        setStats((prev) => ({ ...prev, scanned: prev.scanned + 1 }));
        
        setLogs((prev) => [
          `[${newToken.time}] Scanned token ${newToken.symbol} - Score: ${newToken.score}/100`,
          ...prev.slice(0, 9)
        ]);
      }, 4000);
    }
    return () => clearInterval(interval);
  }, [isBotActive]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 font-sans">
      {/* Top Navigation */}
      <header className="flex flex-col sm:flex-row justify-between items-center bg-slate-900 border border-slate-800 p-4 rounded-xl gap-4 mb-6">
        <div className="flex items-center gap-3">
          <Radar className="w-8 h-8 text-emerald-400 animate-pulse" />
          <div>
            <h1 className="text-xl font-bold tracking-wide">SOLANA HUNTER AI</h1>
            <p className="text-xs text-slate-400">24/7 Client-Side Meme Coin Engine</p>
          </div>
        </div>

        <div className="flex items-center gap-4 w-full sm:w-auto justify-end">
          <button
            onClick={() => setIsBotActive(!isBotActive)}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold text-sm transition-all ${
              isBotActive
                ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-950'
                : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-950'
            }`}
          >
            {isBotActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {isBotActive ? 'STOP BOT' : 'START HUNTING'}
          </button>
        </div>
      </header>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium">Scanned Tokens</p>
            <p className="text-2xl font-bold mt-1 text-slate-100">{stats.scanned}</p>
          </div>
          <Activity className="w-8 h-8 text-blue-500 opacity-80" />
        </div>

        <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium">Auto Trades</p>
            <p className="text-2xl font-bold mt-1 text-emerald-400">{stats.bought}</p>
          </div>
          <Bot className="w-8 h-8 text-emerald-500 opacity-80" />
        </div>

        <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium">Hunter Status</p>
            <span className={`inline-block mt-2 px-2.5 py-1 text-xs font-bold rounded-full ${
              isBotActive ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-800 text-slate-400'
            }`}>
              {isBotActive ? 'RUNNING' : 'IDLE'}
            </span>
          </div>
          <Flame className="w-8 h-8 text-amber-500 opacity-80" />
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Token Radar List */}
        <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold flex items-center gap-2 text-slate-200">
              <Radar className="w-4 h-4 text-emerald-400" /> Live Signal Feed
            </h2>
            <span className="text-xs text-slate-400">Auto Filter: High Safety</span>
          </div>

          <div className="space-y-3">
            {detectedTokens.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-slate-800 rounded-lg text-slate-500 text-sm">
                Press "START HUNTING" to begin scanning Solana liquidity pools.
              </div>
            ) : (
              detectedTokens.map((token) => (
                <div key={token.id} className="flex items-center justify-between bg-slate-950 border border-slate-800/80 p-3 rounded-lg hover:border-slate-700 transition">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-100">{token.symbol}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                        token.safety === 'HIGH' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-amber-950 text-amber-400 border border-amber-800'
                      }`}>
                        {token.safety}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">Liquidity: {token.liquidity}</p>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-xs text-slate-400">AI Score</p>
                      <p className="font-bold text-emerald-400 text-sm">{token.score}/100</p>
                    </div>
                    <button className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold flex items-center gap-1">
                      Trade <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Engine Activity Console */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold flex items-center gap-2 text-slate-200 mb-3">
              <Activity className="w-4 h-4 text-blue-400" /> Console Logs
            </h2>
            <div className="bg-slate-950 rounded-lg p-3 font-mono text-[11px] space-y-1.5 text-slate-400 h-64 overflow-y-auto border border-slate-800/50">
              {logs.length === 0 ? (
                <p className="text-slate-600">Engine offline...</p>
              ) : (
                logs.map((log, idx) => (
                  <p key={idx} className="leading-relaxed border-b border-slate-900/50 pb-1">
                    {log}
                  </p>
                ))
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
            <span>Network: Solana Mainnet</span>
            <span className="flex items-center gap-1"><ShieldAlert className="w-3 h-3 text-emerald-400" /> RPC Active</span>
          </div>
        </div>
      </div>
    </div>
  );
          }
        
