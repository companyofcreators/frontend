import React, { useState, useEffect, useCallback, type FormEvent, type CSSProperties } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { users, reviews as reviewsApi, profile as profileApi, files } from '../lib/api';
import type { FullProfile, MasterProfile, Order, Review } from '../lib/types';
import Card, { CardHeader, CardBody, CardFooter } from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { Star, CheckCircle, Briefcase, Clock } from 'lucide-react';

function formatPrice(price: number): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 0,
  }).format(price);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

const pageStyle: CSSProperties = {
  maxWidth: '900px',
  margin: '0 auto',
};

const headerStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: '20px',
  marginBottom: '24px',
};

const avatarLargeStyle: CSSProperties = {
  width: '80px',
  height: '80px',
  borderRadius: '50%',
  background: 'var(--primary)',
  color: '#ffffff',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '32px',
  fontWeight: 700,
  flexShrink: 0,
  objectFit: 'cover',
  overflow: 'hidden',
};

const nameStyle: CSSProperties = {
  fontSize: '24px',
  fontWeight: 700,
  color: 'var(--text)',
  marginBottom: '4px',
};

const rolesWrapStyle: CSSProperties = {
  display: 'flex',
  gap: '6px',
  marginTop: '4px',
  flexWrap: 'wrap',
};

const statsGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
  gap: '12px',
  marginBottom: '24px',
};

const statCardStyle: CSSProperties = {
  padding: '16px',
  background: 'var(--surface)',
  borderRadius: '10px',
  border: '1px solid var(--border)',
  textAlign: 'center',
};

const statValueStyle: CSSProperties = {
  fontSize: '24px',
  fontWeight: 700,
  color: 'var(--primary)',
  marginBottom: '4px',
};

const statLabelStyle: CSSProperties = {
  fontSize: '12px',
  color: 'var(--text-muted)',
  textTransform: 'uppercase',
  fontWeight: 500,
};

const toggleBtnStyle: CSSProperties = {
  marginBottom: '24px',
};

const orderItemStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '12px 0',
  borderBottom: '1px solid var(--border)',
  cursor: 'pointer',
};

const reviewItemStyle: CSSProperties = {
  padding: '14px 0',
  borderBottom: '1px solid var(--border)',
};

const starRatingStyle: CSSProperties = {
  display: 'flex',
  gap: '2px',
  marginBottom: '4px',
};

export default function ProfilePage() {
  const { userId: routeUserId } = useParams<{ userId?: string }>();
  const navigate = useNavigate();
  const {
    userId: currentUserId,
    isMaster,
    refreshToken,
  } = useAuth();

  const targetUserId = routeUserId || currentUserId;
  const isOwnProfile = targetUserId === currentUserId;

  const [profile, setProfile] = useState<FullProfile | null>(null);
  const [masterProfile, setMasterProfile] = useState<MasterProfile | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [reviewList, setReviewList] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Edit profile form
  const [editing, setEditing] = useState(false);
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [uploading, setUploading] = useState(false);

  // Master toggle
  const [togglingMaster, setTogglingMaster] = useState(false);

  // Reviews loading
  const [reviewsLoading, setReviewsLoading] = useState(false);

  const firstName = profile?.profile?.first_name ?? 'Пользователь';
  const lastName = profile?.profile?.last_name ?? '';
  const displayName = [firstName, lastName].filter(Boolean).join(' ');
  const initial = firstName.charAt(0).toUpperCase();
  const roles = profile?.roles ?? [];

  const fetchProfile = useCallback(async () => {
    if (!targetUserId) return;
    setLoading(true);
    setError('');
    try {
      const p = isOwnProfile ? await profileApi.get() : await users.getProfile(targetUserId);
      setProfile(p);
      if (p.master_profile) {
        setMasterProfile(p.master_profile);
      }
      setRecentOrders(p.recent_orders ?? []);
      if (p.profile) {
        setEditFirstName(p.profile.first_name);
        setEditLastName(p.profile.last_name);
        setEditPhone(p.profile.phone);
        setAvatarUrl(p.profile.avatar_url || '');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки профиля');
    } finally {
      setLoading(false);
    }
  }, [isOwnProfile, targetUserId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchProfile();
  }, [fetchProfile]);

  const loadReviews = useCallback(async () => {
    if (!targetUserId) return;
    setReviewsLoading(true);
    try {
      const data = await reviewsApi.listByUser(targetUserId);
      setReviewList(data.reviews ?? []);
    } catch {
      setReviewList([]);
    } finally {
      setReviewsLoading(false);
    }
  }, [targetUserId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadReviews();
  }, [loadReviews]);

  const handleToggleMaster = async () => {
    if (!currentUserId) return;
    setTogglingMaster(true);
    try {
      if (isMaster) {
        await users.disableMaster(currentUserId);
      } else {
        await users.enableMaster(currentUserId);
      }
      await refreshToken();
      await fetchProfile();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка переключения роли');
    } finally {
      setTogglingMaster(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !targetUserId) return;
    setUploading(true);
    try {
      const uploaded = await files.upload(file);
      await users.updateProfile(targetUserId, { avatar_url: uploaded.url });
      setAvatarUrl(uploaded.url);
      await fetchProfile();
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Ошибка загрузки аватарки');
    } finally {
      setUploading(false);
    }
  };

  const handleSaveProfile = async (e: FormEvent) => {
    e.preventDefault();
    if (!targetUserId) return;
    setEditSaving(true);
    setEditError('');
    try {
      await users.updateProfile(targetUserId, {
        first_name: editFirstName.trim(),
        last_name: editLastName.trim(),
        phone: editPhone.trim(),
      });
      setEditing(false);
      await fetchProfile();
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Ошибка сохранения профиля');
    } finally {
      setEditSaving(false);
    }
  };

  if (loading) {
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
        Загрузка профиля...
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: 'var(--danger)' }}>
        {error}
      </div>
    );
  }

  return (
    <div style={pageStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <div style={avatarLargeStyle}>
          {avatarUrl ? (
            <img src={avatarUrl} alt={displayName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            initial
          )}
        </div>
        <div>
          <div style={nameStyle}>{displayName}</div>
          <div style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '4px' }}>
            {profile?.email ?? ''}
          </div>
          <div style={rolesWrapStyle}>
            {roles.map((role) => (
              <Badge
                key={role}
                variant={role === 'admin' ? 'danger' : role === 'master' ? 'success' : 'info'}
              >
                {role === 'admin'
                  ? 'Админ'
                  : role === 'master'
                    ? 'Мастер'
                    : role === 'moderator'
                      ? 'Модератор'
                      : 'Клиент'}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      {/* Master stats */}
      {masterProfile && (
        <div style={statsGridStyle}>
          <div style={statCardStyle}>
            <div style={statValueStyle}>
              <Star size={16} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
              {masterProfile.rating?.toFixed(1) ?? '0.0'}
            </div>
            <div style={statLabelStyle}>Рейтинг</div>
          </div>
          <div style={statCardStyle}>
            <div style={statValueStyle}>
              <CheckCircle size={16} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
              {masterProfile.completed_orders ?? 0}
            </div>
            <div style={statLabelStyle}>Завершено заказов</div>
          </div>
          <div style={statCardStyle}>
            <div style={statValueStyle}>
              <Briefcase size={16} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
              {masterProfile.experience_years ?? 0} {masterProfile.experience_years === 1 ? 'год' : 'лет'}
            </div>
            <div style={statLabelStyle}>Опыт</div>
          </div>
        </div>
      )}

      {/* Master toggle */}
      {isOwnProfile && (
        <div style={toggleBtnStyle}>
          <Button
            variant={isMaster ? 'danger' : 'success'}
            onClick={handleToggleMaster}
            loading={togglingMaster}
          >
            {isMaster ? 'Отключить роль мастера' : 'Включить роль мастера'}
          </Button>
        </div>
      )}

      {/* Edit profile */}
      {isOwnProfile && (
        <Card style={{ marginBottom: '24px' }}>
          <CardHeader>Редактировать профиль</CardHeader>
          {editing ? (
            <form onSubmit={handleSaveProfile}>
              <CardBody>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <div style={{ flex: 1 }}>
                    <Input
                      label="Имя"
                      value={editFirstName}
                      onChange={(e) => setEditFirstName(e.currentTarget.value)}
                      required
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <Input
                      label="Фамилия"
                      value={editLastName}
                      onChange={(e) => setEditLastName(e.currentTarget.value)}
                      required
                    />
                  </div>
                </div>
                <Input
                  label="Телефон"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.currentTarget.value)}
                  type="tel"
                />
                <div style={{ marginTop: '16px' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: 'var(--text)', marginBottom: '6px' }}>
                    Аватарка
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '48px', height: '48px', borderRadius: '50%',
                      background: 'var(--primary)', color: '#fff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '18px', fontWeight: 700, overflow: 'hidden', flexShrink: 0,
                    }}>
                      {avatarUrl ? (
                        <img src={avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        initial
                      )}
                    </div>
                    <label style={{
                      padding: '8px 16px', fontSize: '13px', fontWeight: 600,
                      color: 'var(--primary)', border: '1px solid var(--primary)',
                      borderRadius: '6px', cursor: uploading ? 'not-allowed' : 'pointer',
                      opacity: uploading ? 0.6 : 1,
                    }}>
                      {uploading ? 'Загрузка...' : 'Загрузить фото'}
                      <input type="file" accept="image/*" onChange={handleAvatarUpload} style={{ display: 'none' }} disabled={uploading} />
                    </label>
                  </div>
                </div>
                {editError && (
                  <div style={{ color: 'var(--danger)', fontSize: '13px', marginBottom: '8px' }}>
                    {editError}
                  </div>
                )}
              </CardBody>
              <CardFooter>
                <Button type="button" variant="ghost" onClick={() => setEditing(false)}>
                  Отмена
                </Button>
                <Button type="submit" loading={editSaving}>
                  Сохранить
                </Button>
              </CardFooter>
            </form>
          ) : (
            <CardBody>
              <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
                Имя: {firstName} {lastName}
              </div>
              <div
                style={{
                  fontSize: '14px',
                  color: 'var(--text-muted)',
                  marginTop: '8px',
                  marginBottom: '16px',
                }}
              >
                Телефон: {profile?.profile?.phone ?? 'Не указан'}
              </div>
              <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                Редактировать
              </Button>
            </CardBody>
          )}
        </Card>
      )}

      {/* Recent orders */}
      <Card style={{ marginBottom: '24px' }}>
        <CardHeader>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Clock size={18} />
            <span>Последние заказы</span>
          </div>
        </CardHeader>
        <CardBody>
          {recentOrders.length === 0 && (
            <div style={{ color: 'var(--text-muted)', fontSize: '14px', textAlign: 'center', padding: '16px' }}>
              Нет заказов
            </div>
          )}
          {recentOrders.map((order) => (
            <div
              key={order.id}
              style={orderItemStyle}
              onClick={() => navigate(`/orders/${order.id}`)}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.background = 'var(--bg)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.background = 'transparent';
              }}
            >
              <div>
                <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text)' }}>
                  {order.title}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {formatDate(order.created_at)}
                </div>
              </div>
              <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--primary)' }}>
                {formatPrice(order.price)}
              </div>
            </div>
          ))}
        </CardBody>
      </Card>

      {/* Reviews */}
      <Card>
        <CardHeader>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Star size={18} />
            <span>Отзывы</span>
          </div>
        </CardHeader>
        <CardBody>
          {reviewsLoading && (
            <div style={{ textAlign: 'center', padding: '16px', color: 'var(--text-muted)' }}>
              Загрузка отзывов...
            </div>
          )}
          {!reviewsLoading && reviewList.length === 0 && (
            <div style={{ textAlign: 'center', padding: '16px', color: 'var(--text-muted)' }}>
              Нет отзывов
            </div>
          )}
          {reviewList.map((review) => (
            <div key={review.id} style={reviewItemStyle}>
              <div style={starRatingStyle}>
                {Array.from({ length: 5 }, (_, i) => (
                  <Star
                    key={i}
                    size={14}
                    fill={i < review.rating ? '#f59e0b' : 'none'}
                    color={i < review.rating ? '#f59e0b' : '#e2e8f0'}
                  />
                ))}
              </div>
              <div style={{ fontSize: '14px', color: 'var(--text)', marginBottom: '4px' }}>
                {review.comment}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                {formatDate(review.created_at)} | Заказ: {review.order_id}
              </div>
            </div>
          ))}
        </CardBody>
      </Card>
    </div>
  );
}
