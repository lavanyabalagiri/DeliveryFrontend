import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ordersAPI } from '../services/api';
import { getSocket } from '../services/socket';
import { useAuth } from '../context/AuthContext';
import MapView from '../components/MapView';
import toast from 'react-hot-toast';
import { Clock, Star, Phone, MessageCircle, CheckCircle, Package, Truck, MapPin, CreditCard } from 'lucide-react';
import { format } from 'date-fns';

const STATUS_STEPS = [
  { key: 'DRIVER_ASSIGNED', icon: '✅', label: 'Driver Assigned' },
  { key: 'PICKED_UP', icon: '📦', label: 'Picked Up' },
  { key: 'IN_TRANSIT', icon: '🚀', label: 'In Transit' },
  { key: 'DELIVERED', icon: '🎉', label: 'Delivered' },
];

const STATUS_INFO = {
  PENDING: { color: '#8888AA', label: 'Finding Driver...', desc: 'Looking for available drivers nearby' },
  DRIVER_ASSIGNED: { color: '#4D9FFF', label: 'Driver Assigned', desc: 'Your driver is heading to pickup location' },
  PICKED_UP: { color: '#FFB800', label: 'Parcel Picked Up', desc: 'Your parcel is in good hands' },
  IN_TRANSIT: { color: '#FF7A40', label: 'On the Way', desc: 'Heading to your drop-off location' },
  DELIVERED: { color: '#00E599', label: 'Delivered! 🎉', desc: 'Your parcel has been delivered successfully' },
  CANCELLED: { color: '#FF4560', label: 'Cancelled', desc: 'This order was cancelled' },
};

export default function TrackingPage() {
  const { orderId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [driverCoords, setDriverCoords] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const { data } = await ordersAPI.getOrder(orderId);
        setOrder(data);
        if (data.driver) {
          setDriverCoords({ lat: data.driver.currentLat, lng: data.driver.currentLng });
        }
      } catch (err) {
        toast.error('Order not found');
        navigate('/orders');
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();

    // Socket setup
    const socket = getSocket();
    socketRef.current = socket;

    socket.emit('customer:register', { customerId: user.id, orderId });

    socket.on('order:status:update', (data) => {
      setOrder(prev => prev ? { ...prev, status: data.status, trackingEvents: [...(prev.trackingEvents || []), { status: data.status, message: data.message, createdAt: data.time, lat: data.lat, lng: data.lng, id: Date.now() }] } : prev);
      toast.success(data.message || `Status: ${data.status}`);
    });

    socket.on('driver:location:update', ({ lat, lng }) => {
      setDriverCoords({ lat, lng });
    });

    return () => {
      socket.off('order:status:update');
      socket.off('driver:location:update');
    };
  }, [orderId]);

  const handlePay = async () => {
    setPaying(true);
    try {
      await ordersAPI.pay(orderId);
      setOrder(prev => ({ ...prev, paymentStatus: 'PAID' }));
      toast.success('Payment successful! ✅');
    } catch {
      toast.error('Payment failed');
    } finally {
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <span className="spinner" style={{ width: 32, height: 32 }} />
      </div>
    );
  }

  if (!order) return null;

  const statusInfo = STATUS_INFO[order.status] || STATUS_INFO.PENDING;
  const currentStepIdx = STATUS_STEPS.findIndex(s => s.key === order.status);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '420px 1fr', minHeight: '100vh' }}>
      {/* Left panel */}
      <div style={{ padding: '28px 24px', background: 'var(--bg-card)', borderRight: '1px solid var(--bg-border)', overflowY: 'auto' }}>
        {/* Status Header */}
        <div style={{
          background: `rgba(${statusInfo.color === '#00E599' ? '0,229,153' : statusInfo.color === '#4D9FFF' ? '77,159,255' : statusInfo.color === '#FFB800' ? '255,184,0' : statusInfo.color === '#FF7A40' ? '255,122,64' : '255,69,96'},0.12)`,
          border: `1px solid ${statusInfo.color}40`,
          borderRadius: 16, padding: '20px', marginBottom: 24,
        }}>
          <div style={{ fontSize: 28, marginBottom: 6 }}>
            {order.status === 'DELIVERED' ? '🎉' : order.status === 'IN_TRANSIT' ? '🚀' : order.status === 'PICKED_UP' ? '📦' : order.status === 'DRIVER_ASSIGNED' ? '🏍️' : '🔍'}
          </div>
          <div style={{ fontSize: 18, fontFamily: 'Syne', fontWeight: 800, color: statusInfo.color, marginBottom: 4 }}>
            {statusInfo.label}
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{statusInfo.desc}</div>
        </div>

        {/* ETA */}
        {order.status !== 'DELIVERED' && order.status !== 'CANCELLED' && (
          <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
            <div style={{ flex: 1, background: 'var(--bg-card2)', border: '1px solid var(--bg-border)', borderRadius: 12, padding: '14px', textAlign: 'center' }}>
              <Clock size={20} color="var(--primary)" style={{ margin: '0 auto 6px' }} />
              <div style={{ fontSize: 22, fontWeight: 800 }}>{order.estimatedTime}m</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Est. Time</div>
            </div>
            <div style={{ flex: 1, background: 'var(--bg-card2)', border: '1px solid var(--bg-border)', borderRadius: 12, padding: '14px', textAlign: 'center' }}>
              <MapPin size={20} color="var(--blue)" style={{ margin: '0 auto 6px' }} />
              <div style={{ fontSize: 22, fontWeight: 800 }}>{order.estimatedDistance}km</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Distance</div>
            </div>
          </div>
        )}

        {/* Progress Steps */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 14 }}>Order Progress</div>
          {STATUS_STEPS.map((step, i) => {
            const isDone = currentStepIdx > i || order.status === 'DELIVERED';
            const isCurrent = STATUS_STEPS[currentStepIdx]?.key === step.key;
            return (
              <div key={step.key} style={{ display: 'flex', gap: 12, marginBottom: 4 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%', fontSize: 14,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: isDone ? 'var(--success)' : isCurrent ? 'var(--primary)' : 'var(--bg-border)',
                    transition: 'all 0.3s',
                  }}>
                    {isDone ? '✓' : step.icon}
                  </div>
                  {i < STATUS_STEPS.length - 1 && (
                    <div style={{ width: 2, height: 24, background: isDone ? 'var(--success)' : 'var(--bg-border)', transition: 'background 0.3s' }} />
                  )}
                </div>
                <div style={{ paddingTop: 4, paddingBottom: 16 }}>
                  <div style={{ fontSize: 14, fontWeight: isCurrent ? 600 : 400, color: isDone || isCurrent ? 'var(--text)' : 'var(--text-muted)' }}>
                    {step.label}
                  </div>
                  {isCurrent && <div style={{ fontSize: 11, color: 'var(--primary)', marginTop: 2 }}>● In progress...</div>}
                </div>
              </div>
            );
          })}
        </div>

        {/* Driver Info */}
        {order.driver && (
          <div style={{ background: 'var(--bg-card2)', border: '1px solid var(--bg-border)', borderRadius: 14, padding: '16px', marginBottom: 16 }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Your Driver</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 46, height: 46, background: 'linear-gradient(135deg, var(--primary), var(--accent))', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
                {order.vehicleType === 'BIKE' ? '🏍️' : order.vehicleType === 'CAR' ? '🚗' : '🚛'}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{order.driver.user?.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                  <Star size={11} color="var(--accent)" fill="var(--accent)" />
                  {order.driver.rating} · {order.driver.vehiclePlate}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--bg-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Phone size={15} color="var(--text-dim)" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Cost + Payment */}
        <div style={{ background: 'var(--bg-card2)', border: '1px solid var(--bg-border)', borderRadius: 14, padding: '16px', marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Total Cost</span>
            <span style={{ fontSize: 18, fontWeight: 800 }}>₹{order.totalCost}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{order.paymentMethod}</span>
            <span className={`badge ${order.paymentStatus === 'PAID' ? 'badge-green' : 'badge-yellow'}`}>
              {order.paymentStatus}
            </span>
          </div>
          {order.status === 'DELIVERED' && order.paymentStatus !== 'PAID' && (
            <button className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 12 }} onClick={handlePay} disabled={paying}>
              {paying ? <span className="spinner" /> : <><CreditCard size={15} /> Pay ₹{order.totalCost}</>}
            </button>
          )}
        </div>

        {/* Tracking Timeline */}
        {order.trackingEvents?.length > 0 && (
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>Activity Log</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[...order.trackingEvents].reverse().map((event) => (
                <div key={event.id} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--primary)', marginTop: 6, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{event.message}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                      {format(new Date(event.createdAt), 'h:mm a')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Map */}
      <div style={{ position: 'sticky', top: 0, height: '100vh' }}>
        <MapView
          pickupCoords={{ lat: order.pickupLat, lng: order.pickupLng }}
          dropCoords={{ lat: order.dropLat, lng: order.dropLng }}
          driverCoords={driverCoords}
          height="100%"
        />
        {/* Order ID overlay */}
        <div style={{
          position: 'absolute', top: 16, right: 16,
          background: 'var(--bg-card)', border: '1px solid var(--bg-border)',
          borderRadius: 10, padding: '8px 14px', fontSize: 12,
        }}>
          <span style={{ color: 'var(--text-muted)' }}>Order </span>
          <span style={{ fontWeight: 700, fontFamily: 'monospace' }}>#{orderId.slice(-8).toUpperCase()}</span>
        </div>
      </div>
    </div>
  );
}
