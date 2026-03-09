import React, { useEffect, useState, useRef } from 'react';
import { ordersAPI, driversAPI } from '../services/api';
import { getSocket } from '../services/socket';
import { useAuth } from '../context/AuthContext';
import MapView from '../components/MapView';
import toast from 'react-hot-toast';
import { Toggle, MapPin, Package, Clock, Star, Navigation, CheckCircle, Truck } from 'lucide-react';

const STATUS_ACTIONS = {
  DRIVER_ASSIGNED: { action: 'PICKED_UP', label: '📦 Mark as Picked Up', color: 'var(--warning)' },
  PICKED_UP: { action: 'IN_TRANSIT', label: '🚀 Start Transit', color: 'var(--primary)' },
  IN_TRANSIT: { action: 'DELIVERED', label: '✅ Mark as Delivered', color: 'var(--success)' },
};

const STATUS_MESSAGES = {
  PICKED_UP: '📦 Package has been picked up from sender',
  IN_TRANSIT: '🚀 Package is on the way to destination',
  DELIVERED: '✅ Package has been delivered successfully!',
};

export default function DriverDashboard() {
  const { user } = useAuth();
  const [activeOrders, setActiveOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isAvailable, setIsAvailable] = useState(true);
  const [driverCoords, setDriverCoords] = useState(null);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const socketRef = useRef(null);
  const locationIntervalRef = useRef(null);

  useEffect(() => {
    fetchOrders();
    setupSocket();
    startLocationTracking();

    return () => {
      if (locationIntervalRef.current) clearInterval(locationIntervalRef.current);
    };
  }, []);

  const fetchOrders = async () => {
    try {
      const { data } = await ordersAPI.driverOrders();
      setActiveOrders(data);
      if (data.length > 0 && !selectedOrder) setSelectedOrder(data[0]);
    } catch (err) {}
  };

  const setupSocket = () => {
    const socket = getSocket();
    socketRef.current = socket;

    socket.emit('driver:register', user.driverProfile?.id || user.id);

    socket.on('new:order', () => {
      fetchOrders();
      toast('🆕 New order available!');
    });
  };

  const startLocationTracking = () => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(pos => {
      const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      setDriverCoords(coords);
    }, () => {
      // Fallback to Bangalore center
      setDriverCoords({ lat: 12.9716, lng: 77.5946 });
    });

    locationIntervalRef.current = setInterval(() => {
      navigator.geolocation.getCurrentPosition(pos => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setDriverCoords(coords);
        driversAPI.updateLocation({ lat: coords.lat, lng: coords.lng }).catch(() => {});

        if (selectedOrder && socketRef.current) {
          socketRef.current.emit('driver:location', {
            driverId: user.driverProfile?.id || user.id,
            lat: coords.lat,
            lng: coords.lng,
            orderId: selectedOrder.id,
          });
        }
      }, () => {
        // Simulate movement for demo
        setDriverCoords(prev => prev ? {
          lat: prev.lat + (Math.random() - 0.5) * 0.001,
          lng: prev.lng + (Math.random() - 0.5) * 0.001,
        } : { lat: 12.9716, lng: 77.5946 });
      });
    }, 5000);
  };

  const toggleAvailability = async () => {
    const newVal = !isAvailable;
    setIsAvailable(newVal);
    try {
      await driversAPI.updateAvailability({ isAvailable: newVal });
      toast.success(newVal ? '🟢 You are now available' : '🔴 You are now offline');
    } catch { setIsAvailable(!newVal); }
  };

  const updateOrderStatus = async (orderId, status) => {
    setUpdating(true);
    try {
      await ordersAPI.updateStatus(orderId, {
        status,
        message: STATUS_MESSAGES[status],
        lat: driverCoords?.lat,
        lng: driverCoords?.lng,
      });
      toast.success(STATUS_MESSAGES[status]);

      if (status === 'DELIVERED') {
        setActiveOrders(prev => prev.filter(o => o.id !== orderId));
        setSelectedOrder(null);
        fetchOrders();
      } else {
        setActiveOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
        setSelectedOrder(prev => prev?.id === orderId ? { ...prev, status } : prev);
      }
    } catch (err) {
      toast.error('Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  const pickupCoords = selectedOrder ? { lat: selectedOrder.pickupLat, lng: selectedOrder.pickupLng } : undefined;
  const dropCoords = selectedOrder ? { lat: selectedOrder.dropLat, lng: selectedOrder.dropLng } : undefined;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '400px 1fr', minHeight: '100vh' }}>
      {/* Left panel */}
      <div style={{ background: 'var(--bg-card)', borderRight: '1px solid var(--bg-border)', overflowY: 'auto' }}>
        {/* Header */}
        <div style={{ padding: '24px 24px 0', borderBottom: '1px solid var(--bg-border)', paddingBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <h2 style={{ fontSize: 20, fontFamily: 'Syne', fontWeight: 800 }}>Driver Dashboard</h2>
              <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{user.name}</p>
            </div>
            {/* Online toggle */}
            <button
              onClick={toggleAvailability}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 16px', borderRadius: 100, fontSize: 13, fontWeight: 600,
                background: isAvailable ? 'rgba(0,229,153,0.15)' : 'var(--bg-card2)',
                color: isAvailable ? 'var(--success)' : 'var(--text-muted)',
                border: `1px solid ${isAvailable ? 'rgba(0,229,153,0.3)' : 'var(--bg-border)'}`,
                transition: 'all 0.2s',
              }}
            >
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: isAvailable ? 'var(--success)' : 'var(--text-muted)', animation: isAvailable ? 'pulse-ring 2s infinite' : 'none' }} />
              {isAvailable ? 'Online' : 'Offline'}
            </button>
          </div>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {[
              { label: 'Active', val: activeOrders.length, color: 'var(--primary)' },
              { label: 'Today', val: 0, color: 'var(--blue)' },
              { label: 'Rating', val: '4.8★', color: 'var(--accent)' },
            ].map(s => (
              <div key={s.label} style={{ background: 'var(--bg-card2)', borderRadius: 10, padding: '10px', textAlign: 'center' }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: s.color }}>{s.val}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Active Orders */}
        <div style={{ padding: '20px 24px' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>
            Active Orders ({activeOrders.length})
          </div>

          {activeOrders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: 40, marginBottom: 10 }}>⏳</div>
              <p style={{ fontSize: 14 }}>Waiting for orders...</p>
              <p style={{ fontSize: 12, marginTop: 4 }}>Make sure you're online</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {activeOrders.map(order => {
                const isSelected = selectedOrder?.id === order.id;
                const action = STATUS_ACTIONS[order.status];
                return (
                  <div
                    key={order.id}
                    onClick={() => setSelectedOrder(order)}
                    style={{
                      background: isSelected ? 'var(--primary-glow)' : 'var(--bg-card2)',
                      border: `1px solid ${isSelected ? 'rgba(255,77,0,0.3)' : 'var(--bg-border)'}`,
                      borderRadius: 14, padding: '14px 16px', cursor: 'pointer', transition: 'all 0.2s',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                      <div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 3 }}>
                          Order #{order.id.slice(-6).toUpperCase()}
                        </div>
                        <div style={{ fontSize: 14, fontWeight: 600 }}>{order.customer.name}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 15, fontWeight: 800 }}>₹{order.totalCost}</div>
                        <div style={{ fontSize: 11, color: 'var(--primary)' }}>{order.vehicleType}</div>
                      </div>
                    </div>

                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10 }}>
                      <div style={{ display: 'flex', gap: 6, marginBottom: 4 }}>
                        <span style={{ color: 'var(--success)' }}>📦</span>
                        <span>{order.pickupAddress.slice(0, 40)}...</span>
                      </div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <span style={{ color: 'var(--primary)' }}>🎯</span>
                        <span>{order.dropAddress.slice(0, 40)}...</span>
                      </div>
                    </div>

                    {action && (
                      <button
                        onClick={(e) => { e.stopPropagation(); updateOrderStatus(order.id, action.action); }}
                        disabled={updating}
                        style={{
                          width: '100%', padding: '10px', borderRadius: 10, fontSize: 13, fontWeight: 700,
                          background: action.color, color: 'white', border: 'none',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                          boxShadow: `0 4px 12px ${action.color}40`, transition: 'opacity 0.2s',
                          opacity: updating ? 0.7 : 1,
                        }}
                      >
                        {updating ? <span className="spinner" /> : action.label}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Map */}
      <div style={{ position: 'sticky', top: 0, height: '100vh', position: 'relative' }}>
        <MapView
          pickupCoords={pickupCoords}
          dropCoords={dropCoords}
          driverCoords={driverCoords}
          height="100%"
        />
        {/* Driver location indicator */}
        {driverCoords && (
          <div style={{
            position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)',
            background: 'var(--bg-card)', border: '1px solid var(--bg-border)',
            borderRadius: 100, padding: '10px 20px', fontSize: 13, fontWeight: 600,
            display: 'flex', alignItems: 'center', gap: 8, boxShadow: 'var(--shadow)',
          }}>
            <Navigation size={14} color="var(--primary)" />
            Live · {driverCoords.lat.toFixed(4)}, {driverCoords.lng.toFixed(4)}
          </div>
        )}
      </div>
    </div>
  );
}
