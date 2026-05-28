import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchVaultIndex, fetchNoteContent } from '../services/github';

export default function GraphView() {
  const containerRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;

    async function buildGraph() {
      try {
        const index = await fetchVaultIndex();
        // Map public notes
        const nodesData = index.filter(n => n.isPublic);
        
        const nodes = [];
        const links = [];
        
        // Chunk fetches to avoid browser concurrent connection limits (GitHub handles high limits, but browsers throttle)
        const chunkSize = 10;
        for (let i = 0; i < nodesData.length; i += chunkSize) {
          if (!active) return;
          const chunk = nodesData.slice(i, i + chunkSize);
          
          await Promise.all(chunk.map(async (note) => {
            try {
              const content = await fetchNoteContent(note.path);
              nodes.push({ id: note.title, path: note.routePath });
              
              const wikilinks = content.match(/\[\[(.*?)\]\]/g) || [];
              wikilinks.forEach(link => {
                const target = link.replace(/\[\[|\]\]/g, '').split('|')[0];
                links.push({ source: note.title, target: target });
              });
            } catch (err) {
              console.error("Failed to fetch content for map:", note.path);
              nodes.push({ id: note.title, path: note.routePath });
            }
          }));
          
          setProgress(Math.round(((i + chunk.length) / nodesData.length) * 100));
        }

        if (!active) return;
        
        // Render D3 Graph
        renderGraph(nodes, links);
        setLoading(false);
      } catch (err) {
        if (!active) return;
        setError(err.message);
        setLoading(false);
      }
    }

    buildGraph();

    return () => { active = false; };
  }, []);

  const renderGraph = (nodes, links) => {
    if (!containerRef.current || !window.d3) return;
    const d3 = window.d3;
    
    // Clear previous
    d3.select(containerRef.current).selectAll("*").remove();

    const width = containerRef.current.clientWidth;
    const height = 600;

    // Filter out links to non-existent nodes to prevent D3 from crashing
    const nodeIds = new Set(nodes.map(n => n.id));
    const validLinks = links.filter(l => nodeIds.has(l.source) && nodeIds.has(l.target));

    const simulation = d3.forceSimulation(nodes)
      .force("link", d3.forceLink(validLinks).id(d => d.id).distance(120))
      .force("charge", d3.forceManyBody().strength(-400))
      .force("center", d3.forceCenter(width / 2, height / 2));

    const svg = d3.select(containerRef.current)
      .append("svg")
      .attr("width", width)
      .attr("height", height)
      .call(d3.zoom().on("zoom", (event) => {
        g.attr("transform", event.transform);
      }));

    const g = svg.append("g");

    const link = g.append("g")
      .attr("stroke", "var(--border-color)")
      .attr("stroke-opacity", 0.6)
      .selectAll("line")
      .data(validLinks)
      .join("line")
      .attr("stroke-width", 1.5);

    const node = g.append("g")
      .attr("stroke", "var(--bg-color)")
      .attr("stroke-width", 1.5)
      .selectAll("circle")
      .data(nodes)
      .join("circle")
      .attr("r", 8)
      .attr("fill", "#8b5cf6")
      .style("cursor", "pointer")
      .call(drag(simulation))
      .on("click", (event, d) => {
        // Handle navigation depending on context
        const isAdmin = window.location.pathname.startsWith('/admin');
        navigate(isAdmin ? `/admin/note/${d.path}` : `/note/${d.path}`);
      });

    node.append("title").text(d => d.id);

    const labels = g.append("g")
      .selectAll("text")
      .data(nodes)
      .join("text")
      .attr("dx", 12)
      .attr("dy", 4)
      .text(d => d.id)
      .style("font-family", "var(--font-mono)")
      .style("font-size", "11px")
      .style("fill", "var(--text-color)")
      .style("pointer-events", "none");

    simulation.on("tick", () => {
      link
        .attr("x1", d => d.source.x)
        .attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x)
        .attr("y2", d => d.target.y);

      node
        .attr("cx", d => d.x)
        .attr("cy", d => d.y);
        
      labels
        .attr("x", d => d.x)
        .attr("y", d => d.y);
    });

    function drag(simulation) {
      function dragstarted(event) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        event.subject.fx = event.subject.x;
        event.subject.fy = event.subject.y;
      }
      function dragged(event) {
        event.subject.fx = event.x;
        event.subject.fy = event.y;
      }
      function dragended(event) {
        if (!event.active) simulation.alphaTarget(0);
        event.subject.fx = null;
        event.subject.fy = null;
      }
      return d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended);
    }
  };

  return (
    <div style={{ width: '100%' }} className="fade-in">
      <h2 style={{ fontFamily: 'var(--font-sans)', fontSize: '1.8rem', fontWeight: 500, letterSpacing: '-0.02em', marginBottom: '1rem' }}>
        Map of Links
      </h2>
      <p style={{ color: 'var(--muted-text)', fontFamily: 'var(--font-mono)', fontSize: '0.9rem', marginBottom: '2rem' }}>
        An interactive constellation of your public thoughts.
      </p>

      {error ? (
        <div style={{ color: '#ff5555', fontFamily: 'var(--font-mono)' }}>{error}</div>
      ) : loading ? (
        <div style={{ color: 'var(--muted-text)', fontFamily: 'var(--font-mono)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div>Scanning vault... {progress}%</div>
          <div style={{ width: '200px', height: '4px', background: 'var(--border-color)', borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{ width: `${progress}%`, height: '100%', background: '#8b5cf6', transition: 'width 0.2s' }}></div>
          </div>
        </div>
      ) : (
        <div 
          ref={containerRef} 
          style={{ 
            width: '100%', 
            height: '600px', 
            border: '1px solid var(--border-color)', 
            borderRadius: '8px',
            backgroundColor: 'color-mix(in srgb, var(--text-color) 1%, transparent)',
            overflow: 'hidden'
          }} 
        />
      )}
    </div>
  );
}
