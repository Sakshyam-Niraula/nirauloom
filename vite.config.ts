import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'gemini-dev-proxy',
      configureServer(server) {
        server.middlewares.use('/api/gemini', async (req, res) => {
          if (req.method !== 'POST') {
            res.statusCode = 405;
            res.end(JSON.stringify({ error: 'Method not allowed' }));
            return;
          }

          let bodyStr = '';
          req.on('data', chunk => { bodyStr += chunk; });
          req.on('end', async () => {
            const apiKey = process.env.GEMINI_API_KEY;
            if (!apiKey) {
              res.statusCode = 503;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'GEMINI_API_KEY not configured on dev server', fallback: true }));
              return;
            }

            try {
              const payload = JSON.parse(bodyStr || '{}');
              const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
              
              const body: Record<string, unknown> = {
                contents: [{ parts: [{ text: payload.prompt }] }],
                generationConfig: {
                  temperature: 0.2,
                  maxOutputTokens: 600,
                  responseMimeType: 'application/json',
                }
              };

              if (payload.systemInstruction) {
                body.systemInstruction = { parts: [{ text: payload.systemInstruction }] };
              }

              const geminiRes = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
              });

              const data = await geminiRes.json();
              const candidate = data.candidates?.[0]?.content?.parts?.[0]?.text || null;

              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ text: candidate }));
            } catch (err: unknown) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: String(err), fallback: true }));
            }
          });
        });
      }
    }
  ],
  server: {
    port: 3000,
  },
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          supabase: ['@supabase/supabase-js'],
          icons: ['lucide-react'],
        },
      },
    },
  },
});
