// Função serverless (Vercel): proxy para o Gemini.
// A chave fica só em process.env.GEMINI_API_KEY (variável de ambiente do
// projeto na Vercel) — nunca chega ao navegador do visitante.

const MODELS = ["gemini-3.6-flash", "gemini-flash-lite-latest"];
// Tenta o modelo principal; se estiver sobrecarregado (429/503), cai pro
// "lite" (menor demanda) antes de desistir e devolver erro pro cliente
// (que aí usa a base de conhecimento local).

function urlFor(model) {
  return `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
}

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "method not allowed" });

  const key = process.env.GEMINI_API_KEY;
  if (!key) return res.status(500).json({ error: "GEMINI_API_KEY não configurada" });

  let payload = req.body;
  if (typeof payload === "string") {
    try { payload = JSON.parse(payload); } catch (e) { return res.status(400).json({ error: "JSON inválido" }); }
  }
  if (!payload || JSON.stringify(payload).length > 20000) {
    return res.status(400).json({ error: "payload inválido ou grande demais" });
  }

  let lastStatus = 502;
  let lastBody = JSON.stringify({ error: "falha ao consultar o Gemini" });

  for (let i = 0; i < MODELS.length; i++) {
    try {
      const upstream = await fetch(`${urlFor(MODELS[i])}?key=${key}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      lastStatus = upstream.status;
      lastBody = await upstream.text();

      const overloaded = upstream.status === 429 || upstream.status === 503;
      if (upstream.ok || (!overloaded) || i === MODELS.length - 1) {
        res.status(upstream.status);
        res.setHeader("Content-Type", "application/json");
        res.setHeader("X-Gemini-Model", MODELS[i]);
        return res.send(lastBody);
      }
      // sobrecarregado: tenta o próximo modelo da lista
    } catch (err) {
      lastStatus = 502;
      lastBody = JSON.stringify({ error: "falha ao consultar o Gemini" });
    }
  }

  res.status(lastStatus);
  res.setHeader("Content-Type", "application/json");
  res.send(lastBody);
};
