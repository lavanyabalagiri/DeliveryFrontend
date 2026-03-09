import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { pricingAPI, ordersAPI } from '../services/api';
import { Zap, Package, Clock, TrendingUp, ArrowRight, Star } from 'lucide-react';
import { format } from 'date-fns';

const statusColors = {
  PENDING: '#8888AA',
  DRIVER_ASSIGNED: '#4D9FFF',
  PICKED_UP: '#FFB800',
  IN_TRANSIT: '#FF7A40',
  DELIVERED: '#00E599',
  CANCELLED: '#FF4560',
};

const statusLabels = {
  PENDING: '🔍 Finding Driver',
  DRIVER_ASSIGNED: '✅ Driver Assigned',
  PICKED_UP: '📦 Picked Up',
  IN_TRANSIT: '🚀 In Transit',
  DELIVERED: '✅ Delivered',
  CANCELLED: '❌ Cancelled',
};

export default function HomePage() {
  const { user } = useAuth();
  const [multipliers, setMultipliers] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);

  useEffect(() => {
    pricingAPI.getMultipliers().then(r => setMultipliers(r.data)).catch(() => {});
    ordersAPI.myOrders().then(r => setRecentOrders(r.data.slice(0, 3))).catch(() => {});
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 18 ? 'Good Afternoon' : 'Good Evening';

  return (
    <div style={{ padding: '40px 40px', maxWidth: 900, animation: 'fadeIn 0.5s ease' }}>
      {/* Header */}
      <div style={{ marginBottom: 36 }}>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 4 }}>{greeting} 👋</p>
        <h1 style={{ fontSize: 34, fontFamily: 'Syne', fontWeight: 800, marginBottom: 4 }}>
          {user?.name?.split(' ')[0]}
        </h1>
        <p style={{ color: 'var(--text-dim)' }}>What would you like to send today?</p>
      </div>

      {/* Surge Banner */}
      {multipliers && (multipliers.surge > 1 || multipliers.season > 1) && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(255,77,0,0.15), rgba(255,214,0,0.1))',
          border: '1px solid rgba(255,77,0,0.3)',
          borderRadius: 14,
          padding: '14px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          marginBottom: 28,
        }}>
          <TrendingUp size={20} color="var(--primary)" />
          <div>
            <span style={{ fontWeight: 600, color: 'var(--primary-light)', fontSize: 14 }}>
              {multipliers.surgeReason} · {multipliers.seasonReason}
            </span>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1 }}>
              Current rates: {multipliers.surge}x surge · {multipliers.season}x season
            </p>
          </div>
        </div>
      )}

      {/* Quick Action */}
      <Link to="/book" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'linear-gradient(135deg, var(--primary) 0%, #FF8A50 100%)',
        borderRadius: 20,
        padding: '28px 32px',
        marginBottom: 28,
        boxShadow: '0 8px 40px rgba(255,77,0,0.3)',
        transition: 'transform 0.2s, box-shadow 0.2s',
        textDecoration: 'none',
      }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 12px 48px rgba(255,77,0,0.4)'; }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 8px 40px rgba(255,77,0,0.3)'; }}
      >
        <div>
          <h2 style={{ fontSize: 22, fontFamily: 'Syne', fontWeight: 800, color: 'white', marginBottom: 4 }}>
            Send a Parcel
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>Instant pickup · Live tracking · Real-time updates</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', marginBottom: 2 }}>Starts from</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: 'white' }}>₹50</div>
          </div>
          <div style={{ width: 44, height: 44, background: 'rgba(255,255,255,0.2)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ArrowRight size={22} color="white" />
          </div>
        </div>
      </Link>

      {/* Vehicle Options Preview */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 32 }}>
        {[
          { icon: '🏍️', label: 'Bike', desc: 'Up to 5kg', time: '15-25 min', color: '#00E599' },
          { icon: '🚗', label: 'Car', desc: 'Up to 20kg', time: '20-35 min', color: '#4D9FFF' },
          { icon: '🚛', label: 'Truck', desc: 'Heavy cargo', time: '30-50 min', color: '#FFB800' },
        ].map(v => (
          <Link to="/book" key={v.label} style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--bg-border)',
            borderRadius: 16,
            padding: '20px 18px',
            textAlign: 'center',
            textDecoration: 'none',
            transition: 'all 0.2s',
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = v.color; e.currentTarget.style.background = `rgba(${v.color === '#00E599' ? '0,229,153' : v.color === '#4D9FFF' ? '77,159,255' : '255,184,0'},0.05)`; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--bg-border)'; e.currentTarget.style.background = 'var(--bg-card)'; }}
          >
            <div style={{ fontSize: 32, marginBottom: 8 }}>{v.icon}</div>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 3 }}>{v.label}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>{v.desc}</div>
            <div style={{ fontSize: 11, color: v.color, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
              <Clock size={11} /> {v.time}
            </div>
          </Link>
        ))}
      </div>

      {/* Recent Orders */}
      {recentOrders.length > 0 && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h2 style={{ fontSize: 18, fontFamily: 'Syne', fontWeight: 700 }}>Recent Orders</h2>
            <Link to="/orders" style={{ fontSize: 13, color: 'var(--primary)', fontWeight: 500 }}>View all →</Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {recentOrders.map(order => (
              <Link key={order.id} to={`/track/${order.id}`} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: 'var(--bg-card)', border: '1px solid var(--bg-border)',
                borderRadius: 14, padding: '14px 18px', textDecoration: 'none',
                transition: 'border-color 0.2s',
              }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(255,77,0,0.3)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--bg-border)'}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 36, height: 36, background: 'var(--bg-card2)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                    {order.vehicleType === 'BIKE' ? '🏍️' : order.vehicleType === 'CAR' ? '🚗' : '🚛'}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>
                      → {order.dropAddress.slice(0, 35)}{order.dropAddress.length > 35 ? '...' : ''}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      {format(new Date(order.createdAt), 'MMM d, h:mm a')}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: statusColors[order.status] }}>
                    {statusLabels[order.status]}
                  </span>
                  <span style={{ fontSize: 14, fontWeight: 700 }}>₹{order.totalCost}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
