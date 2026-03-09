import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ordersAPI } from '../services/api';
import { format } from 'date-fns';
import { Package, Clock, MapPin, ArrowRight, Filter } from 'lucide-react';

const STATUS_COLORS = {
  PENDING: '#8888AA', DRIVER_ASSIGNED: '#4D9FFF', PICKED_UP: '#FFB800',
  IN_TRANSIT: '#FF7A40', DELIVERED: '#00E599', CANCELLED: '#FF4560',
};
const STATUS_LABELS = {
  PENDING: 'Finding Driver', DRIVER_ASSIGNED: 'Assigned', PICKED_UP: 'Picked Up',
  IN_TRANSIT: 'In Transit', DELIVERED: 'Delivered', CANCELLED: 'Cancelled',
};
const VEHICLE_ICONS = { BIKE: '🏍️', CAR: '🚗', TRUCK: '🚛' };

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    ordersAPI.myOrders()
      .then(r => setOrders(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filters = ['ALL', 'PENDING', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED'];
  const filtered = filter === 'ALL' ? orders : orders.filter(o => {
    if (filter === 'IN_TRANSIT') return ['DRIVER_ASSIGNED', 'PICKED_UP', 'IN_TRANSIT'].includes(o.status);
    return o.status === filter;
  });

  const totalSpent = orders.filter(o => o.paymentStatus === 'PAID').reduce((s, o) => s + o.totalCost, 0);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <span className="spinner" style={{ width: 32, height: 32 }} />
    </div>
  );

  return (
    <div style={{ padding: '40px', maxWidth: 800, animation: 'fadeIn 0.5s ease' }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontFamily: 'Syne', fontWeight: 800, marginBottom: 6 }}>My Orders</h1>
        <p style={{ color: 'var(--text-muted)' }}>{orders.length} total deliveries · ₹{totalSpent.toFixed(0)} spent</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 28 }}>
        {[
          { label: 'Total Orders', val: orders.length, icon: '📦' },
          { label: 'Delivered', val: orders.filter(o => o.status === 'DELIVERED').length, icon: '✅' },
          { label: 'In Progress', val: orders.filter(o => ['DRIVER_ASSIGNED', 'PICKED_UP', 'IN_TRANSIT'].includes(o.status)).length, icon: '🚀' },
          { label: 'Total Spent', val: `₹${totalSpent.toFixed(0)}`, icon: '💰' },
        ].map(s => (
          <div key={s.label} style={{ background: 'var(--bg-card)', border: '1px solid var(--bg-border)', borderRadius: 14, padding: '16px', textAlign: 'center' }}>
            <div style={{ fontSize: 24, marginBottom: 6 }}>{s.icon}</div>
            <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 3 }}>{s.val}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {filters.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: '7px 16px', borderRadius: 100, fontSize: 12, fontWeight: 600,
              background: filter === f ? 'var(--primary-glow)' : 'var(--bg-card)',
              color: filter === f ? 'var(--primary)' : 'var(--text-muted)',
              border: `1px solid ${filter === f ? 'rgba(255,77,0,0.3)' : 'var(--bg-border)'}`,
              transition: 'all 0.2s',
            }}
          >
            {f.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Order List */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
          <p style={{ fontSize: 16, fontWeight: 500 }}>No orders found</p>
          <Link to="/book" className="btn-primary" style={{ display: 'inline-flex', marginTop: 16 }}>
            Send a Parcel
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map(order => (
            <Link
              key={order.id}
              to={`/track/${order.id}`}
              style={{
                display: 'flex', alignItems: 'center', gap: 16,
                background: 'var(--bg-card)', border: '1px solid var(--bg-border)',
                borderRadius: 16, padding: '16px 20px', textDecoration: 'none',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,77,0,0.3)'; e.currentTarget.style.background = 'rgba(255,77,0,0.03)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--bg-border)'; e.currentTarget.style.background = 'var(--bg-card)'; }}
            >
              {/* Vehicle icon */}
              <div style={{ width: 48, height: 48, background: 'var(--bg-card2)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>
                {VEHICLE_ICONS[order.vehicleType]}
              </div>

              {/* Route */}
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{order.dropAddress.slice(0, 40)}{order.dropAddress.length > 40 ? '...' : ''}</div>
                </div>
                <div style={{ display: 'flex', gap: 12, fontSize: 11, color: 'var(--text-muted)' }}>
                  <span><Clock size={10} style={{ display: 'inline', marginRight: 3 }} />{format(new Date(order.createdAt), 'MMM d, h:mm a')}</span>
                  <span><MapPin size={10} style={{ display: 'inline', marginRight: 3 }} />{order.estimatedDistance}km</span>
                  <span style={{ color: order.paymentStatus === 'PAID' ? 'var(--success)' : 'var(--warning)' }}>
                    {order.paymentStatus}
                  </span>
                </div>
              </div>

              {/* Status + Cost */}
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: 17, fontWeight: 800, marginBottom: 4 }}>₹{order.totalCost}</div>
                <div style={{ fontSize: 11, fontWeight: 600, color: STATUS_COLORS[order.status], display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end' }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: STATUS_COLORS[order.status] }} />
                  {STATUS_LABELS[order.status]}
                </div>
              </div>

              <ArrowRight size={16} color="var(--text-muted)" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
