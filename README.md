# Trabalho Acadêmico — Criando Agentes de IA com o Microsoft Copilot Studio

Site estático que apresenta as atividades práticas do curso da DIO sobre
criação e personalização de chatbots e agentes de IA com a Power Platform.

## Conteúdo

- **Trabalho 1** — Configuração do ambiente Microsoft 365 e formas de criar um Copilot.
- **Trabalho 2** — Personalização de tópicos, respostas, mensagens de erro e qualidade das respostas.

As anotações originais estão em [`Trabalho.md`](./Trabalho.md).

## Assistente de IA (Google Gemini)

A página traz um widget de chat (`assets/chatbot.js`) que consulta o modelo
`gemini-2.0-flash` da API do Google Gemini.

- A **chave da API não fica no código**. No primeiro envio o widget pede a chave
  e a guarda apenas no `localStorage` do navegador (botão "trocar chave" para
  removê-la).
- Como é um site estático, a chave usada fica visível no navegador do usuário.
  Para produção, coloque um backend proxy entre a página e a API do Gemini.
- Gere a chave em <https://aistudio.google.com/apikey>.

## Como visualizar

Abra o arquivo `index.html` no navegador, ou sirva a pasta localmente:

```bash
python3 -m http.server 8000
# depois acesse http://localhost:8000
```

## Estrutura

```
.
├── index.html        # página do trabalho
├── assets/
│   └── styles.css    # estilos
├── Trabalho.md       # anotações originais
└── README.md
```
