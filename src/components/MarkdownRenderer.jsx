import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkFrontmatter from 'remark-frontmatter';
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';

const Mermaid = ({ chart }) => {
  const [svg, setSvg] = useState('');
  
  useEffect(() => {
    if (window.mermaid) {
      const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
      window.mermaid.render(id, chart)
        .then(result => setSvg(result.svg))
        .catch(e => {
          console.error("Mermaid syntax error:", e);
          setSvg(`<div style="color:red; font-family:monospace">Mermaid syntax error</div>`);
        });
    }
  }, [chart]);

  return <div className="mermaid-container" dangerouslySetInnerHTML={{ __html: svg }} />;
};

export default function MarkdownRenderer({ content }) {
  
  const renderers = {
    a: ({ node, ...props }) => {
      let href = props.href;
      if (href) {
        // Decode in case it was encoded by our regex
        href = decodeURIComponent(href);
      }
      const isInternal = href && !href.startsWith('http');
      if (isInternal) {
        // Strip .md and format path
        let to = href.replace(/\.md$/, '');
        // simple simulation of Obsidian [[wikilink]] which might just be a filename
        if (!to.startsWith('/')) {
          const isAdmin = window.location.pathname.startsWith('/admin');
          to = isAdmin ? `/admin/note/${to}` : `/note/${to}`;
        }
        return <Link to={to} {...props} />;
      }
      return <a target="_blank" rel="noopener noreferrer" {...props} />;
    },
    code({node, inline, className, children, ...props}) {
      const match = /language-(\w+)/.exec(className || '');
      if (!inline && match && match[1] === 'mermaid') {
        return <Mermaid chart={String(children).replace(/\n$/, '')} />;
      }
      return <code className={className} {...props}>{children}</code>;
    }
  };

  // Robust pre-processor to turn [[Link]] or [[Link|Alias]] into standard markdown links
  const processedContent = content.replace(/\[\[(.*?)\]\]/g, (match, p1) => {
    const parts = p1.split('|');
    const target = parts[0];
    const alias = parts[1] || target;
    // URL encode the target so markdown parser doesn't break on spaces!
    return `[${alias}](${encodeURIComponent(target)})`;
  });

  return (
    <div className="prose">
      <ReactMarkdown 
        remarkPlugins={[remarkGfm, remarkFrontmatter]}
        components={renderers}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  );
}
