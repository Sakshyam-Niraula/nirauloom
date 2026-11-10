// Cloudflare Pages Function: /api/gemini
// Securely proxies requests to Google Gemini without exposing GEMINI_API_KEY to the client

interface Env {
  GEMINI_API_KEY?: string;
}

export const onRequestPost = async (context: { request: Request; env: Env }) => {
  const { request, env } = context;

  // Retrieve server-side API key (never sent to client)
  const apiKey = env.GEMINI_API_KEY;

  if (!apiKey) {
    return new Response(
      JSON.stringify({
        error: 'GEMINI_API_KEY is not configured on the server environment.',
        fallback: true
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  try {
    const payload = await request.json() as { prompt: string; systemInstruction?: string };

    if (!payload?.prompt) {
      return new Response(
        JSON.stringify({ error: 'Missing prompt in request body.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const body: Record<string, unknown> = {
      contents: [
        {
          parts: [{ text: payload.prompt }]
        }
      ],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 600,
        responseMimeType: 'application/json',
      }
    };

    if (payload.systemInstruction) {
      body.systemInstruction = {
        parts: [{ text: payload.systemInstruction }]
      };
    }

    const geminiRes = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      return new Response(
        JSON.stringify({ error: `Gemini API error: ${geminiRes.status}`, details: errText, fallback: true }),
        { status: geminiRes.status, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const data = await geminiRes.json() as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
    const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text || null;

    return new Response(
      JSON.stringify({ text: candidateText }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown server error';
    return new Response(
      JSON.stringify({ error: message, fallback: true }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
