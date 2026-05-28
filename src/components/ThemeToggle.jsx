import { useState, useEffect } from 'react';
import { Moon, Sun } from 'lucide-react';

export default function ThemeToggle() {
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') || 'light';
    }
    return 'light';
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggle = () => setTheme(theme === 'light' ? 'dark' : 'light');

  return (
    <button 
      onClick={toggle}
      title="Toggle theme"
      style={{
        background: 'none',
        border: 'none',
        color: 'var(--muted-text)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        padding: '8px',
        borderRadius: '4px',
        transition: 'color 0.2s'
      }}
      onMouseOver={(e) => e.currentTarget.style.color = 'var(--text-color)'}
      onMouseOut={(e) => e.currentTarget.style.color = 'var(--muted-text)'}
    >
      {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
    </button>
  );
}
