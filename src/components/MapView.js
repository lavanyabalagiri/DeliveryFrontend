import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';

mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_TOKEN;

export default function MapView({
  pickupCoords,
  dropCoords,
  driverCoords,
  height = 400,
  onMapClick,
  pickupMode = false,
  center
}) {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const driverMarkerRef = useRef(null);
  const pickupMarkerRef = useRef(null);
  const dropMarkerRef = useRef(null);
  const [mapReady, setMapReady] = useState(false);

  // Default center: Bangalore
  const defaultCenter = { lng: 77.5946, lat: 12.9716 };

  useEffect(() => {
    if (map.current) return;
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [defaultCenter.lng, defaultCenter.lat],
      zoom: 12,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'bottom-right');
    map.current.on('load', () => setMapReady(true));

    if (onMapClick) {
      map.current.on('click', (e) => {
        onMapClick({ lat: e.lngLat.lat, lng: e.lngLat.lng });
      });
    }

    return () => { map.current?.remove(); map.current = null; };
  }, []);

  // Update pickup marker
  useEffect(() => {
    if (!mapReady || !map.current) return;
    if (pickupMarkerRef.current) pickupMarkerRef.current.remove();
    if (pickupCoords) {
      const el = document.createElement('div');
      el.innerHTML = `<div style="width:36px;height:36px;background:#00E599;border-radius:50%;border:3px solid white;display:flex;align-items:center;justify-content:center;font-size:16px;box-shadow:0 4px 12px rgba(0,0,0,0.4)">📦</div>`;
      pickupMarkerRef.current = new mapboxgl.Marker(el)
        .setLngLat([pickupCoords.lng, pickupCoords.lat])
        .setPopup(new mapboxgl.Popup({ offset: 25 }).setText('Pickup'))
        .addTo(map.current);
    }
  }, [mapReady, pickupCoords]);

  // Update drop marker
  useEffect(() => {
    if (!mapReady || !map.current) return;
    if (dropMarkerRef.current) dropMarkerRef.current.remove();
    if (dropCoords) {
      const el = document.createElement('div');
      el.innerHTML = `<div style="width:36px;height:36px;background:#FF4D00;border-radius:50%;border:3px solid white;display:flex;align-items:center;justify-content:center;font-size:16px;box-shadow:0 4px 12px rgba(0,0,0,0.4)">🎯</div>`;
      dropMarkerRef.current = new mapboxgl.Marker(el)
        .setLngLat([dropCoords.lng, dropCoords.lat])
        .setPopup(new mapboxgl.Popup({ offset: 25 }).setText('Drop-off'))
        .addTo(map.current);
    }
  }, [mapReady, dropCoords]);

  // Update driver marker with animation
  useEffect(() => {
    if (!mapReady || !map.current) return;
    if (driverMarkerRef.current) driverMarkerRef.current.remove();
    if (driverCoords) {
      const el = document.createElement('div');
      el.innerHTML = `
        <div style="position:relative;width:44px;height:44px;display:flex;align-items:center;justify-content:center">
          <div style="position:absolute;width:44px;height:44px;background:rgba(255,77,0,0.3);border-radius:50%;animation:pulse-ring 1.5s ease infinite"></div>
          <div style="width:36px;height:36px;background:#FF4D00;border-radius:50%;border:3px solid white;display:flex;align-items:center;justify-content:center;font-size:18px;box-shadow:0 4px 12px rgba(255,77,0,0.5);z-index:1">🏍️</div>
        </div>`;
      driverMarkerRef.current = new mapboxgl.Marker(el)
        .setLngLat([driverCoords.lng, driverCoords.lat])
        .addTo(map.current);
      map.current.easeTo({ center: [driverCoords.lng, driverCoords.lat], duration: 800 });
    }
  }, [mapReady, driverCoords]);

  // 🔥 Auto move map when address selected
useEffect(() => {
  if (!mapReady || !map.current || !center) return;

  map.current.easeTo({
    center: [center.lng, center.lat],
    duration: 800,
  });

}, [mapReady, center]);

useEffect(() => {
  if (!mapReady || !map.current || !center) return;

  map.current.flyTo({
    center: [center.lng, center.lat],
    zoom: 15,
    speed: 1.2,
    essential: true,
  });
}, [mapReady, center]);

  // Draw route between pickup and drop
  useEffect(() => {
    if (!mapReady || !map.current || !pickupCoords || !dropCoords) return;

    const fetchRoute = async () => {
      try {
        const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${pickupCoords.lng},${pickupCoords.lat};${dropCoords.lng},${dropCoords.lat}?geometries=geojson&access_token=${mapboxgl.accessToken}`;
        const res = await fetch(url);
        const data = await res.json();
        if (!data.routes?.[0]) return;

        const route = data.routes[0].geometry;
        const sourceId = 'route';

        if (map.current.getSource(sourceId)) {
          map.current.getSource(sourceId).setData({ type: 'Feature', geometry: route });
        } else {
          map.current.addSource(sourceId, { type: 'geojson', data: { type: 'Feature', geometry: route } });
          map.current.addLayer({
            id: sourceId, type: 'line', source: sourceId,
            paint: { 'line-color': '#FF4D00', 'line-width': 4, 'line-opacity': 0.8 },
          });
        }

        // Fit to bounds
        const coords = route.coordinates;
        const bounds = coords.reduce((b, c) => b.extend(c), new mapboxgl.LngLatBounds(coords[0], coords[0]));
        map.current.fitBounds(bounds, { padding: 80 });
      } catch (e) {}
    };
    fetchRoute();
  }, [mapReady, pickupCoords, dropCoords]);

  return (
    <div ref={mapContainer} style={{ width: '100%', height, borderRadius: 16, overflow: 'hidden' }} />
  );
}
