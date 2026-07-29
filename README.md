# KSL Intelligence

A local, prompt-driven website builder for macOS. Ollama creates structured JSON;
React components render the website reliably. The model never writes raw HTML.

## Requirements

- Node.js 20 or newer
- Ollama
- 8 GB RAM or more
- `qwen2.5-coder:3b`

## First-time setup

```bash
ollama pull qwen2.5-coder:3b
npm install
```

## Run

Keep Ollama open, then run:

```bash
npm run dev
```

Open the local address Vite prints, normally <http://localhost:5173>.

## What it supports

- Websites for any prompt, rather than one preset business
- One to five pages
- Hero, features, products, testimonials, stats, pricing, team, gallery,
  FAQ, content, contact and call-to-action sections
- Conversation-based edits
- Local image uploads (automatically resized)
- Free stock-image search through Wikimedia Commons with creator attribution
- Desktop, tablet and mobile previews
- Undo, browser autosave and JSON export

## If Ollama returns 404

Check the model exists:

```bash
ollama list
```

If `qwen2.5-coder:3b` is missing:

```bash
ollama pull qwen2.5-coder:3b
```

The Vite proxy in `vite.config.js` sends `/api/chat` to Ollama at
`http://127.0.0.1:11434`.
