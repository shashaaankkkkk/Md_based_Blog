import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MarkdownRenderer from '../components/MarkdownRenderer';
import { fetchNoteContent, parseFrontmatter, fetchVaultIndex } from '../services/github';

export default function NotePage() {
  const { '*' : routePath } = useParams();
  const navigate = useNavigate();
  const [content, setContent] = useState(null);
  const [metadata, setMetadata] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadNote() {
      setLoading(true);
      setError(null);
      setContent(null);
      
      try {
        // Find note in index to check visibility
        const index = await fetchVaultIndex();
        
        // Let NotePage try to match exactly or by wikilink
        const targetFilename = routePath.toLowerCase() + '.md';
        let match = index.find(n => n.routePath === routePath);
        
        if (!match) {
           // Wikilink fallback check
           match = index.find(n => n.path.toLowerCase().endsWith(targetFilename));
           if (match && match.routePath !== routePath) {
             navigate(`/note/${match.routePath}`, { replace: true });
             return;
           }
        }
        
        if (!match) {
           throw new Error("Note not found in index.");
        }
        
        // SECURITY GATE
        // If not logged in, you cannot view private notes
        // Because NotePage is used by BOTH public and admin layouts, we need to check auth context
        // Actually, NotePage doesn't have auth context right now.
        // Let's just fetch it normally. If it's private and we're in the public route, maybe we should block it.
        // Wait, instead of adding AuthContext here, if someone guesses the URL of a private note on the public site, 
        // they could theoretically read it because the token is in the frontend.
        // Since this is a client-side app with a baked-in token, security is already implicitly trusted to the client.
        // But for UX, we can just block it if it's not public. 
        if (!match.isPublic && !window.location.pathname.startsWith('/admin')) {
           // Basic UX protection for public routes
           // In a real app with a backend, this would return 403.
           throw new Error("This note is private.");
        }

        const githubPath = match.path;
        const rawText = await fetchNoteContent(githubPath);
        
        // Parse frontmatter on the client side
        const parsed = parseFrontmatter(rawText);
        
        setContent(parsed.content);
        
        // Use frontmatter title if available, fallback to filename
        const filename = routePath.split('/').pop();
        const fallbackTitle = filename.replace(/\.md$/, '');
        
        setMetadata({
          title: parsed.data.title || fallbackTitle,
          date: parsed.data.date || null,
          tags: parsed.data.tags || []
        });
        
      } catch (err) {
        console.error("Failed to load note...", err);
        setError(err.message === "This note is private." ? "This note is private." : 'Error loading note from GitHub repository. Please verify the path and repository settings.');
      } finally {
        setLoading(false);
      }
    }
    
    loadNote();
  }, [routePath]);

  if (error) {
    return <div style={{ color: '#ff5555', fontFamily: 'var(--font-mono)' }}>{error}</div>;
  }

  if (loading || !content) {
    return <div style={{ color: 'var(--muted-text)', fontFamily: 'var(--font-mono)', opacity: 0.5 }}>Loading from GitHub...</div>;
  }

  return (
    <article className="fade-in" style={{ maxWidth: 'var(--content-width)' }}>
      {metadata && (
        <header style={{ marginBottom: '3rem' }}>
          <h1 style={{ fontFamily: 'var(--font-sans)', fontSize: '2.5rem', fontWeight: 600, letterSpacing: '-0.02em', marginBottom: '1rem', lineHeight: 1.2 }}>
            {metadata.title}
          </h1>
          
          <div style={{ display: 'flex', gap: '1.5rem', fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--muted-text)' }}>
            {metadata.date && (
              <time dateTime={metadata.date}>
                {new Date(metadata.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
              </time>
            )}
            {metadata.tags && metadata.tags.length > 0 && (
              <div style={{ display: 'flex', gap: '8px' }}>
                {metadata.tags.map(tag => (
                  <span key={tag}>#{tag}</span>
                ))}
              </div>
            )}
          </div>
        </header>
      )}
      
      <MarkdownRenderer content={content} />
      
      <footer style={{ marginTop: '5rem', borderTop: '1px solid var(--border-color)', paddingTop: '2rem', display: 'flex', justifyContent: 'space-between', color: 'var(--muted-text)', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
        <div>~ EOF ~</div>
      </footer>
    </article>
  );
}
