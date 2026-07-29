import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

function openAiLocalRoute() {
  return {
    name: 'ksl-openai-local-route',
    configureServer(server) {
      server.middlewares.use('/api/openai', async (request, response) => {
        if (request.method !== 'POST') {
          response.statusCode = 405
          response.end('Method not allowed')
          return
        }

        const apiKey = process.env.OPENAI_API_KEY
        if (!apiKey) {
          response.statusCode = 503
          response.setHeader('Content-Type', 'application/json')
          response.end(JSON.stringify({
            error: 'OPENAI_API_KEY is not set on this Mac.',
          }))
          return
        }

        try {
          const chunks = []
          for await (const chunk of request) chunks.push(chunk)
          const { instructions, input } = JSON.parse(Buffer.concat(chunks).toString('utf8'))

          const openAiResponse = await fetch('https://api.openai.com/v1/responses', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: process.env.OPENAI_MODEL || 'gpt-5.6-terra',
              reasoning: { effort: 'low' },
              instructions,
              input,
            }),
          })

          const data = await openAiResponse.json()
          if (!openAiResponse.ok) {
            response.statusCode = openAiResponse.status
            response.setHeader('Content-Type', 'application/json')
            response.end(JSON.stringify({
              error: data?.error?.message || `OpenAI returned ${openAiResponse.status}.`,
            }))
            return
          }

          const outputText = data.output
            ?.flatMap((item) => item.content || [])
            .find((item) => item.type === 'output_text')
            ?.text

          if (!outputText) throw new Error('OpenAI returned an empty response.')

          response.statusCode = 200
          response.setHeader('Content-Type', 'application/json')
          response.end(JSON.stringify({
            text: outputText,
            model: data.model || process.env.OPENAI_MODEL || 'gpt-5.6-terra',
          }))
        } catch (error) {
          response.statusCode = 500
          response.setHeader('Content-Type', 'application/json')
          response.end(JSON.stringify({
            error: error.message || 'The local OpenAI route failed.',
          }))
        }
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), openAiLocalRoute()],
  server: {
    proxy: {
      '/api/chat': {
        target: 'http://127.0.0.1:11434',
        changeOrigin: true,
      },
    },
  },
})
