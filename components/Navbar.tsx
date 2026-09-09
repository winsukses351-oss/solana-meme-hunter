"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Radar, 
  Flame, 
  Briefcase, 
  History, 
  ShieldAlert, 
  Settings, 
  Activity, 
  FileText 
} from "lucide-react";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Scanner", href: "/scanner", icon: Radar },
  { label: "Opportunities", href: "/opportunities", icon: Flame },
  { label: "Positions", href: "/positions", icon: Briefcase },
  { label: "Trades", href: "/trades", icon: History },
  { label: "Risk", href: "/risk", icon: ShieldAlert },
  { label: "Settings", href: "/settings", icon: Settings },
  { label: "System Health", href: "/health", icon: Activity },
  { label: "Logs", href: "/logs", icon: FileText },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 bg-surface/90 backdrop-blur-md border-b border-surfaceBorder px-4 py-2">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-brandAccent animate-pulse" />
          <span className="font-bold tracking-wider text-sm text-white">SOLANA AI HUNTER</span>
        </div>
        <span className="text-xs px-2 py-0.5 rounded bg-surfaceBorder text-gray-400 font-mono">v1.0.0</span>
      </div>
      <nav className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                isActive
                  ? "bg-brandAccent/10 text-brandAccent border border-brandAccent/30"
                  : "text-gray-400 hover:text-white hover:bg-surfaceBorder/50"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
