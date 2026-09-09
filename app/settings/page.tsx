"use client";

import { useEffect, useState } from "react";
import { ApiClient } from "@/lib/api-client";
import { SystemSettings } from "@/types";

export default function SettingsPage() {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    ApiClient.getSettings().then(setSettings);
  }, []);

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      await ApiClient.updateSettings(settings);
      setMessage("Settings saved successfully.");
    } catch (err: any) {
      setMessage(`Save failed: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (!settings) return <div className="p-4 text-xs text-gray-400">Loading settings...</div>;

  return (
    <div className="p-4 flex flex-col gap-4">
      <h1 className="text-base font-bold text-white">System Configuration</h1>

      {message && <div className="p-2.5 bg-surfaceBorder text-xs text-white rounded-lg">{message}</div>}

      <div className="bg-surface border border-surfaceBorder rounded-xl p-4 flex flex-col gap-3 text-xs">
        <div>
          <label className="block text-gray-400 mb-1">Max Position Size ($ USD)</label>
          <input
            type="number"
            value={settings.max_position_size_usd}
            onChange={(e) => setSettings({ ...settings, max_position_size_usd: parseFloat(e.target.value) })}
            className="w-full bg-background border border-surfaceBorder rounded-lg p-2 text-white font-mono focus:outline-none focus:border-brandAccent"
          />
        </div>

        <div>
          <label className="block text-gray-400 mb-1">Max Slippage (%)</label>
          <input
            type="number"
            value={settings.max_slippage_pct}
            onChange={(e) => setSettings({ ...settings, max_slippage_pct: parseFloat(e.target.value) })}
            className="w-full bg-background border border-surfaceBorder rounded-lg p-2 text-white font-mono focus:outline-none focus:border-brandAccent"
          />
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-2 bg-brandAccent text-black font-bold rounded-lg hover:bg-emerald-400 transition-colors mt-2"
        >
          {saving ? "Saving..." : "Save Configuration"}
        </button>
      </div>
    </div>
  );
}
