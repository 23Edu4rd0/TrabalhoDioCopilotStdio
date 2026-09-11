/*
 * Widget de chat com integração ao Google Gemini.
 *
 * Segurança: em um site estático a chave da API fica acessível a qualquer
 * visitante. Por isso a chave NÃO é embutida no código — ela é pedida ao
 * usuário e guardada apenas no localStorage do navegador. Para uso em
 * produção, troque a chamada direta por um backend que guarde a chave.
 */
(function () {
  "use strict";

  var API_URL =
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";
  var STORAGE_KEY = "gemini_api_key";

  var SYSTEM_PROMPT =
    "Você é um assistente do trabalho acadêmico sobre criação de agentes de IA " +
    "com o Microsoft Copilot Studio e a Power Platform. Responda em português, " +
    "de forma didática e objetiva. Os temas do trabalho são: configuração do " +
    "ambiente Microsoft 365, formas de criar um Copilot (modelos prontos, prompts " +
    "de IA e construção do zero) e personalização de tópicos, respostas, mensagens " +
    "de erro e qualidade das respostas.";

  var history = []; // [{ role: "user" | "model", text: string }]

  function getKey() {
    try {
      return localStorage.getItem(STORAGE_KEY) || "";
    } catch (e) {
      return "";
    }
  }

  function setKey(value) {
    try {
      if (value) localStorage.setItem(STORAGE_KEY, value);
      else localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      /* ignora indisponibilidade do storage */
    }
  }

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  function build() {
    var root = el("div", "chatbot");

    var toggle = el("button", "chatbot__toggle", "Assistente IA");
    toggle.setAttribute("aria-expanded", "false");

    var panel = el("div", "chatbot__panel");
    panel.hidden = true;

    var header = el("div", "chatbot__header");
    header.appendChild(el("span", null, "Assistente do trabalho"));
    var resetKey = el("button", "chatbot__link", "trocar chave");
    header.appendChild(resetKey);
    panel.appendChild(header);

    var log = el("div", "chatbot__log");
    panel.appendChild(log);

    var form = el("form", "chatbot__form");
    var input = el("input", "chatbot__input");
    input.type = "text";
    input.placeholder = "Digite sua pergunta...";
    input.autocomplete = "off";
    var send = el("button", "chatbot__send", "Enviar");
    send.type = "submit";
    form.appendChild(input);
    form.appendChild(send);
    panel.appendChild(form);

    root.appendChild(panel);
    root.appendChild(toggle);
    document.body.appendChild(root);

    function addMessage(role, text) {
      var msg = el("div", "chatbot__msg chatbot__msg--" + role, text);
      log.appendChild(msg);
      log.scrollTop = log.scrollHeight;
      return msg;
    }

    function ensureKey() {
      var key = getKey();
      if (key) return key;
      var entered = window.prompt(
        "Cole sua chave da API do Google Gemini (guardada apenas neste navegador):"
      );
      if (entered) {
        entered = entered.trim();
        setKey(entered);
        return entered;
      }
      return "";
    }

    toggle.addEventListener("click", function () {
      var open = panel.hidden;
      panel.hidden = !open;
      toggle.setAttribute("aria-expanded", String(open));
      if (open) input.focus();
      if (open && log.childElementCount === 0) {
        addMessage(
          "model",
          "Olá! Posso responder dúvidas sobre o trabalho de Copilot Studio."
        );
      }
    });

    resetKey.addEventListener("click", function () {
      setKey("");
      addMessage("model", "Chave removida. Ela será pedida no próximo envio.");
    });

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var text = input.value.trim();
      if (!text) return;

      var key = ensureKey();
      if (!key) {
        addMessage("model", "É necessário informar a chave da API para continuar.");
        return;
      }

      addMessage("user", text);
      history.push({ role: "user", text: text });
      input.value = "";
      input.disabled = true;
      send.disabled = true;

      var pending = addMessage("model", "…");

      callGemini(key)
        .then(function (reply) {
          pending.textContent = reply;
          history.push({ role: "model", text: reply });
        })
        .catch(function (err) {
          pending.textContent = "Erro: " + err.message;
          history.pop(); // remove a última pergunta para não poluir o contexto
        })
        .finally(function () {
          input.disabled = false;
          send.disabled = false;
          input.focus();
          log.scrollTop = log.scrollHeight;
        });
    });
  }

  function callGemini(key) {
    var body = {
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents: history.map(function (turn) {
        return { role: turn.role, parts: [{ text: turn.text }] };
      }),
      generationConfig: { temperature: 0.4 }
    };

    return fetch(API_URL + "?key=" + encodeURIComponent(key), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    }).then(function (res) {
      return res.json().then(function (data) {
        if (!res.ok) {
          var detail = data && data.error && data.error.message;
          throw new Error(detail || "HTTP " + res.status);
        }
        var parts =
          data &&
          data.candidates &&
          data.candidates[0] &&
          data.candidates[0].content &&
          data.candidates[0].content.parts;
        var textOut =
          parts &&
          parts
            .map(function (p) {
              return p.text || "";
            })
            .join("")
            .trim();
        if (!textOut) throw new Error("resposta vazia do modelo");
        return textOut;
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", build);
  } else {
    build();
  }
})();
