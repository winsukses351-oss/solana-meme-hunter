const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000/ws';

export class RealtimeClient {
  private ws: WebSocket | null = null;
  private listeners: Array<(data: any) => void> = [];

  public connect() {
    this.ws = new WebSocket(WS_URL);

    this.ws.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        this.listeners.forEach((fn) => fn(parsed));
      } catch (e) {
        console.error("Failed parsing WebSocket frame", e);
      }
    };

    this.ws.onclose = () => {
      setTimeout(() => this.connect(), 3000); // Auto reconnect
    };
  }

  public subscribe(callback: (data: any) => void) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((fn) => fn !== callback);
    };
  }
}

export const realtime = new RealtimeClient();
