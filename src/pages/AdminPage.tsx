import React, { useState, useEffect, useCallback, type FormEvent, type CSSProperties } from 'react';
import { useAuth } from '../lib/auth';
import { categories as categoriesApi } from '../lib/api';
import type { Category } from '../lib/types';
import Card, { CardHeader, CardBody } from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { Ban, Trash2, CheckCircle, XCircle, Shield, Users, Tag, Flag, Plus, Edit3 } from 'lucide-react';

const BASE = '/api/v1';

// Direct request helper for admin endpoints
async function adminRequest<T>(method: string, path: string, body?: unknown): Promise<T> {
  const url = `${BASE}${path}`;
  const options: RequestInit = {
    method,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  };
  if (body !== undefined && method !== 'GET') {
    options.body = JSON.stringify(body);
  }
  const res = await fetch(url, options);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || data.error || res.statusText);
  }
  return res.json() as T;
}

// Types for admin data
interface AdminUser {
  id: string;
  email: string;
  roles: string[];
  created_at: string;
}

interface AdminComplaint {
  id: string;
  from_user_id: string;
  about_user_id: string;
  order_id?: string;
  reason: string;
  description: string;
  status: string;
  created_at: string;
}

type AdminTab = 'users' | 'categories' | 'complaints';

// Styles
const pageStyle: CSSProperties = {
  maxWidth: '1100px',
  margin: '0 auto',
};

const tabBarStyle: CSSProperties = {
  display: 'flex',
  gap: '4px',
  marginBottom: '24px',
  borderBottom: '2px solid var(--border)',
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

const tableStyle: CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  fontSize: '14px',
};

const thStyle: CSSProperties = {
  textAlign: 'left',
  padding: '10px 14px',
  borderBottom: '2px solid var(--border)',
  color: 'var(--text-muted)',
  fontWeight: 600,
  fontSize: '12px',
  textTransform: 'uppercase',
};

const tdStyle: CSSProperties = {
  padding: '12px 14px',
  borderBottom: '1px solid var(--border)',
  color: 'var(--text)',
  verticalAlign: 'middle',
};

const inlineFormStyle: CSSProperties = {
  display: 'flex',
  gap: '8px',
  alignItems: 'flex-end',
  marginBottom: '16px',
  flexWrap: 'wrap',
};

const forbiddenStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '400px',
  gap: '16px',
  color: 'var(--danger)',
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function AdminPage() {
  const { isAdmin } = useAuth();

  if (!isAdmin) {
    return (
      <div style={forbiddenStyle}>
        <Shield size={64} style={{ color: 'var(--danger)' }} />
        <div style={{ fontSize: '20px', fontWeight: 600 }}>Доступ запрещён</div>
        <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
          У вас нет прав администратора для доступа к этой странице.
        </div>
      </div>
    );
  }

  return <AdminPanel />;
}

function AdminPanel() {
  const [activeTab, setActiveTab] = useState<AdminTab>('users');

  return (
    <div style={pageStyle}>
      <div style={tabBarStyle}>
        <button
          style={tabStyle(activeTab === 'users')}
          onClick={() => setActiveTab('users')}
        >
          <Users size={16} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
          Пользователи
        </button>
        <button
          style={tabStyle(activeTab === 'categories')}
          onClick={() => setActiveTab('categories')}
        >
          <Tag size={16} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
          Категории
        </button>
        <button
          style={tabStyle(activeTab === 'complaints')}
          onClick={() => setActiveTab('complaints')}
        >
          <Flag size={16} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
          Жалобы
        </button>
      </div>

      {activeTab === 'users' && <UsersTab />}
      {activeTab === 'categories' && <CategoriesTab />}
      {activeTab === 'complaints' && <ComplaintsTab />}
    </div>
  );
}

// === Users Tab ===
function UsersTab() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await adminRequest<{ users: AdminUser[] }>('GET', '/admin/users');
      setUsers(data.users ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки пользователей');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchUsers();
  }, [fetchUsers]);

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('Вы уверены, что хотите удалить этого пользователя?')) return;
    setActionLoading(userId);
    try {
      await adminRequest('DELETE', `/admin/users/${userId}`);
      setUsers((prev) => prev.filter((u) => u.id !== userId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка удаления пользователя');
    } finally {
      setActionLoading(null);
    }
  };

  const handleBanUser = async (userId: string) => {
    if (!window.confirm('Вы уверены, что хотите заблокировать этого пользователя?')) return;
    setActionLoading(userId);
    try {
      await adminRequest('POST', `/admin/users/${userId}/ban`);
      await fetchUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка блокировки пользователя');
    } finally {
      setActionLoading(null);
    }
  };

  const handleUnbanUser = async (userId: string) => {
    setActionLoading(userId);
    try {
      await adminRequest('POST', `/admin/users/${userId}/unban`);
      await fetchUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка разблокировки пользователя');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
        Загрузка пользователей...
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>Все пользователи</span>
          <Button size="sm" variant="ghost" onClick={fetchUsers}>
            Обновить
          </Button>
        </div>
      </CardHeader>
      <CardBody>
        {error && (
          <div
            style={{
              color: 'var(--danger)',
              padding: '10px 14px',
              background: '#fef2f2',
              borderRadius: '8px',
              marginBottom: '12px',
              fontSize: '13px',
            }}
          >
            {error}
          </div>
        )}

        {users.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
            Нет пользователей
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>ID</th>
                  <th style={thStyle}>Email</th>
                  <th style={thStyle}>Роли</th>
                  <th style={thStyle}>Создан</th>
                  <th style={thStyle}>Действия</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td style={{ ...tdStyle, fontSize: '12px', fontFamily: 'monospace' }}>
                      {user.id.substring(0, 8)}...
                    </td>
                    <td style={tdStyle}>{user.email}</td>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                        {user.roles.map((role) => (
                          <Badge
                            key={role}
                            variant={
                              role === 'admin'
                                ? 'danger'
                                : role === 'master'
                                  ? 'success'
                                  : 'info'
                            }
                          >
                            {role === 'admin'
                              ? 'Админ'
                              : role === 'master'
                                ? 'Мастер'
                                : role === 'moderator'
                                  ? 'Модер'
                                  : 'Клиент'}
                          </Badge>
                        ))}
                      </div>
                    </td>
                    <td style={{ ...tdStyle, fontSize: '12px' }}>
                      {user.created_at ? formatDate(user.created_at) : '-'}
                    </td>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <Button
                          variant="danger"
                          size="sm"
                          icon={<Ban size={14} />}
                          onClick={() => handleBanUser(user.id)}
                          loading={actionLoading === user.id}
                        >
                          Заблокировать
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          icon={<CheckCircle size={14} />}
                          onClick={() => handleUnbanUser(user.id)}
                          loading={actionLoading === user.id}
                        >
                          Разблокировать
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<Trash2 size={14} />}
                          onClick={() => handleDeleteUser(user.id)}
                          loading={actionLoading === user.id}
                          style={{ color: 'var(--danger)' }}
                        >
                          Удалить
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardBody>
    </Card>
  );
}

// === Categories Tab ===
function CategoriesTab() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Create/edit form
  const [editId, setEditId] = useState<string | null>(null);
  const [catName, setCatName] = useState('');
  const [catSlug, setCatSlug] = useState('');
  const [catParentId, setCatParentId] = useState('');
  const [formSaving, setFormSaving] = useState(false);
  const [formError, setFormError] = useState('');

  // Delete state
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await categoriesApi.list();
      setCategories(data.categories ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки категорий');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchCategories();
  }, [fetchCategories]);

  const resetForm = () => {
    setEditId(null);
    setCatName('');
    setCatSlug('');
    setCatParentId('');
    setFormError('');
  };

  const startEdit = (cat: Category) => {
    setEditId(cat.id);
    setCatName(cat.name);
    setCatSlug(cat.slug);
    setCatParentId(cat.parent_id ?? '');
    setFormError('');
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!catName.trim()) {
      setFormError('Введите название категории');
      return;
    }
    if (!catSlug.trim()) {
      setFormError('Введите slug категории');
      return;
    }

    setFormSaving(true);
    try {
      const body: Record<string, unknown> = {
        name: catName.trim(),
        slug: catSlug.trim(),
      };
      if (catParentId) body.parent_id = catParentId;

      if (editId) {
        await adminRequest('PATCH', `/admin/categories/${editId}`, body);
      } else {
        await adminRequest('POST', '/admin/categories', body);
      }
      resetForm();
      await fetchCategories();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Ошибка сохранения категории');
    } finally {
      setFormSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Вы уверены, что хотите удалить эту категорию?')) return;
    setDeletingId(id);
    try {
      await adminRequest('DELETE', `/admin/categories/${id}`);
      setCategories((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка удаления категории');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Card>
      <CardHeader>Управление категориями</CardHeader>
      <CardBody>
        {error && (
          <div
            style={{
              color: 'var(--danger)',
              padding: '10px 14px',
              background: '#fef2f2',
              borderRadius: '8px',
              marginBottom: '12px',
              fontSize: '13px',
            }}
          >
            {error}
          </div>
        )}

        {/* Create/Edit form */}
        <form onSubmit={handleSave} style={{ ...inlineFormStyle, alignItems: 'flex-end' }}>
          <div style={{ flex: '1 1 200px', minWidth: '150px' }}>
            <Input
              label="Название"
              value={catName}
              onChange={(e) => setCatName(e.currentTarget.value)}
              placeholder="Название категории"
              required
              containerStyle={{ marginBottom: 0 }}
            />
          </div>
          <div style={{ flex: '1 1 200px', minWidth: '150px' }}>
            <Input
              label="Slug"
              value={catSlug}
              onChange={(e) => setCatSlug(e.currentTarget.value)}
              placeholder="category-slug"
              required
              containerStyle={{ marginBottom: 0 }}
            />
          </div>
          <div style={{ flex: '0 0 auto', minWidth: '180px' }}>
            <label
              style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: 500,
                color: 'var(--text)',
                marginBottom: '6px',
              }}
            >
              Родительская категория
            </label>
            <select
              value={catParentId}
              onChange={(e) => setCatParentId(e.currentTarget.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                fontSize: '14px',
                fontFamily: 'inherit',
                color: 'var(--text)',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                outline: 'none',
                cursor: 'pointer',
                boxSizing: 'border-box',
                appearance: 'auto',
              }}
            >
              <option value="">Нет (корневая)</option>
              {categories
                .filter((c) => c.id !== editId)
                .map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
            </select>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', paddingBottom: '0' }}>
            <Button
              type="submit"
              size="sm"
              loading={formSaving}
              icon={editId ? <Edit3 size={14} /> : <Plus size={14} />}
            >
              {editId ? 'Сохранить' : 'Создать'}
            </Button>
            {editId && (
              <Button type="button" size="sm" variant="ghost" onClick={resetForm}>
                Отмена
              </Button>
            )}
          </div>
        </form>

        {formError && (
          <div style={{ color: 'var(--danger)', fontSize: '13px', marginBottom: '8px' }}>
            {formError}
          </div>
        )}

        {/* Category list */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
            Загрузка категорий...
          </div>
        ) : categories.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
            Нет категорий
          </div>
        ) : (
          <div style={{ overflowX: 'auto', marginTop: '16px' }}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>ID</th>
                  <th style={thStyle}>Название</th>
                  <th style={thStyle}>Slug</th>
                  <th style={thStyle}>Родительская</th>
                  <th style={thStyle}>Действия</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((cat) => (
                  <tr key={cat.id}>
                    <td style={{ ...tdStyle, fontSize: '12px', fontFamily: 'monospace' }}>
                      {cat.id.substring(0, 8)}...
                    </td>
                    <td style={tdStyle}>{cat.name}</td>
                    <td style={tdStyle}>{cat.slug}</td>
                    <td style={tdStyle}>
                      {cat.parent_id
                        ? categories.find((c) => c.id === cat.parent_id)?.name ?? cat.parent_id
                        : '-'}
                    </td>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <Button
                          variant="outline"
                          size="sm"
                          icon={<Edit3 size={14} />}
                          onClick={() => startEdit(cat)}
                        >
                          Изменить
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          icon={<Trash2 size={14} />}
                          onClick={() => handleDelete(cat.id)}
                          loading={deletingId === cat.id}
                        >
                          Удалить
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardBody>
    </Card>
  );
}

// === Complaints Tab ===
function ComplaintsTab() {
  const [complaints, setComplaints] = useState<AdminComplaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchComplaints = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await adminRequest<{ complaints: AdminComplaint[] }>('GET', '/admin/complaints');
      setComplaints(data.complaints ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки жалоб');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchComplaints();
  }, [fetchComplaints]);

  const handleResolve = async (id: string) => {
    setActionLoading(id);
    try {
      await adminRequest('POST', `/admin/complaints/${id}/resolve`);
      setComplaints((prev) =>
        prev.map((c) => (c.id === id ? { ...c, status: 'resolved' } : c))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка обработки жалобы');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDismiss = async (id: string) => {
    setActionLoading(id);
    try {
      await adminRequest('POST', `/admin/complaints/${id}/dismiss`);
      setComplaints((prev) =>
        prev.map((c) => (c.id === id ? { ...c, status: 'dismissed' } : c))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка отклонения жалобы');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>Жалобы пользователей</span>
          <Button size="sm" variant="ghost" onClick={fetchComplaints}>
            Обновить
          </Button>
        </div>
      </CardHeader>
      <CardBody>
        {error && (
          <div
            style={{
              color: 'var(--danger)',
              padding: '10px 14px',
              background: '#fef2f2',
              borderRadius: '8px',
              marginBottom: '12px',
              fontSize: '13px',
            }}
          >
            {error}
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            Загрузка жалоб...
          </div>
        ) : complaints.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            Нет активных жалоб
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {complaints.map((complaint) => (
              <div
                key={complaint.id}
                style={{
                  padding: '16px',
                  background: 'var(--bg)',
                  borderRadius: '10px',
                  border: '1px solid var(--border)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '8px',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)' }}>
                      {complaint.reason}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                      От: {complaint.from_user_id} | На: {complaint.about_user_id}
                      {complaint.order_id && <> | Заказ: {complaint.order_id}</>}
                    </div>
                  </div>
                  <Badge
                    variant={
                      complaint.status === 'resolved'
                        ? 'success'
                        : complaint.status === 'dismissed'
                          ? 'neutral'
                          : 'warning'
                    }
                  >
                    {complaint.status === 'resolved'
                      ? 'Решена'
                      : complaint.status === 'dismissed'
                        ? 'Отклонена'
                        : 'На рассмотрении'}
                  </Badge>
                </div>

                {complaint.description && (
                  <div
                    style={{
                      fontSize: '13px',
                      color: 'var(--text)',
                      lineHeight: 1.5,
                      marginBottom: '12px',
                      padding: '10px',
                      background: 'var(--surface)',
                      borderRadius: '6px',
                      borderLeft: '3px solid var(--warning)',
                    }}
                  >
                    {complaint.description}
                  </div>
                )}

                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                  {formatDate(complaint.created_at)}
                </div>

                {complaint.status === 'pending' && (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <Button
                      variant="success"
                      size="sm"
                      icon={<CheckCircle size={14} />}
                      onClick={() => handleResolve(complaint.id)}
                      loading={actionLoading === complaint.id}
                    >
                      Решить
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      icon={<XCircle size={14} />}
                      onClick={() => handleDismiss(complaint.id)}
                      loading={actionLoading === complaint.id}
                    >
                      Отклонить
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardBody>
    </Card>
  );
}
