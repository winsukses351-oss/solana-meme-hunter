"use client";

import { useState } from "react";
import Navigation from "@/components/Navigation";
import AccountMetrics from "@/components/AccountMetrics";
import LiveScanner from "@/components/LiveScanner";
import SmartMoneyWhales from "@/components/SmartMoneyWhales";
import {
  TopOpportunitiesTable,
  OpenPositionsTable,
  TradeHistoryTable,
} from "@/components/Tables";
import SystemStatus from "@/components/SystemStatus";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <div className="min-h-screen flex flex-col bg-[#0b0e14]">
      {/* Sticky Header Navigation */}
      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Terminal Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-2.5 sm:p-4 space-y-4">
        
        {/* Render berdasarkan Tab Navigasi */}
        {activeTab === "dashboard" && (
          <>
            <AccountMetrics />
            <LiveScanner />
            <TopOpportunitiesTable />
            <SmartMoneyWhales />
            <OpenPositionsTable />
            <TradeHistoryTable />
            <SystemStatus />
          </>
        )}

        {activeTab === "scanner" && (
          <div className="space-y-4">
            <LiveScanner />
            <TopOpportunitiesTable />
          </div>
        )}

        {activeTab === "positions" && (
          <div className="space-y-4">
            <OpenPositionsTable />
          </div>
        )}

        {activeTab === "trades" && (
          <div className="space-y-4">
            <TradeHistoryTable />
          </div>
        )}

        {activeTab === "risk" && (
          <div className="space-y-4">
            <AccountMetrics />
            <SystemStatus />
          </div>
        )}

        {activeTab === "settings" && (
          <div className="space-y-4">
            <SystemStatus />
          </div>
        )}
      </main>

      {/* Terminal Footer */}
      <footer className="border-t border-slate-800/80 py-3 text-center text-[11px] font-mono text-slate-500 bg-[#0b0e14]">
        SOLANA AI TRADER — Phase 1 Foundation UI | System State: BLOCKED
      </footer>
    </div>
  );
}
