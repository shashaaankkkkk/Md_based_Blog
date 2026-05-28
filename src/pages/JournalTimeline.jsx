import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchVaultIndex } from '../services/github';

export default function JournalTimeline() {
  const [journals, setJournals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVaultIndex()
      .then(data => {
        // STRICT PUBLIC FILTERING
        const visibleData = data.filter(note => note.isPublic);
        
        // Treat all public notes as timeline entries, sorted by inferred date or fallback to bottom
        const dailyNotes = [...visibleData];
        
        // Sort chronologically descending
        dailyNotes.sort((a, b) => {
          if (!a.date) return 1;
          if (!b.date) return -1;
          return new Date(b.date) - new Date(a.date);
        });
        
        setJournals(dailyNotes);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  // Group by year and month
  const grouped = journals.reduce((acc, note) => {
    const d = note.date ? new Date(note.date) : new Date();
    const yearMonth = d.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
    if (!acc[yearMonth]) acc[yearMonth] = [];
    acc[yearMonth].push(note);
    return acc;
  }, {});

  return (
    <div style={{ maxWidth: 'var(--content-width)' }}>
      <h2 style={{ fontFamily: 'var(--font-sans)', fontSize: '1.8rem', fontWeight: 500, letterSpacing: '-0.02em', marginBottom: '3rem' }}>
        Journal Timeline
      </h2>
      
      {loading ? (
        <div style={{ color: 'var(--muted-text)', fontFamily: 'var(--font-mono)', fontSize: '0.9rem', opacity: 0.5 }}>
          Reading from vault...
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
          {Object.entries(grouped).map(([month, notes]) => (
            <section key={month}>
              <h3 style={{ fontSize: '1rem', color: 'var(--muted-text)', marginBottom: '1.5rem', fontFamily: 'var(--font-mono)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                {month}
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {notes.map(note => (
                  <Link 
                    key={note.path} 
                    to={`/note/${note.routePath}`}
                    style={{ 
                      textDecoration: 'none', 
                      color: 'var(--text-color)',
                      display: 'flex',
                      alignItems: 'baseline',
                      gap: '1rem',
                      padding: '0.5rem 0',
                      transition: 'opacity 0.2s'
                    }}
                    onMouseOver={e => e.currentTarget.style.opacity = 0.7}
                    onMouseOut={e => e.currentTarget.style.opacity = 1}
                  >
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--muted-text)', minWidth: '40px' }}>
                      {note.date ? new Date(note.date).getDate().toString().padStart(2, '0') : '--'}
                    </span>
                    <span style={{ fontSize: '1.05rem' }}>{note.title}</span>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
