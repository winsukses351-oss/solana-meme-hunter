import { 
  SystemHealth, 
  DashboardMetrics, 
  Opportunity, 
  Position, 
  Trade, 
  SystemLog, 
  SystemSettings 
} from "@/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "";

async function fetchJson<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}/api/v1${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API Error [${response.status}] ${endpoint}: ${errorText}`);
  }

  return response.json();
}

export const ApiClient = {
  getHealth: () => fetchJson<SystemHealth>("/health"),
  getDashboardMetrics: () => fetchJson<DashboardMetrics>("/dashboard/metrics"),
  getOpportunities: () => fetchJson<Opportunity[]>("/opportunities"),
  getPositions: () => fetchJson<Position[]>("/positions"),
  getTrades: () => fetchJson<Trade[]>("/trades"),
  getSettings: () => fetchJson<SystemSettings>("/settings"),
  updateSettings: (settings: Partial<SystemSettings>) => 
    fetchJson<SystemSettings>("/settings", {
      method: "PUT",
      body: JSON.stringify(settings),
    }),
  getLogs: () => fetchJson<SystemLog[]>("/logs"),
  activateKillSwitch: () => 
    fetchJson<{ success: boolean; status: string }>("/kill-switch/activate", { method: "POST" }),
  deactivateKillSwitch: () => 
    fetchJson<{ success: boolean; status: string }>("/kill-switch/deactivate", { method: "POST" }),
  toggleLiveTrading: (enable: boolean) => 
    fetchJson<{ success: boolean; status: string }>(`/trading/${enable ? "enable" : "disable"}`, { method: "POST" }),
};
