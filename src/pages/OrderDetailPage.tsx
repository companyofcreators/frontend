import React, { useState, useEffect, useCallback, type CSSProperties } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { orders, offers, chat as chatApi } from '../lib/api';
import { wsManager, connectOfferFeed, connectChat } from '../lib/ws';
import type { Order, Offer, OfferStatus, NegotiationEvent, WSEvent, Chat } from '../lib/types';
import StaticMap from '../components/map/StaticMap';
import ChatPanel from '../components/chat/ChatPanel';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card, { CardHeader, CardBody } from '../components/ui/Card';
import { MapPin, Check, X, RefreshCw, Ban, MessageSquare, ChevronDown, ChevronUp } from 'lucide-react';

// Types
type OrderTab = 'info' | 'offers' | 'chat';

// Status config
const statusVariantMap: Record<string, 'info' | 'warning' | 'success' | 'danger' | 'neutral'> = {
  created: 'info',
  negotiation: 'warning',
  assigned: 'success',
  in_progress: 'info',
  completed: 'success',
  cancelled: 'danger',
};

const statusLabelMap: Record<string, string> = {
  created: 'создан',
  negotiation: 'переговоры',
  assigned: 'назначен',
  in_progress: 'в работе',
  completed: 'завершён',
  cancelled: 'отменён',
};

const offerStatusVariantMap: Record<OfferStatus, 'info' | 'warning' | 'success' | 'danger'> = {
  pending: 'warning',
  accepted: 'success',
  rejected: 'danger',
  withdrawn: 'info',
};

const offerStatusLabelMap: Record<OfferStatus, string> = {
  pending: 'ожидает',
  accepted: 'принято',
  rejected: 'отклонено',
  withdrawn: 'отозвано',
};

function formatPrice(price: number): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 0,
  }).format(price);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString('ru-RU');
}

// Styles
const pageStyle: CSSProperties = {
  maxWidth: '1200px',
  margin: '0 auto',
};

const tabBarStyle: CSSProperties = {
  display: 'flex',
  gap: '4px',
  marginBottom: '24px',
  borderBottom: '2px solid var(--border)',
  paddingBottom: '0',
};

const tabStyle = (active: boolean): CSSProperties => ({
  padding: '10px 20px',
  fontSize: '14px',
  fontWeight: active ? 600 : 400,
  color: active ? 'var(--primary)' : 'var(--text-muted)',
  borderBottom: active ? '2px solid var(--primary)' : '2px solid transparent',
  marginBottom: '-2px',
  cursor: 'pointer',
  background: 'none',
  borderTop: 'none',
  borderLeft: 'none',
  borderRight: 'none',
  fontFamily: 'inherit',
  transition: 'color 0.15s ease',
});

const infoGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '24px',
};

const detailRowStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  padding: '8px 0',
  borderBottom: '1px solid var(--border)',
  fontSize: '14px',
};

const detailLabelStyle: CSSProperties = {
  color: 'var(--text-muted)',
  fontWeight: 500,
};

const detailValueStyle: CSSProperties = {
  color: 'var(--text)',
  fontWeight: 600,
};

const priceLargeStyle: CSSProperties = {
  fontSize: '24px',
  fontWeight: 700,
  color: 'var(--primary)',
  marginBottom: '16px',
};

const titleLargeStyle: CSSProperties = {
  fontSize: '22px',
  fontWeight: 700,
  color: 'var(--text)',
  marginBottom: '8px',
};

const descriptionStyle: CSSProperties = {
  fontSize: '14px',
  color: 'var(--text-muted)',
  lineHeight: 1.6,
  marginBottom: '16px',
};

const offerCardStyle: CSSProperties = {
  padding: '16px',
  background: 'var(--surface)',
  borderRadius: '10px',
  border: '1px solid var(--border)',
  marginBottom: '12px',
};

const offerHeaderStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '8px',
};

const offerPriceStyle: CSSProperties = {
  fontSize: '18px',
  fontWeight: 700,
  color: 'var(--primary)',
};

const offerMessageStyle: CSSProperties = {
  fontSize: '14px',
  color: 'var(--text)',
  lineHeight: 1.5,
  marginBottom: '8px',
};

const offerMetaStyle: CSSProperties = {
  fontSize: '12px',
  color: 'var(--text-muted)',
};

const formSectionStyle: CSSProperties = {
  padding: '16px',
  background: 'var(--bg)',
  borderRadius: '10px',
  border: '1px solid var(--border)',
  marginBottom: '16px',
};

const collapsibleHeaderStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '12px 16px',
  background: 'var(--bg)',
  borderRadius: '8px',
  cursor: 'pointer',
  border: '1px solid var(--border)',
  fontSize: '14px',
  fontWeight: 500,
  color: 'var(--text)',
};

const collapsibleBodyStyle: CSSProperties = {
  padding: '12px 16px',
  background: 'var(--surface)',
  borderRadius: '0 0 8px 8px',
  border: '1px solid var(--border)',
  borderTop: 'none',
};

const negotiationItemStyle: CSSProperties = {
  padding: '8px 0',
  borderBottom: '1px solid var(--border)',
  fontSize: '13px',
};

function OfferCardComponent({
  offer,
  isCustomer,
  isMaster,
  onUpdate,
  onCounterSubmit,
}: {
  offer: Offer;
  isCustomer: boolean;
  isMaster: boolean;
  onUpdate: (updated: Offer) => void;
  onCounterSubmit: (offerId: string, price: number, message: string) => void;
}) {
  const [counterPrice, setCounterPrice] = useState<number>(offer.price);
  const [counterMessage, setCounterMessage] = useState('');
  const [showCounter, setShowCounter] = useState(false);
  const [history, setHistory] = useState<NegotiationEvent[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const canAccept = isCustomer && offer.status === 'pending';
  const canReject = isCustomer && offer.status === 'pending';
  const canCounter = (isCustomer || isMaster) && offer.status === 'pending';
  const canWithdraw = isMaster && offer.status === 'pending';

  const handleAccept = async () => {
    setLoading(true);
    setError('');
    try {
      const updated = await offers.accept(offer.id);
      onUpdate(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка принятия предложения');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    setLoading(true);
    setError('');
    try {
      await offers.reject(offer.id);
      onUpdate({ ...offer, status: 'rejected' as OfferStatus });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка отклонения предложения');
    } finally {
      setLoading(false);
    }
  };

  const handleCounter = async () => {
    if (counterPrice <= 0) {
      setError('Цена должна быть больше 0');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await offers.counter(offer.id, {
        price: counterPrice,
        message: counterMessage || 'Контр-предложение',
      });
      setShowCounter(false);
      setCounterMessage('');
      onCounterSubmit(offer.id, counterPrice, counterMessage);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка отправки контр-предложения');
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    setLoading(true);
    setError('');
    try {
      await offers.withdraw(offer.id);
      onUpdate({ ...offer, status: 'withdrawn' as OfferStatus });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка отзыва предложения');
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    if (history.length > 0 && showHistory) {
      setShowHistory(false);
      return;
    }
    try {
      const h = await offers.history(offer.id);
      setHistory(h);
      setShowHistory(true);
    } catch {
      setShowHistory(false);
    }
  };

  return (
    <div style={offerCardStyle}>
      <div style={offerHeaderStyle}>
        <div>
          <div style={offerPriceStyle}>{formatPrice(offer.price)}</div>
          <div style={offerMetaStyle}>Мастер: {offer.master_id}</div>
        </div>
        <Badge variant={offerStatusVariantMap[offer.status]}>
          {offerStatusLabelMap[offer.status]}
        </Badge>
      </div>

      <div style={offerMessageStyle}>{offer.message}</div>
      <div style={offerMetaStyle}>{formatDate(offer.created_at)}</div>

      {offer.status === 'pending' && (
        <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
          {canAccept && (
            <Button
              variant="success"
              size="sm"
              icon={<Check size={14} />}
              onClick={handleAccept}
              loading={loading}
            >
              Принять
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
              Отклонить
            </Button>
          )}
          {canCounter && (
            <Button
              variant="outline"
              size="sm"
              icon={<RefreshCw size={14} />}
              onClick={() => setShowCounter(!showCounter)}
            >
              Контр-предложение
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
              Отозвать
            </Button>
          )}
        </div>
      )}

      {showCounter && (
        <div
          style={{
            padding: '12px',
            background: 'var(--bg)',
            borderRadius: '8px',
            marginTop: '12px',
          }}
        >
          <Input
            label="Цена"
            type="number"
            value={counterPrice}
            onChange={(e) => setCounterPrice(Number(e.currentTarget.value))}
            min={0}
            step={100}
            containerStyle={{ marginBottom: '8px' }}
          />
          <Input
            label="Сообщение"
            value={counterMessage}
            onChange={(e) => setCounterMessage(e.currentTarget.value)}
            placeholder="Ваше контр-предложение"
            containerStyle={{ marginBottom: '8px' }}
          />
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button size="sm" onClick={handleCounter} loading={loading}>
              Отправить
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setShowCounter(false)}>
              Отмена
            </Button>
          </div>
        </div>
      )}

      {error && (
        <div style={{ color: 'var(--danger)', fontSize: '13px', marginTop: '8px' }}>{error}</div>
      )}

      <div style={{ marginTop: '8px' }}>
        <div style={collapsibleHeaderStyle} onClick={loadHistory}>
          <span>История переговоров</span>
          {showHistory ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>

        {showHistory && (
          <div style={collapsibleBodyStyle}>
            {history.length === 0 && (
              <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                Нет истории переговоров
              </div>
            )}
            {history.map((event) => (
              <div key={event.id} style={negotiationItemStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ color: 'var(--primary)', fontWeight: 600 }}>
                    {event.type === 'counter' ? 'Контр-предложение' : event.type}
                  </span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                    {formatDate(event.created_at)}
                  </span>
                </div>
                <div>
                  Цена: {formatPrice(event.price)} | {event.message}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {event.actor_role === 'customer' ? 'Заказчик' : 'Мастер'}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { userId, isMaster } = useAuth();

  const [activeTab, setActiveTab] = useState<OrderTab>('info');

  // Order state
  const [order, setOrder] = useState<Order | null>(null);
  const [orderLoading, setOrderLoading] = useState(true);
  const [orderError, setOrderError] = useState('');

  // Offers state
  const [offerList, setOfferList] = useState<Offer[]>([]);
  const [offerLoading, setOfferLoading] = useState(false);

  // Offer form state
  const [offerPrice, setOfferPrice] = useState<number | ''>('');
  const [offerMessage, setOfferMessage] = useState('');
  const [offerSubmitting, setOfferSubmitting] = useState(false);
  const [offerFormError, setOfferFormError] = useState('');

  // Chat state
  const [currentChat, setCurrentChat] = useState<Chat | null>(null);
  const [chatLoading, setChatLoading] = useState(false);

  const isCustomer = order?.customer_id === userId;
  const canSubmitOffer = isMaster && !isCustomer && order?.status === 'created';

  // Fetch order
  useEffect(() => {
    if (!id) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOrderLoading(true);
    orders
      .get(id)
      .then((res) => {
        setOrder(res.order);
        if (res.order.category_id) {
          // Fetch categories for display
        }
      })
      .catch((err) => {
        setOrderError(err instanceof Error ? err.message : 'Ошибка загрузки заказа');
      })
      .finally(() => setOrderLoading(false));
  }, [id]);

  // Fetch offers
  const loadOffers = useCallback(async () => {
    if (!id) return;
    setOfferLoading(true);
    try {
      const data = await offers.listByOrder(id);
      setOfferList(data);
    } catch {
      setOfferList([]);
    } finally {
      setOfferLoading(false);
    }
  }, [id]);

  // Fetch or create chat
  const loadChat = useCallback(async () => {
    if (!id || !order) return;
    setChatLoading(true);
    try {
      const chatList = await chatApi.list();
      const existing = chatList.find((c) => c.order_id === id);
      if (existing) {
        setCurrentChat(existing);
      } else {
        let offersForOrder = offerList;
        if (
          offersForOrder.length === 0 ||
          (order.accepted_offer_id &&
            !offersForOrder.some((offer) => offer.id === order.accepted_offer_id))
        ) {
          offersForOrder = await offers.listByOrder(id);
          setOfferList(offersForOrder);
        }

        const acceptedOffer = offersForOrder.find((offer) =>
          order.accepted_offer_id
            ? offer.id === order.accepted_offer_id
            : offer.status === 'accepted'
        );
        const canHaveChat = ['assigned', 'in_progress', 'completed'].includes(order.status);
        const masterId = acceptedOffer?.master_id ?? (isMaster && userId ? userId : undefined);

        if (!canHaveChat || !order.customer_id || !masterId) {
          setCurrentChat(null);
          return;
        }

        const created = await chatApi.create(id, order.customer_id, masterId);
        setCurrentChat(created);
      }
    } catch {
      // Chat may not be available yet
      setCurrentChat(null);
    } finally {
      setChatLoading(false);
    }
  }, [id, isMaster, offerList, order, userId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadOffers();
  }, [loadOffers]);

  useEffect(() => {
    if (activeTab === 'chat') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadChat();
    }
  }, [activeTab, loadChat]);

  // WebSocket for offers
  useEffect(() => {
    if (!id) return;
    const disconnect = connectOfferFeed(id);

    const handleEvent = (event: WSEvent) => {
      if (event.type === 'offer.created') {
        setOfferList((prev) => {
          if (prev.some((o) => o.id === event.offer.id)) return prev;
          return [...prev, event.offer];
        });
      }
      if (event.type === 'offer.updated') {
        setOfferList((prev) =>
          prev.map((o) => (o.id === event.offer.id ? event.offer : o))
        );
      }
    };

    const unlisten = wsManager.listen(`offers:${id}`, handleEvent);

    return () => {
      unlisten();
      disconnect();
    };
  }, [id]);

  // WebSocket for chat
  useEffect(() => {
    const disconnect = connectChat();
    return () => {
      disconnect();
    };
  }, []);

  const handleSubmitOffer = async () => {
    setOfferFormError('');
    if (offerPrice === '' || Number(offerPrice) <= 0) {
      setOfferFormError('Введите цену предложения');
      return;
    }
    if (!offerMessage.trim()) {
      setOfferFormError('Введите сообщение к предложению');
      return;
    }

    setOfferSubmitting(true);
    try {
      await offers.send({
        order_id: id!,
        price: Number(offerPrice),
        message: offerMessage.trim(),
      });
      setOfferPrice('');
      setOfferMessage('');
      loadOffers();
    } catch (err) {
      setOfferFormError(err instanceof Error ? err.message : 'Ошибка отправки предложения');
    } finally {
      setOfferSubmitting(false);
    }
  };

  if (orderLoading) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '300px',
          color: 'var(--text-muted)',
        }}
      >
        Загрузка заказа...
      </div>
    );
  }

  if (orderError && !order) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '300px',
          gap: '16px',
        }}
      >
        <div style={{ color: 'var(--danger)', fontSize: '16px' }}>{orderError}</div>
        <Button variant="outline" onClick={() => navigate('/orders')}>
          Назад к заказам
        </Button>
      </div>
    );
  }

  if (!order) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
        Заказ не найден
      </div>
    );
  }

  return (
    <div style={pageStyle}>
      {/* Tab bar */}
      <div style={tabBarStyle}>
        <button style={tabStyle(activeTab === 'info')} onClick={() => setActiveTab('info')}>
          Информация
        </button>
        <button style={tabStyle(activeTab === 'offers')} onClick={() => setActiveTab('offers')}>
          Предложения
        </button>
        <button
          style={tabStyle(activeTab === 'chat')}
          onClick={() => {
            setActiveTab('chat');
            loadChat();
          }}
        >
          Чат
        </button>
      </div>

      {/* Info tab */}
      {activeTab === 'info' && (
        <div style={infoGridStyle} className="order-detail-grid">
          <style>{`
            @media (max-width: 768px) {
              .order-detail-grid { grid-template-columns: 1fr !important; }
            }
          `}</style>
          <Card>
            <CardHeader>Детали заказа</CardHeader>
            <CardBody>
              <div style={titleLargeStyle}>{order.title}</div>
              <div style={priceLargeStyle}>{formatPrice(order.price)}</div>
              <div style={descriptionStyle}>{order.description}</div>
              <div style={detailRowStyle}>
                <span style={detailLabelStyle}>Статус</span>
                <Badge variant={statusVariantMap[order.status]}>
                  {statusLabelMap[order.status]}
                </Badge>
              </div>
              <div style={detailRowStyle}>
                <span style={detailLabelStyle}>Категория</span>
                <span style={detailValueStyle}>{order.category_id}</span>
              </div>
              <div style={detailRowStyle}>
                <span style={detailLabelStyle}>Создан</span>
                <span style={detailValueStyle}>{formatDate(order.created_at)}</span>
              </div>
              <div style={detailRowStyle}>
                <span style={detailLabelStyle}>Обновлён</span>
                <span style={detailValueStyle}>{formatDate(order.updated_at)}</span>
              </div>
              <div style={{ ...detailRowStyle, borderBottom: 'none' }}>
                <span style={detailLabelStyle}>
                  <MapPin size={14} style={{ marginRight: '4px' }} />
                  Координаты
                </span>
                <span style={detailValueStyle}>
                  {order.latitude?.toFixed(5)}, {order.longitude?.toFixed(5)}
                </span>
              </div>
            </CardBody>
          </Card>
          <StaticMap latitude={order.latitude} longitude={order.longitude} height={300} />
        </div>
      )}

      {/* Offers tab */}
      {activeTab === 'offers' && (
        <div>
          {/* Offer submission form */}
          {canSubmitOffer && (
            <div style={formSectionStyle}>
              <div style={{ fontSize: '15px', fontWeight: 600, marginBottom: '12px' }}>
                Отправить предложение
              </div>
              <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                <div style={{ flex: 1 }}>
                  <Input
                    label="Цена"
                    type="number"
                    value={offerPrice}
                    onChange={(e) =>
                      setOfferPrice(
                        e.currentTarget.value === '' ? '' : Number(e.currentTarget.value)
                      )
                    }
                    placeholder={formatPrice(order.price)}
                    min={0}
                    step={100}
                  />
                </div>
              </div>
              <Input
                textarea
                label="Сообщение"
                value={offerMessage}
                onChange={(e) => setOfferMessage(e.currentTarget.value)}
                placeholder="Опишите ваше предложение..."
                containerStyle={{ marginBottom: '12px' }}
              />
              {offerFormError && (
                <div style={{ color: 'var(--danger)', fontSize: '13px', marginBottom: '8px' }}>
                  {offerFormError}
                </div>
              )}
              <Button
                onClick={handleSubmitOffer}
                loading={offerSubmitting}
                icon={<MessageSquare size={16} />}
              >
                Отправить предложение
              </Button>
            </div>
          )}

          {/* Offer list */}
          {offerLoading && (
            <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
              Загрузка предложений...
            </div>
          )}

          {!offerLoading && offerList.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              {canSubmitOffer
                ? 'Предложений пока нет. Вы можете отправить первое предложение.'
                : 'Предложений пока нет.'}
            </div>
          )}

          {offerList.map((offer) => (
            <OfferCardComponent
              key={offer.id}
              offer={offer}
              isCustomer={isCustomer}
              isMaster={isMaster && offer.master_id === userId}
              onUpdate={(updated) => {
                setOfferList((prev) =>
                  prev.map((o) => (o.id === updated.id ? updated : o))
                );
              }}
              onCounterSubmit={() => loadOffers()}
            />
          ))}
        </div>
      )}

      {/* Chat tab */}
      {activeTab === 'chat' && (
        <div style={{ height: 'calc(100vh - 250px)', minHeight: '400px' }}>
          {chatLoading && (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              Загрузка чата...
            </div>
          )}
          {!chatLoading && !currentChat && (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              Чат недоступен
            </div>
          )}
          {currentChat && <ChatPanel chatId={currentChat.id} userId={userId!} />}
        </div>
      )}
    </div>
  );
}
