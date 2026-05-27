import React, { useState, useEffect, useCallback, type CSSProperties } from 'react';
import { useNavigate } from 'react-router-dom';
import { orders as ordersApi, categories as categoriesApi } from '../lib/api';
import { wsManager, connectOrderFeed } from '../lib/ws';
import type { Order, Category, WSEvent, OrderStatus } from '../lib/types';
import OrderMap from '../components/orders/OrderMap';
import Badge from '../components/ui/Badge';
import { RefreshCw } from 'lucide-react';

const containerStyle: CSSProperties = {
  display: 'flex',
  gap: '24px',
  height: 'calc(100vh - 100px)',
  maxHeight: 'calc(100vh - 100px)',
  overflow: 'hidden',
};

const mapPanelStyle: CSSProperties = {
  flex: '0 0 60%',
  display: 'flex',
  flexDirection: 'column',
  background: 'var(--surface)',
  borderRadius: '12px',
  border: '1px solid var(--border)',
  overflow: 'hidden',
};

const feedPanelStyle: CSSProperties = {
  flex: '0 0 40%',
  display: 'flex',
  flexDirection: 'column',
  background: 'var(--surface)',
  borderRadius: '12px',
  border: '1px solid var(--border)',
  overflow: 'hidden',
};

const feedHeaderStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  padding: '14px 16px',
  borderBottom: '1px solid var(--border)',
};

const feedTitleStyle: CSSProperties = {
  fontSize: '15px',
  fontWeight: 600,
  color: 'var(--text)',
  flex: 1,
};

const selectStyle: CSSProperties = {
  padding: '6px 10px',
  fontSize: '13px',
  fontFamily: 'inherit',
  color: 'var(--text)',
  background: 'var(--bg)',
  border: '1px solid var(--border)',
  borderRadius: '6px',
  outline: 'none',
  cursor: 'pointer',
  appearance: 'auto',
};

const refreshBtnStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '32px',
  height: '32px',
  border: '1px solid var(--border)',
  background: 'var(--bg)',
  borderRadius: '6px',
  cursor: 'pointer',
  color: 'var(--text-muted)',
  transition: 'background 0.15s ease',
};

const feedListStyle: CSSProperties = {
  flex: 1,
  overflowY: 'auto',
  padding: '8px',
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
};

const orderCardStyle: CSSProperties = {
  padding: '14px',
  background: 'var(--bg)',
  borderRadius: '10px',
  border: '1px solid var(--border)',
  cursor: 'pointer',
  transition: 'all 0.15s ease',
};

const orderTitleStyle: CSSProperties = {
  fontSize: '14px',
  fontWeight: 600,
  color: 'var(--text)',
  marginBottom: '6px',
};

const orderMetaStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  fontSize: '12px',
  color: 'var(--text-muted)',
};

const orderPriceStyle: CSSProperties = {
  fontSize: '16px',
  fontWeight: 700,
  color: 'var(--primary)',
};

const statusVariantMap: Record<OrderStatus, 'info' | 'warning' | 'success' | 'danger' | 'neutral'> = {
  created: 'info',
  negotiation: 'warning',
  assigned: 'success',
  in_progress: 'info',
  completed: 'success',
  cancelled: 'danger',
};

const statusLabelMap: Record<OrderStatus, string> = {
  created: 'создан',
  negotiation: 'переговоры',
  assigned: 'назначен',
  in_progress: 'в работе',
  completed: 'завершён',
  cancelled: 'отменён',
};

function formatPrice(price: number): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 0,
  }).format(price);
}

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diffSec = Math.floor((now - date) / 1000);

  if (diffSec < 60) return 'только что';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} мин назад`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr} ч назад`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 30) return `${diffDay} дн назад`;
  const diffMonth = Math.floor(diffDay / 30);
  return `${diffMonth} мес назад`;
}

const emptyStateStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100%',
  color: 'var(--text-muted)',
  fontSize: '14px',
  textAlign: 'center',
  padding: '20px',
};

export default function DashboardPage() {
  const navigate = useNavigate();

  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchOrders = useCallback(async () => {
    try {
      setRefreshing(true);
      setError('');
      const params: Record<string, string> = {};
      if (selectedCategory) params['category_id'] = selectedCategory;
      const res = await ordersApi.list(params);
      setAllOrders(res.orders ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки заказов');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedCategory]);

  useEffect(() => {
    categoriesApi
      .list()
      .then((res) => setCategories(res.categories ?? []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchOrders();
  }, [fetchOrders]);

  // WebSocket for real-time order updates
  useEffect(() => {
    const disconnect = connectOrderFeed();

    const handleEvent = (event: WSEvent) => {
      if (event.type === 'order.created') {
        setAllOrders((prev) => {
          if (prev.some((o) => o.id === event.order.id)) return prev;
          return [event.order, ...prev];
        });
      }
      if (event.type === 'order.updated') {
        setAllOrders((prev) =>
          prev.map((o) => (o.id === event.order.id ? event.order : o))
        );
      }
    };

    const unlisten = wsManager.listen('orders', handleEvent);

    return () => {
      unlisten();
      disconnect();
    };
  }, []);

  const handleMarkerClick = (orderId: string) => {
    navigate(`/orders/${orderId}`);
  };

  const filteredOrders: Order[] = (selectedCategory
    ? allOrders.filter((o) => o.category_id === selectedCategory)
    : allOrders).filter((o) => o.status !== 'completed' && o.status !== 'cancelled');

  return (
    <div style={containerStyle} className="dashboard-container">
      <style>{`
        @media (max-width: 900px) {
          .dashboard-container { flex-direction: column !important; height: auto !important; max-height: none !important; }
          .dashboard-container > div { flex: none !important; width: 100% !important; min-height: 350px; }
        }
      `}</style>

      {/* Map panel */}
      <div style={mapPanelStyle}>
        <OrderMap orders={filteredOrders} onMarkerClick={handleMarkerClick} />
      </div>

      {/* Feed panel */}
      <div style={feedPanelStyle}>
        <div style={feedHeaderStyle}>
          <span style={feedTitleStyle}>Лента заказов</span>
          <select
            style={selectStyle}
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.currentTarget.value)}
          >
            <option value="">Все категории</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
          <button
            style={{
              ...refreshBtnStyle,
              animation: refreshing ? 'spin 0.8s linear infinite' : 'none',
            }}
            onClick={fetchOrders}
            disabled={refreshing}
            title="Обновить"
          >
            <RefreshCw size={16} />
          </button>
        </div>

        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

        <div style={feedListStyle}>
          {loading && (
            <div style={emptyStateStyle}>Загрузка заказов...</div>
          )}

          {!loading && error && (
            <div
              style={{
                ...emptyStateStyle,
                color: 'var(--danger)',
              }}
            >
              {error}
            </div>
          )}

          {!loading &&
            !error &&
            filteredOrders.length === 0 && (
              <div style={emptyStateStyle}>
                {selectedCategory
                  ? 'Нет заказов в выбранной категории'
                  : 'Нет активных заказов'}
              </div>
            )}

          {filteredOrders.map((order) => (
            <div
              key={order.id}
              style={orderCardStyle}
              onClick={() => navigate(`/orders/${order.id}`)}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.borderColor = '#2563eb';
                (e.currentTarget as HTMLDivElement).style.boxShadow =
                  '0 2px 8px rgba(37,99,235,0.1)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border)';
                (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
              }}
            >
              <div style={orderTitleStyle}>{order.title}</div>
              <div style={orderMetaStyle}>
                <span style={orderPriceStyle}>{formatPrice(order.price)}</span>
                <Badge variant={statusVariantMap[order.status]}>
                  {statusLabelMap[order.status]}
                </Badge>
              </div>
              <div style={{ ...orderMetaStyle, marginTop: '6px' }}>
                <span>{timeAgo(order.created_at)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
