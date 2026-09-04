/** @jest-environment jsdom */
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../../src/App.jsx";

function criarArquivoFake(nome, tipo) {
  return new File(["conteudo"], nome, { type: tipo });
}

function mockarFetchSequencia(respostas) {
  let chamada = 0;
  global.fetch = jest.fn(() => {
    const respostaAtual = respostas[Math.min(chamada, respostas.length - 1)];
    chamada += 1;
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve(respostaAtual),
    });
  });
}

beforeEach(() => {
  // scrollIntoView não existe no jsdom por padrão.
  Element.prototype.scrollIntoView = jest.fn();
  window.scrollTo = jest.fn();
});

afterEach(() => {
  jest.restoreAllMocks();
});

async function preencherEEnviarFormulario(usuario) {
  const arquivo = criarArquivoFake("curriculo.pdf", "application/pdf");
  await usuario.upload(screen.getByLabelText(/currículo \(pdf ou docx\)/i), arquivo);
  await usuario.type(screen.getByLabelText("Descrição da vaga"), "Vaga de teste");
  await usuario.click(screen.getByRole("button", { name: /adaptar currículo/i }));
}

describe("App - rolagem da página", () => {
  test("rola para o topo da página quando perguntas complementares da IA aparecem", async () => {
    const usuario = userEvent.setup();

    mockarFetchSequencia([
      {
        textoCurriculo: "texto extraído",
        descricaoVaga: "Vaga de teste",
        perguntas: [{ id: "p1", pergunta: "Em quantos % você reduziu o tempo de resposta?" }],
      },
    ]);

    render(<App />);
    await preencherEEnviarFormulario(usuario);

    await waitFor(() => {
      expect(screen.getByText("Antes de gerar seu currículo")).toBeInTheDocument();
    });

    expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: "smooth" });
  });

  test("rola até o início do currículo adaptado quando o resultado fica pronto", async () => {
    const usuario = userEvent.setup();

    mockarFetchSequencia([
      {
        // Sem perguntas: App já parte direto para a adaptação final.
        textoCurriculo: "texto extraído",
        descricaoVaga: "Vaga de teste",
        perguntas: [],
      },
      {
        curriculoAdaptado: {
          nome: "Maria Souza",
          cargoAlvo: "",
          contato: "",
          resumoProfissional: "",
          experiencias: [],
          formacao: [],
          habilidades: [],
          idioma: "pt",
        },
        percentualAntes: 40,
        percentualDepois: 70,
        palavrasChaveEncontradas: [],
        palavrasChaveFaltando: [],
      },
    ]);

    render(<App />);
    await preencherEEnviarFormulario(usuario);

    await waitFor(() => {
      expect(screen.getByText("Currículo adaptado")).toBeInTheDocument();
    });

    expect(Element.prototype.scrollIntoView).toHaveBeenCalledWith({
      behavior: "smooth",
      block: "start",
    });
  });
});
