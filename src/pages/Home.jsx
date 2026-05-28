import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div className="fade-in" style={{ maxWidth: 'var(--content-width)' }}>
      <header style={{ marginBottom: '4rem' }}>
        <h1 style={{ fontFamily: 'var(--font-sans)', fontSize: '2.5rem', fontWeight: 500, letterSpacing: '-0.02em', marginBottom: '1rem' }}>
          Quiet Digital Notebook
        </h1>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '1rem', color: 'var(--muted-text)', lineHeight: 1.6 }}>
          A minimal, read-only interface exploring thoughts, journals, and logs.
        </p>
      </header>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <section>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 500, marginBottom: '1rem' }}>Wander</h2>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <Link to="/explore" style={{ textDecoration: 'none', color: 'var(--text-color)', borderBottom: '1px dashed var(--muted-text)', paddingBottom: '2px' }}>
              Explore the Vault
            </Link>
            <span style={{ color: 'var(--muted-text)' }}>/</span>
            <Link to="/timeline" style={{ textDecoration: 'none', color: 'var(--text-color)', borderBottom: '1px dashed var(--muted-text)', paddingBottom: '2px' }}>
              Read the Journal
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
