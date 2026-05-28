import { Link, useLocation, useNavigate } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';
import { LayoutDashboard, LogOut, Network } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function AdminLayout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  
  const NavItem = ({ to, icon: Icon, label, onClick }) => {
    const isActive = location.pathname === to || (to !== '/admin' && location.pathname.startsWith(to));
    return (
      <Link 
        to={to} 
        onClick={onClick}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '8px 12px',
          borderRadius: '6px',
          color: isActive ? 'var(--text-color)' : 'var(--muted-text)',
          backgroundColor: isActive ? 'color-mix(in srgb, var(--text-color) 4%, transparent)' : 'transparent',
          marginBottom: '4px',
          transition: 'all 0.2s',
          fontSize: '0.95rem',
          textDecoration: 'none'
        }}
      >
        <Icon size={16} />
        {label}
      </Link>
    );
  };

  return (
    <div className="layout">
      <aside className="sidebar" style={{ backgroundColor: 'color-mix(in srgb, var(--bg-color) 95%, var(--text-color))', borderRight: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '3rem' }}>
          <h1 style={{ fontSize: '1rem', fontWeight: 600, letterSpacing: '-0.02em', margin: 0, fontFamily: 'var(--font-sans)' }}>
            Admin Control
          </h1>
          <ThemeToggle />
        </div>
        
        <nav style={{ display: 'flex', flexDirection: 'column' }}>
          <NavItem to="/admin" icon={LayoutDashboard} label="Dashboard" />
          <NavItem to="/admin/graph" icon={Network} label="Graph View" />
        </nav>
        
        <div style={{ marginTop: 'auto', paddingTop: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <button 
            onClick={() => { logout(); navigate('/'); }}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', color: '#ff5555', cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: '0.85rem', padding: 0 }}
          >
            <LogOut size={14} /> Sign Out
          </button>
          
          <div style={{ fontSize: '0.8rem', color: 'var(--muted-text)', fontFamily: 'var(--font-mono)' }}>
            <Link to="/" style={{ color: 'inherit', textDecoration: 'underline' }}>View Public Site</Link>
          </div>
        </div>
      </aside>
      <main className="main-content fade-in" key={location.pathname} style={{ maxWidth: '100%' }}>
        {children}
      </main>
    </div>
  );
}
