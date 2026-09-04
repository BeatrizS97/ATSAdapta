/** @jest-environment jsdom */
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import FormularioCurriculo from "../../src/components/FormularioCurriculo.jsx";

function criarArquivoFake(nome, tipo, tamanhoBytes = 1024) {
  return new File(["a".repeat(tamanhoBytes)], nome, { type: tipo });
}

describe("FormularioCurriculo", () => {
  test("chama onErro quando o formulário é enviado sem arquivo", async () => {
    const onErro = jest.fn();
    const onEnviar = jest.fn();
    const usuario = userEvent.setup();

    render(<FormularioCurriculo onEnviar={onEnviar} carregando={false} onErro={onErro} />);

    await usuario.type(screen.getByLabelText("Descrição da vaga"), "Vaga de teste");
    await usuario.click(screen.getByRole("button", { name: /adaptar currículo/i }));

    expect(onErro).toHaveBeenCalledWith("Selecione um arquivo de currículo (PDF ou DOCX).");
    expect(onEnviar).not.toHaveBeenCalled();
  });

  test("chama onErro quando o formulário é enviado sem descrição da vaga", async () => {
    const onErro = jest.fn();
    const onEnviar = jest.fn();
    const usuario = userEvent.setup();

    render(<FormularioCurriculo onEnviar={onEnviar} carregando={false} onErro={onErro} />);

    const arquivo = criarArquivoFake("curriculo.pdf", "application/pdf");
    await usuario.upload(screen.getByLabelText(/currículo \(pdf ou docx\)/i), arquivo);

    await usuario.click(screen.getByRole("button", { name: /adaptar currículo/i }));

    expect(onErro).toHaveBeenCalledWith("Cole a descrição da vaga.");
    expect(onEnviar).not.toHaveBeenCalled();
  });

  // Este cenário simula um arquivo de extensão inválida chegando ao <input>
  // por fora do seletor nativo do navegador (ex.: drag-and-drop, ou o
  // próprio seletor em um navegador que não respeita "accept"). Por isso
  // usamos fireEvent.change em vez de userEvent.upload: o userEvent já
  // simula a filtragem do seletor de arquivos do navegador pelo atributo
  // "accept" e nem chega a disparar o evento para arquivos fora do filtro —
  // o que impediria testar a validação (extensaoValida) que o próprio
  // componente faz como segunda camada de proteção.
  test("rejeita arquivo com extensão não suportada e nunca o adiciona ao estado", () => {
    const onErro = jest.fn();
    const onEnviar = jest.fn();

    render(<FormularioCurriculo onEnviar={onEnviar} carregando={false} onErro={onErro} />);

    const arquivoInvalido = criarArquivoFake("foto.png", "image/png");
    const inputArquivo = screen.getByLabelText(/currículo \(pdf ou docx\)/i);

    fireEvent.change(inputArquivo, { target: { files: [arquivoInvalido] } });

    expect(onErro).toHaveBeenCalledWith("Formato não suportado. Envie um arquivo PDF ou DOCX.");
    expect(screen.queryByText("foto.png")).not.toBeInTheDocument();
  });

  test("envia arquivo e descrição válidos, com as opções padrão corretas", async () => {
    const onErro = jest.fn();
    const onEnviar = jest.fn();
    const usuario = userEvent.setup();

    render(<FormularioCurriculo onEnviar={onEnviar} carregando={false} onErro={onErro} />);

    const arquivo = criarArquivoFake("curriculo.pdf", "application/pdf");
    await usuario.upload(screen.getByLabelText(/currículo \(pdf ou docx\)/i), arquivo);
    await usuario.type(screen.getByLabelText("Descrição da vaga"), "Vaga de Desenvolvedor Front-End");

    await usuario.click(screen.getByRole("button", { name: /adaptar currículo/i }));

    expect(onErro).not.toHaveBeenCalled();
    expect(onEnviar).toHaveBeenCalledTimes(1);

    const [arquivoEnviado, descricaoEnviada, opcoes] = onEnviar.mock.calls[0];
    expect(arquivoEnviado.name).toBe("curriculo.pdf");
    expect(descricaoEnviada).toBe("Vaga de Desenvolvedor Front-End");
    // Padrões definidos em FormularioCurriculo: tradução desligada e
    // perguntas complementares da IA ligadas por padrão.
    expect(opcoes).toEqual({ traduzirIngles: false, permitirPerguntas: true });
  });

  test("envia opções alteradas quando o usuário marca/desmarca as checkboxes", async () => {
    const onErro = jest.fn();
    const onEnviar = jest.fn();
    const usuario = userEvent.setup();

    render(<FormularioCurriculo onEnviar={onEnviar} carregando={false} onErro={onErro} />);

    const arquivo = criarArquivoFake(
      "curriculo.docx",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    );
    await usuario.upload(screen.getByLabelText(/currículo \(pdf ou docx\)/i), arquivo);
    await usuario.type(screen.getByLabelText("Descrição da vaga"), "Vaga de teste");

    await usuario.click(screen.getByLabelText(/gerar currículo em inglês/i));
    await usuario.click(screen.getByLabelText(/permitir que a ia faça perguntas/i));

    await usuario.click(screen.getByRole("button", { name: /adaptar currículo/i }));

    const [, , opcoes] = onEnviar.mock.calls[0];
    expect(opcoes).toEqual({ traduzirIngles: true, permitirPerguntas: false });
  });

  test("botão de enviar fica desabilitado enquanto carregando é true", () => {
    render(<FormularioCurriculo onEnviar={jest.fn()} carregando onErro={jest.fn()} />);

    expect(screen.getByRole("button", { name: /adaptando currículo/i })).toBeDisabled();
  });
});