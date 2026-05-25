import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import type { Order } from '../../lib/types';

interface Props {
  orders: Order[];
  onMarkerClick: (orderId: string) => void;
}

const statusColors: Record<string, string> = {
  created: '#2563eb',
  negotiation: '#f59e0b',
  assigned: '#22c55e',
  in_progress: '#3b82f6',
  completed: '#16a34a',
  cancelled: '#ef4444',
};

export default function OrderMap({ orders, onMarkerClick }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: {
        version: 8,
        sources: {
          osm: {
            type: 'raster',
            tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
            tileSize: 256,
            attribution: '&copy; OpenStreetMap',
          },
        },
        layers: [{ id: 'osm', type: 'raster', source: 'osm' }],
      },
      center: [37.6176, 55.7558],
      zoom: 11,
    });

    map.addControl(new maplibregl.NavigationControl(), 'top-right');
    mapRef.current = map;

    return () => { map.remove(); mapRef.current = null; };
  }, []);

  // Update markers when orders change
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clear old markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    if (orders.length === 0) return;

    const bounds = new maplibregl.LngLatBounds();

    orders.forEach(order => {
      if (!order.latitude || !order.longitude) return;

      const color = statusColors[order.status] || '#6b7280';
      const el = document.createElement('div');
      el.style.cssText = `
        width: 24px; height: 24px; border-radius: 50%;
        background: ${color}; border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3); cursor: pointer;
      `;

      const popup = new maplibregl.Popup({ offset: 25 }).setHTML(`
        <div style="font-size:14px;min-width:150px;font-family:system-ui,sans-serif">
          <div style="font-weight:600;margin-bottom:4px">${order.title}</div>
          <div style="color:#2563eb;font-weight:600">${order.price.toLocaleString()} ${order.currency}</div>
          <div style="color:#64748b;font-size:12px;margin-top:4px">${order.status}</div>
        </div>
      `);

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([order.longitude, order.latitude])
        .setPopup(popup)
        .addTo(map);

      el.addEventListener('click', () => onMarkerClick(order.id));

      markersRef.current.push(marker);
      bounds.extend([order.longitude, order.latitude]);
    });

    if (orders.length === 1) {
      const o = orders[0];
      map.flyTo({ center: [o.longitude, o.latitude], zoom: 14, duration: 800 });
    } else if (!bounds.isEmpty()) {
      map.fitBounds(bounds, { padding: 50, maxZoom: 14, duration: 800 });
    }
  }, [orders, onMarkerClick]);

  return (
    <div ref={containerRef} className="map-container"
      style={{ width: '100%', height: '100%', minHeight: 400, border: '1px solid var(--border)' }} />
  );
}
