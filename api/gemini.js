// Função serverless (Vercel): proxy para o Gemini.
// A chave fica só em process.env.GEMINI_API_KEY (variável de ambiente do
// projeto na Vercel) — nunca chega ao navegador do visitante.

const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent";

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

  try {
    const upstream = await fetch(`${GEMINI_URL}?key=${key}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await upstream.text();
    res.status(upstream.status);
    res.setHeader("Content-Type", "application/json");
    res.send(data);
  } catch (err) {
    res.status(502).json({ error: "falha ao consultar o Gemini" });
  }
};
