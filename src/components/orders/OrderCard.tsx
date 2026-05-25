import React, { type CSSProperties } from 'react';
import { useNavigate } from 'react-router-dom';
import Card, { CardHeader, CardBody, CardFooter } from '../ui/Card';
import Badge from '../ui/Badge';
import type { Order, OrderStatus } from '../../lib/types';
import { MapPin, Clock, Tag } from 'lucide-react';

interface OrderCardProps {
  order: Order;
}

const statusVariantMap: Record<OrderStatus, 'info' | 'warning' | 'success' | 'danger' | 'neutral'> = {
  created: 'info',
  negotiation: 'warning',
  assigned: 'success',
  in_progress: 'info',
  completed: 'success',
  cancelled: 'danger',
};

const statusLabelMap: Record<OrderStatus, string> = {
  created: 'New',
  negotiation: 'Negotiation',
  assigned: 'Assigned',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

const detailRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  fontSize: '13px',
  color: 'var(--text-muted)',
};

const priceStyle: CSSProperties = {
  fontSize: '20px',
  fontWeight: 700,
  color: 'var(--primary)',
};

const titleStyle: CSSProperties = {
  fontSize: '16px',
  fontWeight: 600,
  color: 'var(--text)',
  margin: 0,
  lineHeight: 1.3,
};

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diffSec = Math.floor((now - date) / 1000);

  if (diffSec < 60) return 'just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 30) return `${diffDay}d ago`;
  const diffMonth = Math.floor(diffDay / 30);
  return `${diffMonth}mo ago`;
}

export default function OrderCard({ order }: OrderCardProps) {
  const navigate = useNavigate();
  const status: OrderStatus = order.status;
  const latStr = order.latitude?.toFixed(2) ?? '--';
  const lngStr = order.longitude?.toFixed(2) ?? '--';

  return (
    <Card hoverable onClick={() => navigate(`/orders/${order.id}`)}>
      <CardHeader>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <h3 style={titleStyle}>{order.title}</h3>
          <Badge variant={statusVariantMap[status]}>
            {statusLabelMap[status]}
          </Badge>
        </div>
      </CardHeader>
      <CardBody>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={detailRowStyle}>
            <Tag size={14} />
            <span>Category</span>
          </div>
          <div style={detailRowStyle}>
            <MapPin size={14} />
            <span>{latStr}, {lngStr}</span>
          </div>
          <div style={detailRowStyle}>
            <Clock size={14} />
            <span>{timeAgo(order.created_at)}</span>
          </div>
        </div>
      </CardBody>
      <CardFooter>
        <span style={priceStyle}>
          {order.price.toLocaleString()} {order.currency}
        </span>
      </CardFooter>
    </Card>
  );
}
