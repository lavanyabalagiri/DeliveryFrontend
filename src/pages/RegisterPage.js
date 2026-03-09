import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Zap, User, Mail, Lock, Phone, ArrowRight } from 'lucide-react';

const vehicleOptions = [
  { value: 'BIKE', label: '🏍️ Bike', desc: 'Small packages, fastest' },
  { value: 'CAR', label: '🚗 Car', desc: 'Medium packages' },
  { value: 'TRUCK', label: '🚛 Truck', desc: 'Large & heavy cargo' },
];

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', role: 'CUSTOMER', vehicleType: 'BIKE' });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await register(form);
      toast.success('Account created successfully!');
      navigate(user.role === 'DRIVER' ? '/driver' : '/');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const InputField = ({ icon, ...props }) => (
    <div style={{ position: 'relative' }}>
      <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
        {icon}
      </span>
      <input className="input" {...props} style={{ paddingLeft: 40 }} />
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', padding: 24, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)', width: 600, height: 400, background: 'radial-gradient(ellipse, rgba(255,77,0,0.07) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div className="fade-in" style={{ width: '100%', maxWidth: 460 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ width: 56, height: 56, background: 'linear-gradient(135deg, var(--primary), var(--accent))', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', boxShadow: '0 8px 32px rgba(255,77,0,0.35)' }}>
            <Zap size={28} color="white" fill="white" />
          </div>
          <h1 style={{ fontSize: 28, fontFamily: 'Syne', fontWeight: 800 }}>Swift<span style={{ color: 'var(--primary)' }}>Drop</span></h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>Create your account</p>
        </div>

        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--bg-border)', borderRadius: 20, padding: 32 }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
            {['CUSTOMER', 'DRIVER'].map(r => (
              <button
                key={r}
                type="button"
                onClick={() => setForm({ ...form, role: r })}
                style={{
                  flex: 1, padding: '10px', borderRadius: 10, fontSize: 13, fontWeight: 600,
                  background: form.role === r ? 'var(--primary-glow)' : 'var(--bg-card2)',
                  color: form.role === r ? 'var(--primary)' : 'var(--text-muted)',
                  border: `1px solid ${form.role === r ? 'rgba(255,77,0,0.3)' : 'var(--bg-border)'}`,
                  transition: 'all 0.2s',
                }}
              >
                {r === 'CUSTOMER' ? '📦 Customer' : '🏍️ Driver'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 13, color: 'var(--text-dim)', marginBottom: 6, display: 'block', fontWeight: 500 }}>Full Name</label>
                <InputField icon={<User size={15} />} type="text" placeholder="Your name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div>
                <label style={{ fontSize: 13, color: 'var(--text-dim)', marginBottom: 6, display: 'block', fontWeight: 500 }}>Email</label>
                <InputField icon={<Mail size={15} />} type="email" placeholder="you@example.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
              </div>
              <div>
                <label style={{ fontSize: 13, color: 'var(--text-dim)', marginBottom: 6, display: 'block', fontWeight: 500 }}>Phone</label>
                <InputField icon={<Phone size={15} />} type="text" placeholder="+91 98765 43210" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div>
                <label style={{ fontSize: 13, color: 'var(--text-dim)', marginBottom: 6, display: 'block', fontWeight: 500 }}>Password</label>
                <InputField icon={<Lock size={15} />} type="password" placeholder="Min 6 characters" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required minLength={6} />
              </div>

              {form.role === 'DRIVER' && (
                <div>
                  <label style={{ fontSize: 13, color: 'var(--text-dim)', marginBottom: 8, display: 'block', fontWeight: 500 }}>Vehicle Type</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {vehicleOptions.map(v => (
                      <button
                        key={v.value}
                        type="button"
                        onClick={() => setForm({ ...form, vehicleType: v.value })}
                        style={{
                          flex: 1, padding: '10px 8px', borderRadius: 10, fontSize: 12, fontWeight: 600,
                          background: form.vehicleType === v.value ? 'var(--primary-glow)' : 'var(--bg-card2)',
                          color: form.vehicleType === v.value ? 'var(--primary)' : 'var(--text-muted)',
                          border: `1px solid ${form.vehicleType === v.value ? 'rgba(255,77,0,0.3)' : 'var(--bg-border)'}`,
                          transition: 'all 0.2s',
                          textAlign: 'center',
                        }}
                      >
                        <div>{v.label}</div>
                        <div style={{ fontSize: 10, opacity: 0.7, marginTop: 2 }}>{v.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 8 }} disabled={loading}>
                {loading ? <span className="spinner" /> : <><ArrowRight size={17} /> Create Account</>}
              </button>
            </div>
          </form>

          <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--text-muted)' }}>
            Already have an account? <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 500 }}>Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
