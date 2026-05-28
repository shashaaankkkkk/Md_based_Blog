---
title: Architecture of the minimal journal
date: 2026-05-28T09:00:00Z
tags: [architecture, code]
---

# Architecture of the minimal journal

Building this directly mirroring my Obsidian vault.

## Goals

- No database (use filesystem)
- Markdown rendering (GFM + frontmatter)
- Tactile feel

The `vault-index.json` generates at build time. We use Vite's `import.meta.glob` to load raw markdown on demand.

* Quiet transitions
* Minimal dependencies

> "Good design is as little design as possible." - Dieter Rams
