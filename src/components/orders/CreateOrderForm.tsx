import React, { useState, useEffect, type CSSProperties, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { orders, categories as categoriesApi } from '../../lib/api';
import type { Category } from '../../lib/types';
import Card, { CardHeader, CardBody, CardFooter } from '../ui/Card';
import Input from '../ui/Input';
import Button from '../ui/Button';
import MapPicker from '../map/MapPicker';
import { Save } from 'lucide-react';

const formStyle: CSSProperties = {
  maxWidth: '640px',
  margin: '0 auto',
};

const sectionStyle: CSSProperties = {
  marginBottom: '8px',
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
};

export default function CreateOrderForm() {
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState<number | ''>('');
  const [categoryId, setCategoryId] = useState('');
  const [latitude, setLatitude] = useState<number>(55.75);
  const [longitude, setLongitude] = useState<number>(37.62);

  const [categoryList, setCategoryList] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    categoriesApi
      .list()
      .then((res) => setCategoryList(res.categories ?? []))
      .catch(() => setError('Failed to load categories'));
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    if (!description.trim()) {
      setError('Description is required');
      return;
    }
    if (price === '' || Number(price) <= 0) {
      setError('Price must be greater than 0');
      return;
    }
    if (!categoryId) {
      setError('Please select a category');
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
      setError(err instanceof Error ? err.message : 'Failed to create order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={formStyle}>
      <Card>
        <CardHeader>Create New Order</CardHeader>
        <CardBody>
          <div style={sectionStyle}>
            <Input
              label="Title"
              placeholder="What do you need to get done?"
              value={title}
              onChange={(e) => setTitle(e.currentTarget.value)}
              required
            />
          </div>

          <div style={sectionStyle}>
            <Input
              textarea
              label="Description"
              placeholder="Describe your task in detail..."
              value={description}
              onChange={(e) => setDescription(e.currentTarget.value)}
              required
            />
          </div>

          <div style={sectionStyle}>
            <Input
              label="Price"
              type="number"
              placeholder="Your budget"
              value={price}
              onChange={(e) =>
                setPrice(e.currentTarget.value === '' ? '' : Number(e.currentTarget.value))
              }
              min={0}
              step={0.01}
              required
            />
          </div>

          <div style={sectionStyle}>
            <label style={mapLabelStyle}>Category</label>
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
              <option value="">-- Select a category --</option>
              {categoryList.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div style={sectionStyle}>
            <label style={mapLabelStyle}>Location (click on map to set)</label>
            <MapPicker
              latitude={latitude}
              longitude={longitude}
              onChange={(lat, lng) => {
                setLatitude(lat);
                setLongitude(lng);
              }}
            />
            <div style={coordinateDisplayStyle}>
              Latitude: {latitude.toFixed(5)}, Longitude: {longitude.toFixed(5)}
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
            Cancel
          </Button>
          <Button type="submit" loading={loading} icon={<Save size={16} />}>
            Create Order
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
