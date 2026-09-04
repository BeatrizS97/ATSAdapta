// Plugin do Vite que simula, em desenvolvimento, o comportamento das
// funções serverless da pasta api/.
// Com este plugin, "npm run dev" já sobe o frontend e as rotas de api/
// juntos, no mesmo processo e na mesma porta do Vite — sem precisar da CLI
// da Vercel instalada.
//
// Cada arquivo de api/ continua exatamente igual (função "handler(req, res)"
// no formato da Vercel). A Vercel, em produção, adiciona alguns métodos ao
// objeto "res" que os handlers usam (res.status(), res.json(), res.send())
// e já entrega "req.body" pronto para as rotas JSON. Como aqui é o servidor
// Node puro do Vite, esses métodos não existem por padrão — por isso este
// arquivo os adiciona ("polyfill") antes de chamar cada handler, replicando
// o mesmo contrato que a Vercel oferece.

import handlerPerguntas from "../api/perguntas.js";
import handlerAdaptar from "../api/adaptar.js";
import handlerGerarArquivo from "../api/gerar-arquivo.js";

// Adiciona ao "res" os métodos que os handlers de api/ esperam encontrar.
function adicionarMetodosDeResposta(res) {
  res.status = function (codigo) {
    res.statusCode = codigo;
    return res;
  };

  res.json = function (dados) {
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(JSON.stringify(dados));
  };

  res.send = function (dados) {
    if (Buffer.isBuffer(dados) || typeof dados === "string") {
      res.end(dados);
      return;
    }
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(JSON.stringify(dados));
  };

  return res;
}

// Lê o corpo da requisição e faz o parse como JSON, replicando o
// comportamento automático que a Vercel já faz por padrão. Usado apenas
// pelas rotas que leem "req.body" diretamente (adaptar.js e
// gerar-arquivo.js). A rota de perguntas.js NÃO usa isso: ela recebe um
// upload multipart e faz o próprio parse com a biblioteca "formidable" (ver
// api/perguntas.js), então o corpo dela nunca deve ser consumido aqui antes.
function lerCorpoComoJson(req) {
  return new Promise((resolve, reject) => {
    let corpoBruto = "";

    req.on("data", (pedaco) => {
      corpoBruto += pedaco;
    });

    req.on("end", () => {
      if (!corpoBruto) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(corpoBruto));
      } catch (erro) {
        reject(new Error("Corpo da requisição não é um JSON válido."));
      }
    });

    req.on("error", reject);
  });
}

function criarRotaApi(handler, { corpoJson = false } = {}) {
  return async (req, res) => {
    adicionarMetodosDeResposta(res);

    try {
      if (corpoJson) {
        req.body = await lerCorpoComoJson(req);
      }

      await handler(req, res);
    } catch (erro) {
      console.error(erro);
      if (!res.headersSent) {
        res.status(500).json({ erro: "Erro interno no servidor de desenvolvimento." });
      }
    }
  };
}

// Observação: como os handlers são importados uma única vez, no momento em
// que o Vite sobe, alterações dentro de api/ ou lib/ exigem reiniciar o
// "npm run dev" para valerem (não têm hot-reload). Para o frontend
// (src/), o hot-reload do Vite continua funcionando normalmente.
export function apiDevPlugin() {
  return {
    name: "api-dev-plugin",
    configureServer(server) {
      server.middlewares.use("/api/perguntas", criarRotaApi(handlerPerguntas));
      server.middlewares.use("/api/adaptar", criarRotaApi(handlerAdaptar, { corpoJson: true }));
      server.middlewares.use(
        "/api/gerar-arquivo",
        criarRotaApi(handlerGerarArquivo, { corpoJson: true })
      );
    },
  };
}
