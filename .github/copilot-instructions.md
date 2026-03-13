# Conjakeions+ - Copilot Instructions

## Project Overview

**Purpose**: Word puzzle game with 915+ unique puzzles inspired by Connections - find 4 groups of 4 related words

**Type**: React Web Application  
**Tech Stack**: React 18.2, Vite 5.4, Node.js 18+, Nginx (production)  
**Deployment**: Docker containers (ghcr.io), Nginx static hosting  
**Repository**: https://github.com/slmingol/conjakeions-plus

## Features

- 16 words in 4x4 grid, 4 categories with difficulty levels (color-coded)
- Full game mechanics: select, submit, shuffle, clear
- 4 mistakes allowed, win/lose conditions, play again
- 915+ puzzles in puzzles.json (~45k lines)
- Responsive design (mobile/desktop)

## Build & Validation

### Development
```bash
npm install                # Install dependencies (React, Vite)
npm run dev                # Start Vite dev server at localhost:3000

# Docker development (hot reload)
podman compose -f docker-compose.dev.yml up
```

**Dev Server**: Vite with HMR, polling enabled for Docker compatibility

### Production Build
```bash
npm run build              # Vite build → dist/ (~3-4s)
                           # Runs prebuild: node update-version.js (updates public/version.json)
npm run preview            # Preview production build locally

# Docker production
podman compose up -d                           # Build and run with Nginx
podman compose -f docker-compose.prod.yml up -d  # Use prebuilt GHCR image
```

**Build Output**: Hashed assets in `dist/` (cache busting), sourcemaps disabled, Nginx serves static files

### Docker Usage
```bash
# Pull prebuilt image (recommended)
docker pull ghcr.io/slmingol/conjakeions-plus:latest

# Prebuilt production
podman compose -f docker-compose.prod.yml up -d

# Build from source
podman compose up -d

# Development mode
podman compose -f docker-compose.dev.yml up
```

## Project Layout

```
conjakeions-plus/
├── src/
│   ├── App.jsx              # Main game logic (~400 LOC)
│   ├── App.css              # Game styling (~300 LOC)
│   ├── index.jsx            # React entry point (~50 LOC)
│   ├── index.css            # Global styles (~150 LOC)
│   └── puzzles.json         # 915+ puzzles (~45k lines)
├── public/
│   ├── index.html           # HTML template
│   ├── logo.png             # Game logo
│   └── version.json         # Auto-generated version info
├── package.json             # Dependencies & scripts
├── vite.config.js           # Vite configuration
├── update-version.js        # Pre-build version update script
├── Dockerfile               # Multi-stage build (Node + Nginx)
├── Dockerfile.dev           # Dev container with hot reload
├── docker-compose.yml       # Production Docker setup
├── docker-compose.dev.yml   # Development Docker setup
├── docker-compose.prod.yml  # Prebuilt image deployment
├── nginx.conf               # Nginx config for production
├── docker-entrypoint.sh     # Logs version on container start
└── .github/workflows/
    ├── docker-build.yml     # Build & push to GHCR on main/tags
    ├── auto-version.yml     # Auto-bump version based on commit messages
    ├── cleanup-docker.yml   # Clean old GHCR images
    └── cleanup-artifacts.yml # Clean old GitHub artifacts
```

## Architecture

### Game Mechanics (src/App.jsx)
- **State Management**: useState hooks for selected words, solved groups, mistakes, game status
- **Selection Logic**: Max 4 words, toggle selection, clear button
- **Submission**: Check 4 selected words against puzzle groups, handle correct/incorrect
- **Shuffle**: Fisher-Yates shuffle remaining words
- **Win/Lose**: 4 groups solved = win, 4 mistakes = lose

### Puzzle Structure (src/puzzles.json)
```json
{
  "date": "2024-01-01",
  "categories": [
    { "category": "PLANETS", "words": ["MARS", "VENUS", "EARTH", "JUPITER"], "difficulty": 1 },
    ...
  ]
}
```
**Difficulty**: 1 (easiest, yellow) → 4 (hardest, purple)

### Build Pipeline
1. **prebuild**: `node update-version.js` → Updates `public/version.json` with package.json version + build timestamp
2. **build**: Vite bundles React app → `dist/` with hashed assets
3. **Docker**: Multi-stage build (Node for building, Nginx for serving)
4. **Entrypoint**: Logs version from `dist/version.txt` on container start

## CI/CD Workflows

### Docker Build & Push (docker-build.yml)
**Triggers**: Push to main, tags (`v*.*.*`), PRs, manual  
**Actions**: Checkout → Docker Buildx → Login GHCR → Build multi-arch → Push (if not PR)  
**Tags**: branch name, PR number, semver (version, major.minor), SHA, latest (main only)  
**Registry**: ghcr.io/slmingol/conjakeions-plus

### Auto Version Bump (auto-version.yml)
**Triggers**: Push to main (excluding package.json, version.json changes)  
**Logic**: Parse commit message → Bump version (major/minor/patch) → Commit & push  
**Bump Rules**:
- `BREAKING CHANGE` or `major:` → major version
- `feat:` or `feature:` → minor version
- Default → patch version

### Cleanup Workflows
- **cleanup-docker.yml**: Delete old/untagged GHCR images (retention policy)
- **cleanup-artifacts.yml**: Remove old GitHub Actions artifacts

## Development Workflow

1. **Add/Edit Puzzles**: Modify `src/puzzles.json` (915+ puzzles, maintain structure)
2. **Update Game Logic**: Edit `src/App.jsx` (selection, submission, shuffle, etc.)
3. **Test Locally**: `npm run dev` or `podman compose -f docker-compose.dev.yml up`
4. **Commit**: Use conventional commit messages (`feat:`, `fix:`, `BREAKING CHANGE`) for auto-versioning
5. **Push to Main**: Triggers auto-version → Docker build → Push to GHCR

**Versioning**: Handled automatically by auto-version.yml workflow. Current version: 2.15.21

## Configuration

**vite.config.js**: Dev server on port 3000, HMR overlay, polling for Docker, hashed output filenames  
**nginx.conf**: Serves static files from `/usr/share/nginx/html`, SPA fallback to index.html  
**Dockerfile**: Multi-stage (build with Node 18-alpine, serve with nginx:alpine)

## Known Issues

- **Large puzzles.json**: 45k lines (~2MB). Consider splitting into chunks for lazy loading if performance degrades.
- **Docker HMR**: Requires `usePolling: true` in Vite config for file watching to work in containers.

## Docker Deployment

**Production (Prebuilt)**:
```bash
podman compose -f docker-compose.prod.yml pull  # Update to latest
podman compose -f docker-compose.prod.yml up -d
```

**Production (Build from Source)**:
```bash
podman compose up -d --build
```

**Development**:
```bash
podman compose -f docker-compose.dev.yml up  # Hot reload on port 3000
```

## Documentation

- **README.md**: Game description, installation, project structure
- **README.docker.md**: Docker setup (prebuilt, production, development), commands

## Trust Statement

This project follows modern React/Vite best practices with automated versioning and Docker builds. CI/CD ensures every push to main is tested, versioned, and deployed to GHCR. The codebase is clean and well-structured with separation of game logic, styling, and puzzle data.

**Validation**: Run `npm run dev` for local testing. Docker builds validate on every PR via docker-build.yml workflow.
