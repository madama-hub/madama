import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import cesium from 'vite-plugin-cesium'
import type { IncomingMessage, ServerResponse } from 'node:http'

type JsonRecord = Record<string, unknown>

const readJsonBody = async (req: IncomingMessage): Promise<JsonRecord> => {
  const chunks: Buffer[] = []
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  }
  const raw = Buffer.concat(chunks).toString('utf-8')
  return raw ? (JSON.parse(raw) as JsonRecord) : {}
}

const deepseekProxyPlugin = (): Plugin => ({
  name: 'deepseek-proxy',
  configureServer(server) {
    server.middlewares.use('/api/deepseek-summary', async (req, res) => {
      const response = res as ServerResponse
      if (req.method !== 'POST') {
        response.statusCode = 405
        response.setHeader('Content-Type', 'application/json')
        response.end(JSON.stringify({ error: 'Method not allowed' }))
        return
      }

      try {
        const key = process.env.DEEPSEEK_API_KEY || process.env.VITE_DEEPSEEK_API_KEY
        if (!key) {
          response.statusCode = 500
          response.setHeader('Content-Type', 'application/json')
          response.end(JSON.stringify({ error: 'Missing DEEPSEEK_API_KEY on server' }))
          return
        }

        const body = await readJsonBody(req as IncomingMessage)
        const payload = (body.payload as JsonRecord | undefined) ?? body

        const upstream = await fetch('https://api.deepseek.com/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${key}`,
          },
          body: JSON.stringify({
            model: 'deepseek-chat',
            temperature: 0.3,
            max_tokens: 180,
            messages: [
              {
                role: 'system',
                content:
                  'You are an operations intelligence assistant. Return a concise summary report with 3 bullets: Situation, Risk, Recommendation. Keep it under 90 words.',
              },
              {
                role: 'user',
                content: JSON.stringify(payload),
              },
            ],
          }),
        })

        const data = (await upstream.json()) as {
          choices?: Array<{ message?: { content?: string } }>
        }

        if (!upstream.ok) {
          response.statusCode = upstream.status
          response.setHeader('Content-Type', 'application/json')
          response.end(JSON.stringify({ error: data }))
          return
        }

        const text = data?.choices?.[0]?.message?.content?.trim() || ''
        response.statusCode = 200
        response.setHeader('Content-Type', 'application/json')
        response.end(JSON.stringify({ summary: text }))
      } catch (error: unknown) {
        response.statusCode = 500
        response.setHeader('Content-Type', 'application/json')
        response.end(JSON.stringify({ error: error instanceof Error ? error.message : 'DeepSeek proxy failed' }))
      }
    })
  },
})

export default defineConfig({
  plugins: [react(), cesium(), deepseekProxyPlugin()],
  define: {
    __DEEPSEEK_PROXY_ENABLED__: true,
  },
  server: {
    port: 5173,
  },
  preview: {
    port: 5173,
  },
})
