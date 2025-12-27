# 3D Chat

## Overview
This project is a Three.js demo evolving into a "3D Chat" experience. The scene keeps the existing
floating metallic rings as animated background flair while a world-space chat panel renders
speech bubbles in 3D. A DOM input overlay provides reliable typing and sends messages into
the 3D chat.

## Features
- Floating 3D chat board with left/right lanes for friend/me messages
- World-space speech bubbles with text wrapping and status states
- Scrollable chat history via mouse wheel
- DOM input overlay with Enter-to-send
- Mock transport for incoming friend messages and send acks
- Minimal debug controls for layout and rendering

## Run
Download [Node.js](https://nodejs.org/en/download/).

```bash
# Install dependencies (only the first time)
npm install

# Run the local server at localhost:8080
npm run dev

# Build for production in the dist/ directory
npm run build
```

## Project Goals
- Keep the ring visuals intact while layering a stable, readable UI-first chat
- Separate concerns: chat domain, layout engine, Three.js rendering
- Avoid per-frame allocations; dispose of all resources on teardown

## Structure (planned)
- `src/scene/SceneApp` owns renderer, camera, scene, loop, resize
- `src/modules/RingsModule` preserves the existing rings visuals
- `src/chat/*` handles message store and transport (no Three.js)
- `src/layout/*` computes chat bubble layout (pure logic)
- `src/scene/ChatBoard` renders bubble views based on layout

## Notes
This repo is being refactored in phases to keep the app runnable at each step. See
`docs/DEV_NOTES.md` for discovery notes and phase progress once created.
