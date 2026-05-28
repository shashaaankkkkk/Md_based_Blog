import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (login(username, password)) {
      navigate('/explore');
    } else {
      setError('Invalid credentials');
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '4rem auto', fontFamily: 'var(--font-sans)' }}>
      <h2 style={{ fontSize: '1.8rem', fontWeight: 500, letterSpacing: '-0.02em', marginBottom: '2rem' }}>
        Access Vault
      </h2>
      
      {error && (
        <div style={{ padding: '0.8rem', backgroundColor: 'color-mix(in srgb, #ff5555 10%, transparent)', color: '#ff5555', borderRadius: '4px', marginBottom: '1.5rem', fontSize: '0.9rem', fontFamily: 'var(--font-mono)' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--muted-text)', fontSize: '0.9rem' }}>Username</label>
          <input 
            type="text" 
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={{ 
              width: '100%', padding: '0.8rem', 
              backgroundColor: 'transparent', 
              border: '1px solid var(--border-color)',
              color: 'var(--text-color)',
              borderRadius: '4px',
              fontFamily: 'var(--font-mono)'
            }}
          />
        </div>
        
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--muted-text)', fontSize: '0.9rem' }}>Password</label>
          <input 
            type="password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ 
              width: '100%', padding: '0.8rem', 
              backgroundColor: 'transparent', 
              border: '1px solid var(--border-color)',
              color: 'var(--text-color)',
              borderRadius: '4px',
              fontFamily: 'var(--font-mono)'
            }}
          />
        </div>

        <button 
          type="submit"
          style={{
            marginTop: '1rem',
            padding: '0.8rem',
            backgroundColor: 'var(--text-color)',
            color: 'var(--bg-color)',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontFamily: 'var(--font-mono)',
            fontWeight: 'bold',
            transition: 'opacity 0.2s'
          }}
          onMouseOver={(e) => e.currentTarget.style.opacity = 0.9}
          onMouseOut={(e) => e.currentTarget.style.opacity = 1}
        >
          Unlock
        </button>
      </form>
      
      <div style={{ marginTop: '2rem', fontSize: '0.8rem', color: 'var(--muted-text)', fontFamily: 'var(--font-mono)' }}>
        Default login is admin / password
      </div>
    </div>
  );
}
