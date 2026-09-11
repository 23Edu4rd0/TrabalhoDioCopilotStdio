// Proxy para o Gemini: guarda a chave como segredo do lado do servidor.
// O site chama este Worker; ninguém precisa colar chave nenhuma.

const ALLOWED_ORIGINS = new Set([
  "https://23edu4rd0.github.io",
]);

const MODELS = ["gemini-3.6-flash", "gemini-flash-lite-latest"];
// Tenta o modelo principal; se sobrecarregado (429/503), cai pro "lite".
function urlFor(model) {
  return `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
}

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

    let lastStatus = 502;
    let lastBody = JSON.stringify({ error: "falha ao consultar o Gemini" });

    for (let i = 0; i < MODELS.length; i++) {
      const upstream = await fetch(`${urlFor(MODELS[i])}?key=${env.GEMINI_API_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
      });
      lastStatus = upstream.status;
      lastBody = await upstream.text();
      const overloaded = upstream.status === 429 || upstream.status === 503;
      if (upstream.ok || !overloaded || i === MODELS.length - 1) break;
    }

    return new Response(lastBody, {
      status: lastStatus,
      headers: { ...headers, "Content-Type": "application/json" },
    });
  },
};
