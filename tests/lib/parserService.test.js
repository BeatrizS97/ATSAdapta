// pdf-parse e mammoth fazem parsing binário real de arquivos; aqui isolamos
// a lógica de roteamento por mimetype de extrairTextoDoArquivo, mockando as
// duas bibliotecas para não depender de arquivos PDF/DOCX reais no teste.
// Como o projeto roda os testes via babel-jest (ESM transpilado para CJS),
// usamos jest.mock "clássico", que é içado (hoisted) automaticamente pelo
// Babel/Jest antes dos imports abaixo.
jest.mock("pdf-parse", () => jest.fn(async () => ({ text: "texto extraído do pdf" })));

jest.mock("mammoth", () => ({
  extractRawText: jest.fn(async () => ({ value: "texto extraído do docx" })),
}));

import { extrairTextoDoArquivo } from "../../lib/parserService.js";

describe("extrairTextoDoArquivo", () => {
  test("extrai texto de um PDF usando pdf-parse", async () => {
    const texto = await extrairTextoDoArquivo(Buffer.from("conteudo"), "application/pdf");

    expect(texto).toBe("texto extraído do pdf");
  });

  test("extrai texto de um DOCX usando mammoth", async () => {
    const texto = await extrairTextoDoArquivo(
      Buffer.from("conteudo"),
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    );

    expect(texto).toBe("texto extraído do docx");
  });

  test("lança erro para um mimetype não suportado", async () => {
    await expect(extrairTextoDoArquivo(Buffer.from("conteudo"), "image/png")).rejects.toThrow(
      "Formato de arquivo não suportado. Envie um arquivo PDF ou DOCX."
    );
  });
});
