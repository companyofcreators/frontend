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

  connect(key: string, path: string): () => void {
    if (this.sockets.has(key)) return () => this.disconnect(key);

    const separator = path.includes('?') ? '&' : '?';
    const tokenParam = currentToken ? `${separator}token=${encodeURIComponent(currentToken)}` : '';
    const url = `${WS_BASE}:${GATEWAY_PORT}${path}${tokenParam}`;
    const ws = new WebSocket(url);

    ws.onopen = () => console.log(`[WS] connected: ${key}`);
    ws.onmessage = (msg) => {
      try {
        const data = JSON.parse(msg.data) as WSEvent;
        // Broadcast to all listeners for this key
        this.listeners.get(key)?.forEach(fn => fn(data));
        // Also broadcast to 'all' listeners
        this.listeners.get('all')?.forEach(fn => fn(data));
      } catch { /* ignore invalid JSON */ }
    };
    ws.onerror = () => console.error(`[WS] error: ${key}`);
    ws.onclose = () => {
      console.log(`[WS] closed: ${key}`);
      this.sockets.delete(key);
    };

    this.sockets.set(key, ws);
    return () => this.disconnect(key);
  }

  disconnect(key: string) {
    const ws = this.sockets.get(key);
    if (ws) { ws.close(); this.sockets.delete(key); }
  }

  listen(key: string, fn: WSCallback): () => void {
    if (!this.listeners.has(key)) this.listeners.set(key, new Set());
    this.listeners.get(key)!.add(fn);
    return () => { this.listeners.get(key)?.delete(fn); };
  }

  disconnectAll() {
    this.sockets.forEach(ws => ws.close());
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

// Send a message via chat WebSocket
export function sendChatMessage(chatId: string, message: string) {
  const ws = wsManager['sockets'].get('chat');
  if (ws?.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: 'message.send', chat_id: chatId, message }));
  }
}

export function sendChatPing() {
  const ws = wsManager['sockets'].get('chat');
  if (ws?.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: 'ping' }));
  }
}

export function sendTypingStart(chatId: string) {
  const ws = wsManager['sockets'].get('chat');
  if (ws?.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: 'typing.start', chat_id: chatId }));
  }
}

export function sendTypingStop(chatId: string) {
  const ws = wsManager['sockets'].get('chat');
  if (ws?.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: 'typing.stop', chat_id: chatId }));
  }
}

export function markMessagesRead(chatId: string) {
  const ws = wsManager['sockets'].get('chat');
  if (ws?.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: 'messages.read', chat_id: chatId }));
  }
}
