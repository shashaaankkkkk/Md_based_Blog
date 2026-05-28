import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Folder, ChevronRight, ChevronDown } from 'lucide-react';
import { fetchVaultIndex } from '../services/github';

export default function VaultExplorer() {
  const [tree, setTree] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchVaultIndex()
      .then(data => {
        // Build tree
        const t = {};
        
        // STRICT PUBLIC FILTERING
        const visibleData = data.filter(note => note.isPublic);

        visibleData.forEach(note => {
          let current = t;
          note.folders.forEach(folder => {
            if (!current[folder]) current[folder] = { _type: 'folder', children: {} };
            current = current[folder].children;
          });
          current[note.path] = { _type: 'file', data: note };
        });
        setTree(t);
        setLoading(false);
      })
      .catch(err => {
        console.error("Could not load vault index from GitHub", err);
        setError("Could not load vault index from GitHub. Check console for details.");
        setLoading(false);
      });
  }, []);

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
              padding: '4px 0', cursor: 'pointer',
              color: 'var(--text-color)', fontFamily: 'var(--font-mono)', fontSize: '0.9rem'
            }}
          >
            {isOpen ? <ChevronDown size={14} color="var(--muted-text)" /> : <ChevronRight size={14} color="var(--muted-text)" />}
            <Folder size={14} color="var(--muted-text)" />
            {name}
          </div>
          {isOpen && (
            <div style={{ marginLeft: '14px', borderLeft: '1px solid var(--border-color)', paddingLeft: '8px' }}>
              {Object.entries(node.children).map(([childName, childNode]) => (
                <TreeNode key={childName} name={childName} node={childNode} depth={depth + 1} />
              ))}
            </div>
          )}
        </div>
      );
    }
    
    // File node
    return (
      <div style={{ paddingLeft: indent, margin: '4px 0' }}>
        <Link 
          to={`/note/${node.data.routePath}`}
          style={{ 
            display: 'flex', alignItems: 'center', gap: '6px',
            color: 'var(--text-color)', fontSize: '0.95rem',
            textDecoration: 'none'
          }}
          onMouseOver={(e) => e.currentTarget.style.color = 'var(--muted-text)'}
          onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-color)'}
        >
          <FileText size={14} color="var(--muted-text)" />
          {node.data.title}
        </Link>
      </div>
    );
  };

  return (
    <div>
      <h2 style={{ fontFamily: 'var(--font-sans)', fontSize: '1.8rem', fontWeight: 500, letterSpacing: '-0.02em', marginBottom: '2rem' }}>
        Vault Explorer
      </h2>
      <div style={{ marginTop: '2rem' }}>
        {error ? (
          <div style={{ color: '#ff5555', fontFamily: 'var(--font-mono)', fontSize: '0.9rem' }}>
            {error}
          </div>
        ) : loading ? (
          <div style={{ color: 'var(--muted-text)', fontFamily: 'var(--font-mono)', fontSize: '0.9rem', opacity: 0.5 }}>
            Fetching from GitHub...
          </div>
        ) : Object.keys(tree).length > 0 ? (
          Object.entries(tree).map(([name, node]) => (
            <TreeNode key={name} name={name} node={node} />
          ))
        ) : (
          <div style={{ color: 'var(--muted-text)', fontFamily: 'var(--font-mono)', fontSize: '0.9rem' }}>
            Vault is empty.
          </div>
        )}
      </div>
    </div>
  );
}
