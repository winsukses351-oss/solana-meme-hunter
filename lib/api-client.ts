export class ApiClient {
  private static async safeFetch(endpoint: string, fallbackData: any) {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
      if (!baseUrl) return fallbackData;

      const res = await fetch(`${baseUrl}${endpoint}`);
      if (!res.ok) return fallbackData;

      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        return await res.json();
      }
      return fallbackData;
    } catch (error) {
      return fallbackData;
    }
  }

  // Method yang dicari oleh komponen Dashboard
  static async getDashboardMetrics() {
    return this.safeFetch("/dashboard/metrics", {
      solBalance: "0.00 SOL",
      dailyPnl: "$0.00",
      winRate: "0%",
      maxDrawdown: "0%",
      currentPeakRisk: "Low"
    });
  }

  static async getHealth() {
    return this.safeFetch("/health", { status: "ok", mode: "demo/offline" });
  }

  static async getTrades() {
    return this.safeFetch("/trades", []);
  }

  static async getOpportunities() {
    return this.safeFetch("/opportunities", []);
  }

  static async getPositions() {
    return this.safeFetch("/positions", []);
  }

  static async getRisk() {
    return this.safeFetch("/risk", { maxDrawdown: "0%", status: "safe" });
  }
}
