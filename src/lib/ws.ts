import type { WSEvent } from './types';

const WS_BASE = `ws://${window.location.hostname}`;
const GATEWAY_PORT = 8080;
let currentToken: string | null = null;

type WSCallback = (event: WSEvent) => void;

export function setWSToken(token: string | null) {
  currentToken = token;
}

class WSManager {
  private sockets: Map<string, WebSocket> = new Map();
  private listeners: Map<string, Set<WSCallback>> = new Map();
  private reconnectTimers: Map<string, ReturnType<typeof setTimeout>> = new Map();
  private intentionalDisconnects: Set<string> = new Set();

  connect(key: string, path: string): () => void {
    if (this.sockets.has(key)) return () => this.disconnect(key);
    this.intentionalDisconnects.delete(key);

    const doConnect = () => {
      if (this.intentionalDisconnects.has(key)) return;
      if (this.sockets.has(key)) return;

      const separator = path.includes('?') ? '&' : '?';
      const tokenParam = currentToken ? `${separator}token=${encodeURIComponent(currentToken)}` : '';
      const url = `${WS_BASE}:${GATEWAY_PORT}${path}${tokenParam}`;
      const ws = new WebSocket(url);

      ws.onopen = () => {
        console.log(`[WS] connected: ${key}`);
        // Clear reconnect timer on successful connection
        const timer = this.reconnectTimers.get(key);
        if (timer) {
          clearTimeout(timer);
          this.reconnectTimers.delete(key);
        }
      };

      ws.onmessage = (msg) => {
        try {
          const data = JSON.parse(msg.data) as WSEvent;
          this.listeners.get(key)?.forEach(fn => fn(data));
          this.listeners.get('all')?.forEach(fn => fn(data));
        } catch { /* ignore invalid JSON */ }
      };

      ws.onerror = () => console.error(`[WS] error: ${key}`);

      ws.onclose = () => {
        this.sockets.delete(key);
        if (this.intentionalDisconnects.has(key)) return;

        console.log(`[WS] closed: ${key}, reconnecting in 3s...`);
        // Auto-reconnect after 3 seconds
        const timer = setTimeout(() => {
          this.reconnectTimers.delete(key);
          if (this.intentionalDisconnects.has(key)) return;
          doConnect();
        }, 3000);
        this.reconnectTimers.set(key, timer);
      };

      this.sockets.set(key, ws);
    };

    doConnect();
    return () => this.disconnect(key);
  }

  disconnect(key: string) {
    this.intentionalDisconnects.add(key);

    const timer = this.reconnectTimers.get(key);
    if (timer) {
      clearTimeout(timer);
      this.reconnectTimers.delete(key);
    }
    const ws = this.sockets.get(key);
    if (ws) {
      ws.onclose = null; // prevent auto-reconnect on intentional disconnect
      ws.close();
      this.sockets.delete(key);
    }
  }

  send(key: string, data: unknown): boolean {
    const ws = this.sockets.get(key);
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(data));
      return true;
    }
    return false;
  }

  isConnected(key: string): boolean {
    const ws = this.sockets.get(key);
    return ws?.readyState === WebSocket.OPEN;
  }

  listen(key: string, fn: WSCallback): () => void {
    if (!this.listeners.has(key)) this.listeners.set(key, new Set());
    this.listeners.get(key)!.add(fn);
    return () => { this.listeners.get(key)?.delete(fn); };
  }

  disconnectAll() {
    this.sockets.forEach((_, key) => this.intentionalDisconnects.add(key));
    this.reconnectTimers.forEach((_, key) => this.intentionalDisconnects.add(key));
    this.reconnectTimers.forEach(t => clearTimeout(t));
    this.reconnectTimers.clear();
    this.sockets.forEach(ws => {
      ws.onclose = null;
      ws.close();
    });
    this.sockets.clear();
    this.listeners.clear();
  }
}

export const wsManager = new WSManager();

// Helper: connect to order feed
export function connectOrderFeed() {
  return wsManager.connect('orders', '/api/v1/orders/ws');
}

// Helper: connect to offer feed for a specific order
export function connectOfferFeed(orderId: string) {
  return wsManager.connect(`offers:${orderId}`, `/api/v1/offers/ws?order_id=${encodeURIComponent(orderId)}`);
}

// Helper: connect to chat
export function connectChat() {
  return wsManager.connect('chat', '/api/v1/chat/ws');
}

// Helper: connect to notifications
export function connectNotifications() {
  return wsManager.connect('notifications', '/api/v1/notifications/ws');
}

// Send a message via chat WebSocket. Returns true if sent via WS, false if WS unavailable.
export function sendChatMessage(chatId: string, message: string): boolean {
  return wsManager.send('chat', { type: 'message.send', chat_id: chatId, message });
}

export function sendChatPing() {
  wsManager.send('chat', { type: 'ping' });
}

export function sendTypingStart(chatId: string) {
  wsManager.send('chat', { type: 'typing.start', chat_id: chatId });
}

export function sendTypingStop(chatId: string) {
  wsManager.send('chat', { type: 'typing.stop', chat_id: chatId });
}

export function markMessagesRead(chatId: string) {
  wsManager.send('chat', { type: 'messages.read', chat_id: chatId });
}
