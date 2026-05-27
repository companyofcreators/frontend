// REST API client — all requests go through Vite proxy to backend
const BASE = '/api/v1';

type ChatListResponse = { chats: import('./types').Chat[]; total: number };
type MessageListResponse = { messages: import('./types').Message[]; total: number };
type OfferListResponse = { offers: import('./types').Offer[]; total: number };
type NegotiationHistoryResponse = { events: import('./types').NegotiationEvent[] };
type NotificationFromApi = Omit<import('./types').Notification, 'message'> & { body?: string; message?: string };
type NotificationListResponse = {
  notifications: NotificationFromApi[];
  total: number;
  unread_count: number;
};
type UploadResponse = {
  success: boolean;
  data?: { id: string; url: string; mime_type: string; size: number; created_at: string };
  error?: string;
};
type ListFilesResponse = {
  success: boolean;
  data?: { files: unknown[]; total: number; limit: number; offset: number };
  error?: string;
};
type AuthResponse = {
  access_token?: string;
  refresh_token?: string;
  user_id: string;
  email: string;
  roles: string[];
  message?: string;
};

async function request<T>(method: string, path: string, body?: unknown, opts?: RequestInit): Promise<T> {
  const url = `${BASE}${path}`;
  const options: RequestInit = {
    method,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...opts,
  };
  if (body !== undefined && method !== 'GET') {
    options.body = JSON.stringify(body);
  }
  const res = await fetch(url, options);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data.message || data.error || res.statusText;
    throw new Error(msg);
  }
  return data as T;
}

// Multipart upload
async function uploadFile<T>(file: File): Promise<T> {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch(`${BASE}/files/upload`, { method: 'POST', credentials: 'include', body: form });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as T;
}

// === Auth ===
export const auth = {
  register: (data: { email: string; password: string; first_name: string; last_name: string; phone: string }) =>
    request<AuthResponse>('POST', '/auth/register', data),
  login: (data: { email: string; password: string }) =>
    request<AuthResponse>('POST', '/auth/login', data),
  refresh: () => request<AuthResponse>('POST', '/auth/refresh'),
  logout: () => request('DELETE', '/auth/logout'),
  verifyEmail: (token: string) =>
    request<{ message: string }>('GET', `/auth/verify-email?token=${encodeURIComponent(token)}`),
  resendVerification: (email: string) =>
    request<{ message: string }>('POST', '/auth/resend-verification', { email }),
};

// === Users ===
export const users = {
  getProfile: (id: string) => request<import('./types').FullProfile>('GET', `/users/${id}`),
  updateProfile: (id: string, data: Record<string, unknown>) => request<import('./types').UserProfile>('PATCH', `/users/${id}`, data),
  enableMaster: (id: string) => request<import('./types').MasterProfile>('POST', `/users/${id}/roles/master`),
  disableMaster: (id: string) => request('DELETE', `/users/${id}/roles/master`),
};

// === Masters ===
export const masters = {
  getProfile: (id: string) => request<import('./types').MasterProfile>('GET', `/masters/${id}`),
  updateProfile: (id: string, data: Record<string, unknown>) => request<import('./types').MasterProfile>('PATCH', `/masters/${id}`, data),
};

// === Categories ===
export const categories = {
  list: () => request<{ categories: import('./types').Category[] }>('GET', '/categories'),
};

// === Orders ===
export const orders = {
  create: (data: { title: string; description: string; price: number; category_id: string; latitude: number; longitude: number }) =>
    request<{ order: import('./types').Order }>('POST', '/orders', data),
  get: (id: string) => request<{ order: import('./types').Order }>('GET', `/orders/${id}`),
  list: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<{ orders: import('./types').Order[]; total: number }>('GET', `/orders${qs}`);
  },
  updateStatus: (id: string, status: string) =>
    request<{ order: import('./types').Order }>('PATCH', `/orders/${id}/status`, { status }),
  cancel: (id: string) => request('POST', `/orders/${id}/cancel`),
  complete: (id: string) => request('POST', `/orders/${id}/complete`),
  history: (id: string) => request<{ history: unknown[] }>('GET', `/orders/${id}/history`),
};

// === Offers ===
export const offers = {
  send: (data: { order_id: string; price: number; message: string }) =>
    request<import('./types').Offer>('POST', '/offers', data),
  get: (id: string) => request<import('./types').Offer>('GET', `/offers/${id}`),
  listByOrder: async (orderId: string) => {
    const data = await request<OfferListResponse>('GET', `/offers?order_id=${orderId}`);
    return data.offers;
  },
  history: async (id: string) => {
    const data = await request<NegotiationHistoryResponse>('GET', `/offers/${id}/history`);
    return data.events;
  },
  accept: (id: string) => request<import('./types').Offer>('POST', `/offers/${id}/accept`),
  reject: (id: string) => request('POST', `/offers/${id}/reject`),
  counter: (id: string, data: { price: number; message: string }) =>
    request<import('./types').NegotiationEvent>('POST', `/offers/${id}/counter`, data),
  withdraw: (id: string) => request('POST', `/offers/${id}/withdraw`),
};

// === Chat ===
export const chat = {
  list: async () => {
    const data = await request<ChatListResponse>('GET', '/chats');
    return data.chats;
  },
  create: (orderId: string, customerId: string, masterId: string, orderTitle?: string) =>
    request<import('./types').Chat>('POST', '/chats', {
      order_id: orderId,
      customer_id: customerId,
      master_id: masterId,
      order_title: orderTitle || '',
    }),
  get: (id: string) => request<import('./types').Chat>('GET', `/chats/${id}`),
  messages: async (id: string, limit = 50) => {
    const data = await request<MessageListResponse>('GET', `/chats/${id}/messages?limit=${limit}`);
    return data.messages;
  },
  send: (id: string, message: string) => request<import('./types').Message>('POST', `/chats/${id}/messages`, { message }),
  read: (id: string) => request('POST', `/chats/${id}/read`),
};

// === Notifications ===
export const notifications = {
  list: async () => {
    const data = await request<NotificationListResponse>('GET', '/notifications');
    return data.notifications.map((notification) => ({
      ...notification,
      message: notification.message ?? notification.body ?? '',
    }));
  },
  unreadCount: () => request<{ count: number }>('GET', '/notifications/unread-count'),
  readAll: () => request('POST', '/notifications/read-all'),
  readOne: (id: string) => request('POST', `/notifications/${id}/read`),
  delete: (id: string) => request('DELETE', `/notifications/${id}`),
};

// === Reviews ===
export const reviews = {
  create: (data: { order_id: string; to_user_id: string; rating: number; comment: string }) =>
    request('POST', '/reviews', data),
  listByUser: (userId: string) => request<{ reviews: import('./types').Review[]; total: number }>('GET', `/reviews/user/${userId}`),
};

// === Files ===
export const files = {
  upload: async (file: File) => {
    const response = await uploadFile<UploadResponse>(file);
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Не удалось загрузить файл');
    }
    return response.data;
  },
  list: async () => {
    const response = await request<ListFilesResponse>('GET', '/files');
    return response.data?.files ?? [];
  },
};

// === Profile (aggregated) ===
export const profile = {
  get: () => request<import('./types').FullProfile>('GET', '/profile'),
};
