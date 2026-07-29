# KSL Intelligence

A hybrid, prompt-driven website builder for macOS. Ollama handles quick local
edits while OpenAI handles new websites and larger changes. React components
render the website reliably; the models never write raw HTML.

## Requirements

- Node.js 20 or newer
- Ollama
- 8 GB RAM or more
- `qwen2.5-coder:3b`
- An OpenAI API key for hybrid mode

## First-time setup

```bash
ollama pull qwen2.5-coder:3b
npm install
```

Set the API key in your terminal before starting KSL Intelligence:

```bash
export OPENAI_API_KEY="your-key"
```

To make it available automatically on your Mac, put that line in `~/.zshrc`,
then open a new Terminal window. The key is read only by the local Vite server.
It is never sent to the browser or included in an exported website.

You can optionally choose a different OpenAI model:

```bash
export OPENAI_MODEL="gpt-5.6-terra"
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
- Automatic hybrid routing between local Ollama and OpenAI
- Manual Ollama-only and OpenAI-only modes
- Local image uploads (automatically resized)
- Free stock-image search through Wikimedia Commons with creator attribution
- Desktop, tablet and mobile previews
- Undo, browser autosave and JSON export
- Standalone website ZIP export with HTML, CSS and embedded image assets

## If Ollama returns 404

Check the model exists:

```bash
ollama list
```

If `qwen2.5-coder:3b` is missing:

```bash
ollama pull qwen2.5-coder:3b
```

The Vite proxy sends `/api/chat` to Ollama at `http://127.0.0.1:11434`.
The local `/api/openai` route reads `OPENAI_API_KEY` on your Mac and forwards
only the website request to the OpenAI Responses API.
