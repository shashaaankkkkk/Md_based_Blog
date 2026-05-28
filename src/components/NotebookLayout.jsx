import { Link, useLocation } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';
import { FolderTree, Calendar, Home, ShieldAlert, Network } from 'lucide-react';

export default function NotebookLayout({ children }) {
  const location = useLocation();
  
  const NavItem = ({ to, icon: Icon, label }) => {
    const isActive = location.pathname === to || (to !== '/' && location.pathname.startsWith(to));
    return (
      <Link 
        to={to} 
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
    <div className="app-container">
      <aside className="sidebar">
        <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontWeight: 600, letterSpacing: '-0.02em' }}>My Vault</div>
          <ThemeToggle />
        </div>
        
        <nav style={{ display: 'flex', flexDirection: 'column' }}>
          <NavItem to="/" icon={Home} label="Home" />
          <NavItem to="/timeline" icon={Calendar} label="Journal" />
          <NavItem to="/explore" icon={FolderTree} label="Explore" />
          <NavItem to="/graph" icon={Network} label="Graph View" />
        </nav>
        
        <div style={{ marginTop: 'auto', paddingTop: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Link 
            to="/admin"
            style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--muted-text)', textDecoration: 'none', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}
          >
            <ShieldAlert size={14} /> Admin
          </Link>
          
          <div style={{ fontSize: '0.8rem', color: 'var(--muted-text)', fontFamily: 'var(--font-mono)' }}>
            System Online
          </div>
        </div>
      </aside>
      <main className="main-content fade-in" key={location.pathname} style={{ maxWidth: 'calc(var(--content-width) + 8rem)' }}>
        {children}
      </main>
    </div>
  );
}
