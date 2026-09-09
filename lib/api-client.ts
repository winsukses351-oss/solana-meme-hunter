// Client API dengan Fallback / Data Buatan
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

  static async getHealth() {
    return this.safeFetch("/health", { status: "ok", mode: "demo/offline" });
  }

  static async getTrades() {
    return this.safeFetch("/trades", [
      { id: "1", token: "SOL", type: "BUY", amount: 1.5, price: 180, status: "completed" },
      { id: "2", token: "BONK", type: "SELL", amount: 500000, price: 0.00002, status: "completed" }
    ]);
  }

  static async getOpportunities() {
    return this.safeFetch("/opportunities", []);
  }

  static async getPositions() {
    return this.safeFetch("/positions", []);
  }

  static async getRisk() {
    return this.safeFetch("/risk", { maxDrawdown: "5%", status: "safe" });
  }
}
