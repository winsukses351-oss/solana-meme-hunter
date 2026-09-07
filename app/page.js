"use client";

import { useState, useEffect } from "react";
import Navigation from "../components/Navigation";
import AccountMetrics from "../components/AccountMetrics";
import LiveScanner from "../components/LiveScanner";
import SmartMoneyWhales from "../components/SmartMoneyWhales";
import {
  TopOpportunitiesTable,
  OpenPositionsTable,
  TradeHistoryTable,
} from "../components/Tables";
import SystemStatus from "../components/SystemStatus";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [backendStatus, setBackendStatus] = useState("CHECKING");
  const [dbStatus, setDbStatus] = useState("CHECKING");
  const [solanaRpcData, setSolanaRpcData] = useState(null);
  const [marketDataHealth, setMarketDataHealth] = useState(null);
  const [hunterData, setHunterData] = useState(null);

  useEffect(() => {
    async function fetchHealth() {
      try {
        const res = await fetch("/api/health");
        if (res.ok) {
          const data = await res.json();
          setBackendStatus(data.backend || "error");
          setDbStatus(data.database || "error");
          setMarketDataHealth(data.market_data || null);
        } else {
          setBackendStatus("error");
          setDbStatus("error");
        }
      } catch {
        setBackendStatus("error");
        setDbStatus("error");
      }
    }

    async function fetchSolanaHealth() {
      try {
        const res = await fetch("/api/solana/health");
        const data = await res.json();
        setSolanaRpcData(data);
      } catch {
        setSolanaRpcData({
          connected: false,
          status: "ERROR",
          network: null,
          slot: null,
          blockHeight: null,
          latencyMs: null,
        });
      }
    }

    async function fetchTokenHunter() {
      try {
        const res = await fetch("/api/token-hunter");
        if (res.ok) {
          const data = await res.json();
          setHunterData(data);
        }
      } catch {
        setHunterData(null);
      }
    }

    fetchHealth();
    fetchSolanaHealth();
    fetchTokenHunter();

    const interval = setInterval(() => {
      fetchHealth();
      fetchSolanaHealth();
      fetchTokenHunter();
    }, 15000); // Safe 15s refresh interval

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[#0b0e14]">
      {/* Sticky Header Navigation */}
      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Terminal Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-2.5 sm:p-4 space-y-4">
        
        {activeTab === "dashboard" && (
          <>
            <AccountMetrics />
            <LiveScanner
              hunterData={hunterData}
              marketDataStatus={marketDataHealth?.status || "CHECKING"}
            />
            <TopOpportunitiesTable
              hunterData={hunterData}
              marketDataStatus={marketDataHealth?.status || "CHECKING"}
            />
            <SmartMoneyWhales />
            <OpenPositionsTable />
            <TradeHistoryTable />
            <SystemStatus
              backendStatus={backendStatus}
              dbStatus={dbStatus}
              solanaRpcData={solanaRpcData}
              marketDataHealth={marketDataHealth}
              hunterData={hunterData}
            />
          </>
        )}

        {activeTab === "scanner" && (
          <div className="space-y-4">
            <LiveScanner
              hunterData={hunterData}
              marketDataStatus={marketDataHealth?.status || "CHECKING"}
            />
            <TopOpportunitiesTable
              hunterData={hunterData}
              marketDataStatus={marketDataHealth?.status || "CHECKING"}
            />
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
            <SystemStatus
              backendStatus={backendStatus}
              dbStatus={dbStatus}
              solanaRpcData={solanaRpcData}
              marketDataHealth={marketDataHealth}
              hunterData={hunterData}
            />
          </div>
        )}

        {activeTab === "settings" && (
          <div className="space-y-4">
            <SystemStatus
              backendStatus={backendStatus}
              dbStatus={dbStatus}
              solanaRpcData={solanaRpcData}
              marketDataHealth={marketDataHealth}
              hunterData={hunterData}
            />
          </div>
        )}
      </main>

      {/* Terminal Footer */}
      <footer className="border-t border-slate-800/80 py-3 text-center text-[11px] font-mono text-slate-500 bg-[#0b0e14]">
        SOLANA AI TRADER — Phase 5 Real Token Hunter Engine | System State: BLOCKED
      </footer>
    </div>
  );
}
