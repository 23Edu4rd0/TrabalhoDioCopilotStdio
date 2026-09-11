// Proxy para o Gemini: guarda a chave como segredo do lado do servidor.
// O site chama este Worker; ninguém precisa colar chave nenhuma.

const ALLOWED_ORIGINS = new Set([
  "https://23edu4rd0.github.io",
]);

const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent";

function corsHeaders(origin) {
  const allow = ALLOWED_ORIGINS.has(origin) ? origin : "https://23edu4rd0.github.io";
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const headers = corsHeaders(origin);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers });
    }
    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405, headers });
    }
    if (!ALLOWED_ORIGINS.has(origin)) {
      return new Response(JSON.stringify({ error: "origin not allowed" }), {
        status: 403,
        headers: { ...headers, "Content-Type": "application/json" },
      });
    }

    let body;
    try {
      body = await request.text();
    } catch (e) {
      return new Response(JSON.stringify({ error: "bad body" }), {
        status: 400,
        headers: { ...headers, "Content-Type": "application/json" },
      });
    }
    // limite simples de tamanho pra evitar abuso
    if (body.length > 20000) {
      return new Response(JSON.stringify({ error: "payload too large" }), {
        status: 413,
        headers: { ...headers, "Content-Type": "application/json" },
      });
    }

    const upstream = await fetch(`${GEMINI_URL}?key=${env.GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });

    const respBody = await upstream.text();
    return new Response(respBody, {
      status: upstream.status,
      headers: { ...headers, "Content-Type": "application/json" },
    });
  },
};
