# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Humanoid Horizons is a strategic board game as a web app. Players build a humanoid staffing agency, deploy humanoids on jobs, manage suppliers, comply with continental regulations, and compete over 10 rounds. The MVP supports 1-4 players on the same screen (local multiplayer, no backend database).

The game is in Dutch (UI text, game terms, event messages).

## Commands

```bash
npm install          # Install dependencies
npm run dev          # Start dev server (hot reload)
npm run build        # Production build (adapter-node)
npm run preview      # Preview production build locally
npm run check        # Svelte type checking

docker compose build                     # Build Docker image
docker compose up -d                     # Run on port 3000
docker compose down                      # Stop
docker compose up -d --build             # Rebuild and restart
```

## Architecture

Three strict layers, kept separate by design:

### Layer 1 — Game Domain (`src/lib/game/`)
Pure TypeScript, no UI or framework imports. All game rules live here.
- `types.ts` — all domain types (GameState, PlayerState, GameAction, etc.)
- `constants.ts` — game data: humanoid cards, suppliers, jobs, continent config, market events
- `engine.ts` — `createGame()`, `processAction()`, job scoring, win/loss checks, turn flow
- `store.ts` — Svelte writable stores wrapping the engine; the only bridge between domain and UI
- `tutorial.ts` — step-by-step tutorial definitions; guides player through one practice round

Key design: `processAction()` takes a `GameState` + `GameAction`, returns `ActionResult` with the new state. All mutations go through `structuredClone` — the engine never mutates in place.

### Layer 2 — 3D Rendering (`src/lib/three/`)
- `BoardScene.ts` — Three.js scene with orthographic camera, extruded continent shapes positioned like a world map, ocean background, city props, trade route lines. Handles raycasting for click/hover interactions. Accepts `GameState` via `updateGameState()`.

### Layer 3 — UI (`src/routes/`)
SvelteKit pages using Svelte 5 runes (`$state`, `$derived`, `$effect`).
- `/` — Home with player count setup
- `/game` — Main game screen: 3D board center, job sidebar left, player/humanoid sidebar right, action bar bottom
- `/how-to-play` — Rules page

## Game Flow

1. Player selects 1-4 players on home screen, optionally enables tutorial → `startNewGame()` → redirects to `/game`
   - Tutorial: guided overlay walks through one practice round (buy humanoid, assign job, end turn), then resets to a fresh round 1. Can be skipped at any step.
2. Each player gets 2 action points per round
3. Actions: buy humanoid, assign job, train, upgrade, contract supplier, expand region, compliance check
4. Job success is scored: skill match + reliability + training + compliance - risk - condition penalty
5. After all players end turn → new round with fresh jobs, possible market event
6. After 10 rounds: win if 2/3 goals met (cash > 0, reputation >= 50, 6+ successful jobs)

## Technology

- **SvelteKit** with `@sveltejs/adapter-node` (runs in Docker as Node server)
- **Svelte 5** with runes mode enabled project-wide (via vite.config.ts compilerOptions)
- **Three.js** for 3D board rendering (orthographic camera, stylized low-poly look)
- **TypeScript** strict mode
- No database — all state is in-memory via Svelte stores
- No authentication — local multiplayer only

## Docker

Service name: `humanoid-horizons-claude`. Multi-stage build: node:22-slim builder + slim runner. Exposes port 3000.

