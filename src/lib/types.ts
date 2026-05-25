// === Core Types ===

export interface User {
  id: string; email: string; roles: string[];
}

export interface UserProfile {
  id: string; first_name: string; last_name: string;
  avatar_url: string; phone: string; birthdate?: string;
  updated_at: string;
}

export interface MasterProfile {
  user_id: string; is_active: boolean; description: string;
  experience_years: number; rating: number; completed_orders: number;
  updated_at: string;
}

export interface FullProfile {
  profile?: UserProfile;
  master_profile?: MasterProfile;
  roles: string[];
  recent_orders?: Order[];
}

export type OrderStatus = 'created' | 'negotiation' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';

export interface Order {
  id: string; customer_id: string; category_id: string;
  status: OrderStatus; price: number; currency: string;
  title: string; description: string;
  latitude: number; longitude: number;
  accepted_offer_id?: string;
  created_at: string; updated_at: string;
}

export interface Category {
  id: string; parent_id?: string; name: string; slug: string;
}

export type OfferStatus = 'pending' | 'accepted' | 'rejected' | 'withdrawn';

export interface Offer {
  id: string; order_id: string; master_id: string;
  price: number; message: string; status: OfferStatus;
  created_at: string;
}

export interface NegotiationEvent {
  id: string; offer_id: string; type: string;
  actor_id: string; actor_role: string;
  price: number; message: string;
  created_at: string;
}

export interface Message {
  id: string; chat_id: string; sender_id: string;
  message: string; attachment_file_id?: string;
  created_at: string;
}

export interface Chat {
  id: string; order_id: string; customer_id: string;
  master_id: string; last_message?: Message;
  unread_count: number;
}

export interface Notification {
  id: string; user_id: string; type: string;
  title: string; message: string; is_read: boolean;
  created_at: string;
}

export interface Review {
  id: string; order_id: string; from_user_id: string;
  to_user_id: string; rating: number; comment: string;
  created_at: string;
}

// === WebSocket Event Types ===
export type WSEvent =
  | { type: 'order.connected' } | { type: 'order.created'; order: Order }
  | { type: 'order.updated'; order: Order }
  | { type: 'offer.connected' } | { type: 'offer.created'; offer: Offer }
  | { type: 'offer.updated'; offer: Offer } | { type: 'offer.countered'; offer: NegotiationEvent }
  | { type: 'notification.connected' } | { type: 'notification.new'; notification: Notification }
  | { type: 'notification.unread_count'; count: number }
  | { type: 'message.new'; chat_id: string; message: Message }
  | { type: 'typing'; chat_id: string; user_id: string; is_typing: boolean }
  | { type: 'messages.read'; chat_id: string; user_id: string }
  | { type: 'pong' } | { type: 'ping' }
  | { type: 'error'; message: string };
