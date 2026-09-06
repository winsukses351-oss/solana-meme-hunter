"use client";

import { useState } from "react";

export default function Navigation({ activeTab, setActiveTab }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: "dashboard", label: "Dashboard" },
    { id: "scanner", label: "Scanner" },
    { id: "positions", label: "Positions" },
    { id: "trades", label: "Trades" },
    { id: "risk", label: "Risk" },
    { id: "settings", label: "Settings" },
  ];

  return (
    <header className="border-b border-slate-800 bg-[#0b0e14]/90 backdrop-blur sticky top-0 z-50">
      {/* Top Banner Alert */}
      <div className="bg-amber-950/80 border-b border-amber-800/50 px-3 py-1.5 text-xs text-amber-200 text-center font-mono">
        <span className="font-bold">PHASE 1 — FOUNDATION UI</span> | Live trading is not available yet.
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-4">
        <div className="flex items-center justify-between h-14">
          
          {/* Logo & Status */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <span className="h-3 w-3 rounded-full bg-purple-500 animate-pulse"></span>
              <span className="font-black tracking-wider text-base sm:text-lg text-white">
                SOLANA <span className="text-purple-400">AI</span> TRADER
              </span>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-950 text-red-400 border border-red-800/60 tracking-wider">
              BLOCKED
            </span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  activeTab === item.id
                    ? "bg-slate-800 text-purple-400 border border-purple-500/30"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 focus:outline-none"
              aria-label="Toggle menu"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-2 border-t border-slate-800 grid grid-cols-3 gap-1 pb-3">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`px-2 py-2 text-center rounded text-xs font-medium transition-colors ${
                  activeTab === item.id
                    ? "bg-purple-950/60 text-purple-300 border border-purple-800/80"
                    : "bg-slate-900/60 text-slate-400 hover:bg-slate-800"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </header>
  );
}

