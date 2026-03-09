import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Zap, Mail, Lock, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      toast.success(`Welcome back, ${user.name}!`);
      navigate(user.role === 'DRIVER' ? '/driver' : '/');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg)',
      padding: 24,
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background glow */}
      <div style={{
        position: 'absolute',
        top: '20%', left: '50%',
        transform: 'translateX(-50%)',
        width: 600, height: 400,
        background: 'radial-gradient(ellipse, rgba(255,77,0,0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div className="fade-in" style={{ width: '100%', maxWidth: 420 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{
            width: 56, height: 56,
            background: 'linear-gradient(135deg, var(--primary), var(--accent))',
            borderRadius: 16,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
            boxShadow: '0 8px 32px rgba(255,77,0,0.35)',
          }}>
            <Zap size={28} color="white" fill="white" />
          </div>
          <h1 style={{ fontSize: 28, fontFamily: 'Syne', fontWeight: 800, marginBottom: 6 }}>
            Swift<span style={{ color: 'var(--primary)' }}>Drop</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Instant parcel delivery, anywhere</p>
        </div>

        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--bg-border)',
          borderRadius: 20,
          padding: 32,
        }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 6 }}>Sign In</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 24 }}>
            New here? <Link to="/register" style={{ color: 'var(--primary)', fontWeight: 500 }}>Create account</Link>
          </p>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 13, color: 'var(--text-dim)', marginBottom: 6, display: 'block', fontWeight: 500 }}>
                Email
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  className="input"
                  type="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  style={{ paddingLeft: 40 }}
                  required
                />
              </div>
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ fontSize: 13, color: 'var(--text-dim)', marginBottom: 6, display: 'block', fontWeight: 500 }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  className="input"
                  type="password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  style={{ paddingLeft: 40 }}
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
              {loading ? <span className="spinner" /> : <><ArrowRight size={17} /> Sign In</>}
            </button>
          </form>

          {/* Quick fill demo */}
          <div style={{ marginTop: 20, padding: 14, background: 'var(--bg-card2)', borderRadius: 10, border: '1px solid var(--bg-border)' }}>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>Demo Accounts</p>
            <button
              onClick={() => setForm({ email: 'arjun@example.com', password: 'password123' })}
              style={{ fontSize: 12, color: 'var(--blue)', background: 'none', marginRight: 12 }}
            >
              Customer →
            </button>
            <button
              onClick={() => setForm({ email: 'ravi.driver@example.com', password: 'password123' })}
              style={{ fontSize: 12, color: 'var(--success)', background: 'none' }}
            >
              Driver →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
