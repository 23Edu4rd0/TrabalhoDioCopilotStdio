# Companhia das Máscaras Gregas — O Nascimento do Teatro Grego

Site estático do trabalho "O Nascimento do Teatro Grego e Como Isso Influencia o Mundo até Hoje", produzido pela Companhia das Máscaras Gregas (2º Ano A — Artes e História da Cultura Ocidental).

## Conteúdo do site

- `index.html` — página inicial com a apresentação do tema, o vídeo e a versão em podcast (áudio) da explicação, e acesso ao agente de IA.
- `teoria.html` — trabalho teórico completo (13 capítulos + referências bibliográficas).
- `slides.html` — a apresentação em slides usada no vídeo, com a fala dividida entre os apresentadores Gabriel Morato e Maria Luíza.
- `assets/media/apresentacao.mp4` — vídeo da apresentação (a mesma faixa de áudio é oferecida como "podcast" em um player de áudio separado).
- `assets/css/style.css` — estilos do site.
- `assets/js/ai-agent.js` — lógica do agente de IA.
- `data/knowledge.json` — banco de conhecimento (base de dados) usado pelo agente de IA, construído a partir do trabalho teórico e dos slides.

## Como o agente de IA funciona

O agente é 100% client-side (não depende de nenhuma API paga ou chave externa). Ele:

1. Carrega `data/knowledge.json`, que contém trechos do trabalho teórico e dos slides organizados por tópico (origem religiosa, gêneros dramáticos, arquitetura, máscaras, dramaturgos, música, legado, etc.).
2. Ao receber uma pergunta, tokeniza o texto, remove palavras irrelevantes (stopwords) e calcula uma pontuação de relevância entre a pergunta e cada trecho do banco de dados (comparando palavras-chave e títulos).
3. Retorna o(s) trecho(s) mais relevante(s), sempre citando a fonte (o tópico do trabalho de onde a resposta veio) — sem inventar informações fora do material produzido pela equipe.

Para expandir as respostas do agente, basta editar `data/knowledge.json` e adicionar novos objetos `{ "id", "title", "tags", "text" }`.

## Como visualizar

Como o site usa `fetch()` para carregar o banco de dados, é preciso servir os arquivos por HTTP (não abrir o `index.html` direto pelo `file://`). Exemplo local:

```bash
python3 -m http.server 8080
```

Depois acesse `http://localhost:8080`.

Para publicar, basta hospedar a pasta em GitHub Pages, Netlify, Vercel ou qualquer servidor estático.
