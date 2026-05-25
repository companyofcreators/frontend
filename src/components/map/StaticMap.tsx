import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';

interface Props { latitude: number; longitude: number; height?: number; zoom?: number; }

export default function StaticMap({ latitude, longitude, height = 250, zoom = 14 }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const map = new maplibregl.Map({
      container: ref.current,
      style: {
        version: 8,
        sources: { osm: { type: 'raster', tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'], tileSize: 256, attribution: '&copy; OSM' } },
        layers: [{ id: 'osm', type: 'raster', source: 'osm' }],
      },
      center: [longitude, latitude], zoom,
    });
    new maplibregl.Marker({ color: '#2563eb' }).setLngLat([longitude, latitude]).addTo(map);
    map.addControl(new maplibregl.NavigationControl(), 'top-right');
    return () => map.remove();
  }, [latitude, longitude, zoom]);

  return <div ref={ref} className="map-container" style={{ height, width: '100%', border: '1px solid var(--border)' }} />;
}
