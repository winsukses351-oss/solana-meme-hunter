'use client';

import React, { useState } from 'react';

export default function DashboardClient({ initialCandidates = [], systemHealth = {} }) {
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [killSwitch, setKillSwitch] = useState(false);
  const [emergencyStop, setEmergencyStop] = useState(false);

  // Simulated System State for Phase 7A UI Visuals
  const isSafetyGateClear = !killSwitch && !emergencyStop;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-6">
      {/* Top Header & Safety Lock Indicators */}
      <header className="flex justify-between items-center pb-6 mb-6 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            SOLANA QUANT DASHBOARD
            <span className="text-xs bg-slate-800 text-slate-300 px-2.5 py-1 rounded-full border border-slate-700">
              PHASE 7A — RISK & SAFETY ACTIVE
            </span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">System Health: {systemHealth.status || 'OK'}</p>
        </div>

        {/* Global Hard Trading Lock Banner */}
        <div className="flex items-center gap-3">
          <div className="bg-red-950/80 border border-red-700/60 text-red-300 px-4 py-2 rounded-md text-sm font-mono font-semibold flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></span>
            TRADING EXECUTION: HARD BLOCKED
          </div>
        </div>
      </header>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-12 gap-6">
        {/* Navigation Sidebar */}
        <nav className="col-span-12 md:col-span-2 space-y-1">
          {[
            'Dashboard',
            'Scanner',
            'Positions',
            'Trades',
            'Risk',
            'Settings'
          ].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'bg-blue-600 text-white font-semibold'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>

        {/* Main Content View Container */}
        <main className="col-span-12 md:col-span-10 space-y-6">
          {/* Emergency Controls Section */}
          <section className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-4">
              Emergency Controls & Hard Safety Switches
            </h2>
            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => setKillSwitch(!killSwitch)}
                className={`px-4 py-2 rounded-lg font-mono text-xs font-bold transition-all ${
                  killSwitch
                    ? 'bg-red-600 text-white ring-2 ring-red-400'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                KILL SWITCH: {killSwitch ? 'ACTIVE (BLOCKING)' : 'INACTIVE'}
              </button>
              <button
                onClick={() => setEmergencyStop(!emergencyStop)}
                className={`px-4 py-2 rounded-lg font-mono text-xs font-bold transition-all ${
                  emergencyStop
                    ? 'bg-red-600 text-white ring-2 ring-red-400'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                EMERGENCY STOP: {emergencyStop ? 'ACTIVE (BLOCKING)' : 'INACTIVE'}
              </button>
            </div>
          </section>

          {/* Tab 1: Dashboard View */}
          {activeTab === 'Dashboard' && (
            <div className="space-y-6">
              {/* Account Metrics Overview */}
              <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                  <div className="text-xs text-slate-400">Account Equity</div>
                  <div className="text-xl font-mono font-bold text-white mt-1">$10,000.00</div>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                  <div className="text-xs text-slate-400">Max Position Risk Limit</div>
                  <div className="text-xl font-mono font-bold text-blue-400 mt-1">2.0% ($200)</div>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                  <div className="text-xs text-slate-400">Daily Loss Guard</div>
                  <div className="text-xl font-mono font-bold text-emerald-400 mt-1">0.0% / 5.0%</div>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                  <div className="text-xs text-slate-400">Safety Gate Status</div>
                  <div className={`text-xl font-mono font-bold mt-1 ${isSafetyGateClear ? 'text-emerald-400' : 'text-red-400'}`}>
                    {isSafetyGateClear ? 'CLEAR (ALLOW)' : 'BLOCKED'}
                  </div>
                </div>
              </section>

              {/* Live Token Scanner & Phase 6 Scoring Results */}
              <section className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-4">
                  Live Candidate Scanner & Phase 6 Score Output
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-300">
                    <thead className="bg-slate-950 text-slate-400 uppercase text-xs">
                      <tr>
                        <th className="p-3">Token</th>
                        <th className="p-3">Liquidity</th>
                        <th className="p-3">Volume 24h</th>
                        <th className="p-3">Score</th>
                        <th className="p-3">Quality</th>
                        <th className="p-3">Risk Sizing Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {initialCandidates.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="p-4 text-center text-slate-500 italic">
                            No candidate tokens active in scanner.
                          </td>
                        </tr>
                      ) : (
                        initialCandidates.map((c, i) => (
                          <tr key={i} className="hover:bg-slate-800/50">
                            <td className="p-3 font-mono font-bold">{c.symbol || 'UNKNOWN'}</td>
                            <td className="p-3 font-mono">${(c.liquidity || 0).toLocaleString()}</td>
                            <td className="p-3 font-mono">${(c.volume24h || 0).toLocaleString()}</td>
                            <td className="p-3 font-mono font-bold text-blue-400">{c.score ?? 'N/A'}</td>
                            <td className="p-3">
                              <span className="text-xs px-2 py-0.5 rounded bg-slate-800 font-semibold border border-slate-700">
                                {c.quality || 'UNCLASSIFIED'}
                              </span>
                            </td>
                            <td className="p-3 font-mono text-xs text-amber-400 font-semibold">
                              {isSafetyGateClear ? 'CALCULATED (EXECUTION BLOCKED)' : 'BLOCKED'}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          )}

          {/* Tab 2: Scanner View */}
          {activeTab === 'Scanner' && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <h2 className="text-base font-bold text-white mb-2">Live Market Scanner</h2>
              <p className="text-sm text-slate-400">Integrated DexScreener Candidate Monitoring Engine.</p>
            </div>
          )}

          {/* Tab 3: Positions View */}
          {activeTab === 'Positions' && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <h2 className="text-base font-bold text-white mb-2">Open Positions</h2>
              <p className="text-sm text-slate-400">Current open position tracking (0 Open Positions - Execution Disabled).</p>
            </div>
          )}

          {/* Tab 4: Trades View */}
          {activeTab === 'Trades' && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <h2 className="text-base font-bold text-white mb-2">Trade History</h2>
              <p className="text-sm text-slate-400">Historical trading logs (Execution Blocked - Zero Transactions).</p>
            </div>
          )}

          {/* Tab 5: Risk Management View */}
          {activeTab === 'Risk' && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
              <h2 className="text-base font-bold text-white mb-2">Phase 7A Risk Management Configuration</h2>
              <div className="grid grid-cols-2 gap-4 text-sm font-mono">
                <div className="p-3 bg-slate-950 rounded border border-slate-800">
                  <span className="text-slate-400">Max Single Position Risk:</span> 2.0%
                </div>
                <div className="p-3 bg-slate-950 rounded border border-slate-800">
                  <span className="text-slate-400">Max Total Portfolio Exposure:</span> 20.0%
                </div>
                <div className="p-3 bg-slate-950 rounded border border-slate-800">
                  <span className="text-slate-400">Max Daily Loss Limit:</span> 5.0%
                </div>
                <div className="p-3 bg-slate-950 rounded border border-slate-800">
                  <span className="text-slate-400">Max Drawdown Ceiling:</span> 15.0%
                </div>
              </div>
            </div>
          )}

          {/* Tab 6: Settings View */}
          {activeTab === 'Settings' && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <h2 className="text-base font-bold text-white mb-2">System Settings & Health Metrics</h2>
              <p className="text-sm text-slate-400">RPC Status: ONLINE | API Connection: ACTIVE | Execution Lock: ENFORCED</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
