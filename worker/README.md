# Proxy do Gemini (Cloudflare Worker)

Guarda a chave da API do Gemini como segredo do servidor e faz proxy das
requisições do site — o navegador do visitante nunca vê a chave.

Deploy:
```
npm i -g wrangler   # ou use npx
wrangler login
wrangler secret put GEMINI_API_KEY
wrangler deploy
```

Só aceita requisições com `Origin: https://23edu4rd0.github.io` (ver
`ALLOWED_ORIGINS` em `src/worker.js`).
