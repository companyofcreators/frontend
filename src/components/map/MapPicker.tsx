import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';

interface Props {
  latitude: number;
  longitude: number;
  onChange: (lat: number, lng: number) => void;
}

export default function MapPicker({ latitude, longitude, onChange }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markerRef = useRef<maplibregl.Marker | null>(null);
  const onChangeRef = useRef(onChange);
  const initialPositionRef = useRef({ latitude, longitude });

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

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
      center: [
        initialPositionRef.current.longitude || 37.6176,
        initialPositionRef.current.latitude || 55.7558,
      ],
      zoom: 11,
    });

    map.addControl(new maplibregl.NavigationControl(), 'top-right');

    const marker = new maplibregl.Marker({ color: '#2563eb' })
      .setLngLat([
        initialPositionRef.current.longitude || 37.6176,
        initialPositionRef.current.latitude || 55.7558,
      ])
      .addTo(map);

    map.on('click', (e) => {
      const { lng, lat } = e.lngLat;
      marker.setLngLat([lng, lat]);
      onChangeRef.current(Math.round(lat * 1e6) / 1e6, Math.round(lng * 1e6) / 1e6);
    });

    mapRef.current = map;
    markerRef.current = marker;

    return () => { map.remove(); mapRef.current = null; };
  }, []);

  useEffect(() => {
    if (markerRef.current && latitude && longitude) {
      markerRef.current.setLngLat([longitude, latitude]);
      mapRef.current?.flyTo({ center: [longitude, latitude], duration: 600 });
    }
  }, [latitude, longitude]);

  return (
    <div style={{ width: '100%', marginBottom: 8 }}>
      <div ref={containerRef} className="map-container" style={{ height: 300, border: '1px solid var(--border)' }} />
      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4, textAlign: 'center' }}>
        Нажмите на карту чтобы выбрать координаты
      </div>
    </div>
  );
}
