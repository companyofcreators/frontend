import React, { useState, useEffect, type FormEvent, type CSSProperties } from 'react';
import { useNavigate } from 'react-router-dom';
import { orders, categories as categoriesApi } from '../lib/api';
import type { Category } from '../lib/types';
import MapPicker from '../components/map/MapPicker';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card, { CardHeader, CardBody, CardFooter } from '../components/ui/Card';
import { Save } from 'lucide-react';

const pageStyle: CSSProperties = {
  maxWidth: '680px',
  margin: '0 auto',
};

const mapLabelStyle: CSSProperties = {
  display: 'block',
  fontSize: '14px',
  fontWeight: 500,
  color: 'var(--text)',
  marginBottom: '6px',
};

const coordinateDisplayStyle: CSSProperties = {
  fontSize: '12px',
  color: 'var(--text-muted)',
  marginTop: '8px',
  textAlign: 'center',
};

const sectionStyle: CSSProperties = {
  marginBottom: '8px',
};

export default function CreateOrderPage() {
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState<number | ''>('');
  const [categoryId, setCategoryId] = useState('');
  const [latitude, setLatitude] = useState<number>(55.7558);
  const [longitude, setLongitude] = useState<number>(37.6176);

  const [categoryList, setCategoryList] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    categoriesApi
      .list()
      .then((res) => setCategoryList(res.categories ?? []))
      .catch(() => setError('Ошибка загрузки категорий'));
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Введите название заказа');
      return;
    }
    if (!description.trim()) {
      setError('Введите описание заказа');
      return;
    }
    if (price === '' || Number(price) <= 0) {
      setError('Цена должна быть больше 0');
      return;
    }
    if (!categoryId) {
      setError('Выберите категорию');
      return;
    }
    if (!latitude || !longitude) {
      setError('Укажите место на карте');
      return;
    }

    setLoading(true);
    try {
      const res = await orders.create({
        title: title.trim(),
        description: description.trim(),
        price: Number(price),
        category_id: categoryId,
        latitude,
        longitude,
      });
      navigate(`/orders/${res.order.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка создания заказа');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (val: number): string => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div style={pageStyle}>
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>Создать новый заказ</CardHeader>
          <CardBody>
            <div style={sectionStyle}>
              <Input
                label="Название"
                placeholder="Что нужно сделать?"
                value={title}
                onChange={(e) => setTitle(e.currentTarget.value)}
                required
              />
            </div>

            <div style={sectionStyle}>
              <Input
                textarea
                label="Описание"
                placeholder="Опишите задачу подробно..."
                value={description}
                onChange={(e) => setDescription(e.currentTarget.value)}
                required
              />
            </div>

            <div style={sectionStyle}>
              <Input
                label="Цена (₽)"
                type="number"
                placeholder="Ваш бюджет"
                value={price}
                onChange={(e) =>
                  setPrice(e.currentTarget.value === '' ? '' : Number(e.currentTarget.value))
                }
                min={0}
                step={100}
                required
              />
              {typeof price === 'number' && price > 0 && (
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  {formatPrice(price)}
                </div>
              )}
            </div>

            <div style={sectionStyle}>
              <label style={mapLabelStyle}>Категория</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.currentTarget.value)}
                required
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
                <option value="">-- Выберите категорию --</option>
                {categoryList.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div style={sectionStyle}>
              <label style={mapLabelStyle}>Укажите место на карте</label>
              <MapPicker
                latitude={latitude}
                longitude={longitude}
                onChange={(lat, lng) => {
                  setLatitude(lat);
                  setLongitude(lng);
                }}
              />
              <div style={coordinateDisplayStyle}>
                Широта: {latitude.toFixed(5)}, Долгота: {longitude.toFixed(5)}
              </div>
            </div>

            {error && (
              <div
                style={{
                  color: 'var(--danger)',
                  fontSize: '14px',
                  padding: '10px 14px',
                  background: '#fef2f2',
                  borderRadius: '8px',
                  marginTop: '12px',
                }}
              >
                {error}
              </div>
            )}
          </CardBody>
          <CardFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => navigate(-1)}
            >
              Отмена
            </Button>
            <Button type="submit" loading={loading} icon={<Save size={16} />}>
              Создать заказ
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
