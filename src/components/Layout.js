import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Package, MapPin, ClipboardList, LogOut, Truck, Zap } from 'lucide-react';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <nav style={{
        width: 220,
        background: 'var(--bg-card)',
        borderRight: '1px solid var(--bg-border)',
        display: 'flex',
        flexDirection: 'column',
        padding: '24px 16px',
        position: 'fixed',
        top: 0, left: 0, bottom: 0,
        zIndex: 100,
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 40 }}>
          <div style={{
            width: 36, height: 36,
            background: 'linear-gradient(135deg, var(--primary), var(--accent))',
            borderRadius: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Zap size={20} color="white" fill="white" />
          </div>
          <span style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 18, letterSpacing: '-0.5px' }}>
            Swift<span style={{ color: 'var(--primary)' }}>Drop</span>
          </span>
        </div>

        {/* User */}
        <div style={{
          background: 'var(--bg-card2)',
          border: '1px solid var(--bg-border)',
          borderRadius: 12,
          padding: '12px 14px',
          marginBottom: 24,
        }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>{user?.name}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{user?.role}</div>
        </div>

        {/* Nav links */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
          {user?.role !== 'DRIVER' && (
            <>
              <NavItem to="/" icon={<Package size={17} />} label="Home" />
              <NavItem to="/book" icon={<MapPin size={17} />} label="Send Parcel" />
              <NavItem to="/orders" icon={<ClipboardList size={17} />} label="My Orders" />
            </>
          )}
          {user?.role === 'DRIVER' && (
            <NavItem to="/driver" icon={<Truck size={17} />} label="Driver Dashboard" />
          )}
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 14px', borderRadius: 10,
            background: 'transparent', color: 'var(--text-muted)',
            fontSize: 14, fontWeight: 500,
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => { e.target.style.color = 'var(--error)'; e.target.style.background = 'rgba(255,69,96,0.1)'; }}
          onMouseLeave={e => { e.target.style.color = 'var(--text-muted)'; e.target.style.background = 'transparent'; }}
        >
          <LogOut size={17} />
          Logout
        </button>
      </nav>

      {/* Main content */}
      <main style={{ marginLeft: 220, flex: 1, minHeight: '100vh', background: 'var(--bg)' }}>
        <Outlet />
      </main>
    </div>
  );
}

function NavItem({ to, icon, label }) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      style={({ isActive }) => ({
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '10px 14px', borderRadius: 10,
        fontSize: 14, fontWeight: isActive ? 600 : 400,
        color: isActive ? 'var(--primary)' : 'var(--text-dim)',
        background: isActive ? 'var(--primary-glow)' : 'transparent',
        border: isActive ? '1px solid rgba(255,77,0,0.2)' : '1px solid transparent',
        transition: 'all 0.2s',
        textDecoration: 'none',
      })}
    >
      {icon}
      {label}
    </NavLink>
  );
}
