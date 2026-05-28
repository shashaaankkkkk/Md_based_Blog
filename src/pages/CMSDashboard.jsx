import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchVaultIndex, updateVisibilityConfig } from '../services/github';
import { FileText, Lock, Globe, Loader2, Folder, ChevronRight, ChevronDown } from 'lucide-react';

export default function CMSDashboard() {
  const [tree, setTree] = useState({});
  const [posts, setPosts] = useState([]); // keep flat list for toggle logic
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState(null);

  const buildTree = (data) => {
    const t = {};
    data.forEach(note => {
      let current = t;
      note.folders.forEach(folder => {
        if (!current[folder]) current[folder] = { _type: 'folder', children: {} };
        current = current[folder].children;
      });
      current[note.path] = { _type: 'file', data: note };
    });
    setTree(t);
  };

  const loadData = () => {
    fetchVaultIndex()
      .then(data => {
        setPosts(data);
        buildTree(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Dashboard error:", err);
        setError("Failed to fetch vault index from GitHub. " + err.message);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggle = async (path, currentIsPublic) => {
    setUpdating(path);
    try {
      let publicPaths = posts.filter(p => p.isPublic).map(p => p.path);
      
      if (currentIsPublic) {
        publicPaths = publicPaths.filter(p => p !== path);
      } else {
        publicPaths.push(path);
      }

      await updateVisibilityConfig(publicPaths);
      
      const updatedPosts = posts.map(p => {
        if (p.path === path) return { ...p, isPublic: !currentIsPublic };
        return p;
      });
      setPosts(updatedPosts);
      buildTree(updatedPosts); // Rebuild tree to reflect new status
    } catch (err) {
      console.error(err);
      alert("Failed to update visibility: " + err.message);
    } finally {
      setUpdating(null);
    }
  };

  const TreeNode = ({ name, node, depth = 0 }) => {
    const [isOpen, setIsOpen] = useState(depth < 1);
    const indent = depth * 16;
    
    if (node._type === 'folder') {
      return (
        <div style={{ paddingLeft: indent }}>
          <div 
            onClick={() => setIsOpen(!isOpen)}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '6px', 
              padding: '6px 0', cursor: 'pointer',
              color: 'var(--text-color)', fontFamily: 'var(--font-sans)', fontSize: '0.95rem', fontWeight: 500
            }}
          >
            {isOpen ? <ChevronDown size={16} color="var(--muted-text)" /> : <ChevronRight size={16} color="var(--muted-text)" />}
            <Folder size={16} color="var(--muted-text)" />
            {name}
          </div>
          {isOpen && (
            <div style={{ marginLeft: '14px', borderLeft: '1px solid var(--border-color)', paddingLeft: '8px', borderBottom: 'none' }}>
              {Object.entries(node.children).map(([childName, childNode]) => (
                <TreeNode key={childName} name={childName} node={childNode} depth={depth + 1} />
              ))}
            </div>
          )}
        </div>
      );
    }
    
    // File node
    const post = node.data;
    return (
      <div style={{ 
        marginLeft: indent, 
        margin: '4px 0', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        padding: '6px 12px',
        borderRadius: '6px',
        backgroundColor: 'color-mix(in srgb, var(--text-color) 2%, transparent)',
        border: '1px solid color-mix(in srgb, var(--border-color) 50%, transparent)'
      }}>
        <Link 
          to={`/admin/note/${post.routePath}`}
          style={{ 
            display: 'flex', alignItems: 'center', gap: '8px',
            color: 'var(--text-color)', fontSize: '0.9rem',
            textDecoration: 'none',
            flex: 1
          }}
          onMouseOver={(e) => e.currentTarget.style.color = 'var(--muted-text)'}
          onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-color)'}
        >
          <FileText size={14} color="var(--muted-text)" />
          {post.title}
        </Link>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button 
            onClick={() => handleToggle(post.path, post.isPublic)}
            disabled={updating === post.path}
            style={{
              background: 'none',
              border: 'none',
              cursor: updating === post.path ? 'wait' : 'pointer',
              padding: 0,
              opacity: updating === post.path ? 0.5 : 1
            }}
          >
            {post.isPublic ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', padding: '4px 8px', borderRadius: '12px', backgroundColor: 'color-mix(in srgb, #4ade80 15%, transparent)', color: '#16a34a', fontWeight: 500 }}>
                <Globe size={12} /> Public
              </span>
            ) : (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', padding: '4px 8px', borderRadius: '12px', backgroundColor: 'color-mix(in srgb, #f87171 15%, transparent)', color: '#dc2626', fontWeight: 500 }}>
                <Lock size={12} /> Private
              </span>
            )}
          </button>
          {updating === post.path && <Loader2 size={14} className="spin" style={{ position: 'absolute', right: '40px' }} />}
        </div>
      </div>
    );
  };

  return (
    <div style={{ maxWidth: '1000px', width: '100%' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-sans)', fontSize: '2rem', fontWeight: 600, letterSpacing: '-0.02em', margin: 0 }}>
            Dashboard
          </h1>
          <p style={{ color: 'var(--muted-text)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
            Manage all markdown files across your GitHub vault.
          </p>
        </div>
        <div style={{ background: 'color-mix(in srgb, var(--text-color) 4%, transparent)', padding: '0.5rem 1rem', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 500 }}>
          {posts.length} Total Files
        </div>
      </header>

      {error ? (
        <div style={{ color: '#ff5555', fontFamily: 'var(--font-mono)', fontSize: '0.9rem' }}>{error}</div>
      ) : loading ? (
        <div style={{ color: 'var(--muted-text)', fontFamily: 'var(--font-mono)', fontSize: '0.9rem' }}>Loading vault...</div>
      ) : (
        <div style={{ 
          border: '1px solid var(--border-color)', 
          borderRadius: '8px', 
          padding: '1.5rem',
          backgroundColor: 'color-mix(in srgb, var(--text-color) 1%, transparent)',
          minHeight: '400px'
        }}>
          {Object.keys(tree).length > 0 ? (
            Object.entries(tree).map(([name, node]) => (
              <TreeNode key={name} name={name} node={node} />
            ))
          ) : (
            <div style={{ color: 'var(--muted-text)', fontFamily: 'var(--font-mono)', fontSize: '0.9rem' }}>
              Vault is empty.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
