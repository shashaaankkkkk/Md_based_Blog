import { GITHUB_CONFIG } from '../config';

// Helper to parse frontmatter client-side for an individual file
export function parseFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  const data = {};
  if (match) {
    const yaml = match[1];
    yaml.split('\n').forEach(line => {
      const parts = line.split(':');
      if (parts.length >= 2) {
        const key = parts[0].trim();
        let value = parts.slice(1).join(':').trim();
        if (value.startsWith('[') && value.endsWith(']')) {
          value = value.slice(1, -1).split(',').map(s => s.trim());
        }
        data[key] = value;
      }
    });
    return { data, content: content.slice(match[0].length) };
  }
  return { data, content };
}

// Fetch the visibility registry (public.json)
let cachedVisibility = null;
let visibilitySha = null;

export async function fetchVisibilityConfig() {
  if (cachedVisibility) return cachedVisibility;
  
  const headers = { 'Accept': 'application/vnd.github.v3+json' };
  if (GITHUB_CONFIG.token) {
    headers['Authorization'] = `Bearer ${GITHUB_CONFIG.token}`;
  }

  try {
    const url = `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/public.json?ref=${GITHUB_CONFIG.branch}`;
    const res = await fetch(url, { headers });
    
    if (res.status === 404) {
      // If the config file doesn't exist yet, we return null to indicate "no config"
      // This allows the app to default to everything being public initially.
      cachedVisibility = null;
      return cachedVisibility;
    }
    
    if (!res.ok) throw new Error("Failed to fetch public.json");
    
    const data = await res.json();
    visibilitySha = data.sha;
    
    const content = decodeURIComponent(escape(atob(data.content)));
    cachedVisibility = JSON.parse(content);
    return cachedVisibility;
  } catch (err) {
    console.warn("Could not load public.json, defaulting to null", err);
    cachedVisibility = null;
    return cachedVisibility;
  }
}

// Update the visibility registry on GitHub
export async function updateVisibilityConfig(publicPaths) {
  const headers = {
    'Accept': 'application/vnd.github.v3+json',
    'Content-Type': 'application/json'
  };
  if (GITHUB_CONFIG.token) {
    headers['Authorization'] = `Bearer ${GITHUB_CONFIG.token}`;
  }

  // Base64 encode the JSON payload securely
  const contentStr = JSON.stringify(publicPaths, null, 2);
  const base64Content = btoa(unescape(encodeURIComponent(contentStr)));

  const body = {
    message: "Update CMS Visibility Settings",
    content: base64Content,
    branch: GITHUB_CONFIG.branch
  };

  if (visibilitySha) {
    body.sha = visibilitySha;
  }

  const url = `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/public.json`;
  
  const res = await fetch(url, {
    method: 'PUT',
    headers,
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    throw new Error(`Failed to update public.json: ${res.statusText}`);
  }
  
  const data = await res.json();
  visibilitySha = data.content.sha;
  cachedVisibility = publicPaths;
  return true;
}

// Fetch the entire vault structure from GitHub API
export async function fetchVaultIndex() {
  const headers = {};
  if (GITHUB_CONFIG.token) {
    // Using Bearer is the recommended standard for GitHub fine-grained PATs
    headers['Authorization'] = `Bearer ${GITHUB_CONFIG.token}`;
  }

  let res = await fetch(GITHUB_CONFIG.getTreeUrl(), { headers });
  
  // If 404, the default branch might be 'master' instead of 'main'
  if (res.status === 404 && GITHUB_CONFIG.branch === 'main') {
    const masterUrl = GITHUB_CONFIG.getTreeUrl().replace('/trees/main?', '/trees/master?');
    res = await fetch(masterUrl, { headers });
    if (res.ok) {
      // Update config for future calls
      GITHUB_CONFIG.branch = 'master';
    }
  }

  if (!res.ok) {
    throw new Error(`GitHub API error: ${res.status}`);
  }

  const data = await res.json();
  
  if (!data.tree) {
    // If there's no tree, GitHub probably returned an error message (like Bad Credentials or Rate Limit)
    throw new Error(data.message || "Unknown GitHub API error (no tree returned)");
  }

  const publicPaths = await fetchVisibilityConfig();

  // Filter markdown files and build our index format
  const index = data.tree
    .filter(item => item.type === 'blob' && item.path.toLowerCase().endsWith('.md'))
    .map(item => {
      const relativePath = item.path;
      const routePath = relativePath.replace(/\.md$/, '');
      const parts = relativePath.split('/');
      const filename = parts.pop();
      const folders = parts;
      
      // Infer title from filename
      const title = filename.replace(/\.md$/, '');
      
      // Infer date from filename if it looks like a date (e.g., YYYY-MM-DD), otherwise just use empty or null
      let date = null;
      const dateMatch = title.match(/^(\d{4}-\d{2}-\d{2})/);
      if (dateMatch) {
        date = new Date(dateMatch[1]).toISOString();
      } else {
        // Fallback: try to see if it's in a year/month structure like journal/2026/05/28.md
        const possibleYear = folders.find(f => /^\d{4}$/.test(f));
        if (possibleYear) {
          // Just a rough fallback for timeline sorting
          date = new Date(possibleYear).toISOString(); 
        }
      }

      // Public / Private Logic using the central registry
      // If publicPaths is null, the registry doesn't exist yet, so we default ALL notes to Public.
      const isPublic = publicPaths === null ? true : publicPaths.includes(relativePath);

      return {
        title,
        date,
        path: relativePath,
        routePath,
        folders,
        isPublic,
        // Since we don't fetch contents here, tags/frontmatter are empty initially
        tags: [],
        frontmatter: {}
      };
    });

  return index;
}

// Fetch a single raw markdown file
export async function fetchNoteContent(path) {
  const headers = {
    'Accept': 'application/vnd.github.v3.raw'
  };
  if (GITHUB_CONFIG.token) {
    headers['Authorization'] = `Bearer ${GITHUB_CONFIG.token}`;
  }
  
  const res = await fetch(GITHUB_CONFIG.getRawUrl(path), { headers });
  if (!res.ok) {
    throw new Error(`Failed to fetch note: ${res.status}`);
  }
  
  const text = await res.text();
  
  // If the API ignored our Accept header and returned JSON with base64, decode it
  try {
    const json = JSON.parse(text);
    if (json.encoding === 'base64' && json.content) {
      // Use decodeURIComponent to correctly handle unicode characters in base64
      return decodeURIComponent(escape(atob(json.content)));
    }
  } catch(e) {
    // It's not JSON, so it must be the raw text as requested!
  }
  
  return text;
}
