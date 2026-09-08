'use client';

import React, { useEffect, useState } from 'react';
import { Navigation } from '@/components/Navigation';
import { StatusHeader } from '@/components/StatusHeader';
import { MetricsGrid } from '@/components/MetricsGrid';
import { fetchApi } from '@/lib/api';
import { realtime } from '@/lib/websocket';
import { TradingMetrics } from '@solana-trader/shared';

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<TradingMetrics | null>(null);

  const loadData = async () => {
    try {
      const data = await fetchApi<TradingMetrics>('/api/trading/metrics');
      setMetrics(data);
    } catch (e) {
      console.error('Failed to load metrics:', e);
    }
  };

  useEffect(() => {
    loadData();
    realtime.connect();
    const unsubscribe = realtime.subscribe((msg) => {
      if (msg.type === 'METRICS_UPDATE') {
        setMetrics(msg.payload);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleToggleKillSwitch = async () => {
    if (!metrics) return;
    try {
      await fetchApi('/api/settings/kill-switch', {
        method: 'POST',
        body: JSON.stringify({ active: !metrics.kill_switch_active }),
      });
      await loadData();
    } catch (e) {
      alert('Failed toggle kill switch');
    }
  };

  return (
    <div className="min-h-screen bg-darkBg pb-12">
      <Navigation />
      <main className="max-w-7xl mx-auto px-4 pt-6 space-y-6">
        <StatusHeader
          status={metrics?.trading_status || 'INITIALIZING'}
          killSwitchActive={metrics?.kill_switch_active || false}
          onToggleKillSwitch={handleToggleKillSwitch}
        />
        <MetricsGrid metrics={metrics} />
      </main>
    </div>
  );
}
