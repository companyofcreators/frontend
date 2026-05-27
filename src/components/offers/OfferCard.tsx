import React, { useState, type CSSProperties } from 'react';
import { useAuth } from '../../lib/auth';
import { offers } from '../../lib/api';
import type { Offer, OfferStatus } from '../../lib/types';
import Card, { CardHeader, CardBody, CardFooter } from '../ui/Card';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { Check, X, RefreshCw, Ban } from 'lucide-react';

interface OfferCardProps {
  offer: Offer;
  customerId: string;
  onUpdate?: (updated: Offer) => void;
}

const statusVariantMap: Record<OfferStatus, 'info' | 'warning' | 'success' | 'danger'> = {
  pending: 'warning',
  accepted: 'success',
  rejected: 'danger',
  withdrawn: 'neutral' as 'info',
};

const statusLabelMap: Record<OfferStatus, string> = {
  pending: 'Pending',
  accepted: 'Accepted',
  rejected: 'Rejected',
  withdrawn: 'Withdrawn',
};

const detailStyle: CSSProperties = {
  fontSize: '13px',
  color: 'var(--text-muted)',
  marginBottom: '4px',
};

const priceStyle: CSSProperties = {
  fontSize: '18px',
  fontWeight: 700,
  color: 'var(--primary)',
};

const messageStyle: CSSProperties = {
  fontSize: '14px',
  color: 'var(--text)',
  lineHeight: 1.5,
  marginTop: '8px',
};

const alertStyle: CSSProperties = {
  color: 'var(--danger)',
  fontSize: '13px',
  marginTop: '4px',
};

export default function OfferCard({ offer, customerId, onUpdate }: OfferCardProps) {
  const { userId } = useAuth();
  const [counterPrice, setCounterPrice] = useState<number>(offer.price);
  const [counterMessage, setCounterMessage] = useState('');
  const [showCounter, setShowCounter] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isMineAsMaster = userId === offer.master_id;
  const isMyOrder = userId === customerId;
  const canAccept = isMyOrder && offer.status === 'pending';
  const canReject = isMyOrder && offer.status === 'pending';
  const canCounter = (isMyOrder || isMineAsMaster) && offer.status === 'pending';
  const canWithdraw = isMineAsMaster && offer.status === 'pending';

  const handleAccept = async () => {
    setLoading(true);
    setError('');
    try {
      const updated = await offers.accept(offer.id);
      onUpdate?.(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to accept offer');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    setLoading(true);
    setError('');
    try {
      await offers.reject(offer.id);
      onUpdate?.({
        ...offer,
        status: 'rejected' as OfferStatus,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject offer');
    } finally {
      setLoading(false);
    }
  };

  const handleCounter = async () => {
    if (counterPrice <= 0) {
      setError('Price must be greater than 0');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await offers.counter(offer.id, {
        price: counterPrice,
        message: counterMessage || 'Counter offer',
      });
      setShowCounter(false);
      setCounterMessage('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send counter offer');
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    setLoading(true);
    setError('');
    try {
      await offers.withdraw(offer.id);
      onUpdate?.({
        ...offer,
        status: 'withdrawn' as OfferStatus,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to withdraw offer');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={detailStyle}>Master ID: {offer.master_id}</div>
            <div style={detailStyle}>{new Date(offer.created_at).toLocaleString()}</div>
          </div>
          <Badge variant={statusVariantMap[offer.status]}>
            {statusLabelMap[offer.status]}
          </Badge>
        </div>
      </CardHeader>

      <CardBody>
        <div style={priceStyle}>
          {offer.price.toLocaleString()} RUB
        </div>
        <div style={messageStyle}>{offer.message}</div>
      </CardBody>

      {offer.status === 'pending' && (canAccept || canReject || canCounter || canWithdraw) && (
        <CardFooter>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', width: '100%', flexDirection: 'column' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              {canAccept && (
                <Button
                  variant="success"
                  size="sm"
                  icon={<Check size={14} />}
                  onClick={handleAccept}
                  loading={loading}
                  style={{ background: 'var(--success)', borderColor: 'var(--success)' }}
                >
                  Accept
                </Button>
              )}
              {canReject && (
                <Button
                  variant="danger"
                  size="sm"
                  icon={<X size={14} />}
                  onClick={handleReject}
                  loading={loading}
                >
                  Reject
                </Button>
              )}
              {canCounter && (
                <Button
                  variant="outline"
                  size="sm"
                  icon={<RefreshCw size={14} />}
                  onClick={() => setShowCounter(!showCounter)}
                >
                  Counter
                </Button>
              )}
              {canWithdraw && (
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<Ban size={14} />}
                  onClick={handleWithdraw}
                  loading={loading}
                >
                  Withdraw
                </Button>
              )}
            </div>

            {showCounter && (
              <div style={{ padding: '12px', background: 'var(--bg)', borderRadius: '8px' }}>
                <Input
                  label="Counter Price"
                  type="number"
                  value={counterPrice}
                  onChange={(e) => setCounterPrice(Number(e.currentTarget.value))}
                  min={0}
                  step={0.01}
                  containerStyle={{ marginBottom: '8px' }}
                />
                <Input
                  label="Message"
                  value={counterMessage}
                  onChange={(e) => setCounterMessage(e.currentTarget.value)}
                  placeholder="Optional counter offer message"
                  containerStyle={{ marginBottom: '8px' }}
                />
                <div style={{ display: 'flex', gap: '8px' }}>
                  <Button size="sm" onClick={handleCounter} loading={loading}>
                    Send Counter
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowCounter(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {error && <div style={alertStyle}>{error}</div>}
          </div>
        </CardFooter>
      )}
    </Card>
  );
}
