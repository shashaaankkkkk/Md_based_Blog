export const GITHUB_CONFIG = {
  owner: 'shashaaankkkkk',
  repo: 'Obsidian-Vault-',
  branch: 'main',
  // In a real deployed app, the token should be kept secure.
  // We use Vite's env variables: import.meta.env.VITE_GITHUB_TOKEN
  // If not available, we fallback to the provided token so it works without restarting Vite.
  token: import.meta.env.VITE_GITHUB_TOKEN,

  getRawUrl(path) {
    // We cannot use raw.githubusercontent.com with Authorization headers in the browser due to CORS preflight failures.
    // Instead, we use the GitHub API contents endpoint which supports CORS properly.
    return `https://api.github.com/repos/${this.owner}/${this.repo}/contents/${path}?ref=${this.branch}`;
  },

  getTreeUrl() {
    return `https://api.github.com/repos/${this.owner}/${this.repo}/git/trees/${this.branch}?recursive=1`;
  }
};
