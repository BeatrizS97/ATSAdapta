import { gerarDocx } from "../../lib/geradores/docxGerador.js";
import {
  curriculoMinimo,
  criarCurriculoCompleto,
  criarCurriculoGrande,
  curriculoComCamposParciais,
  curriculosComContatoVariado,
} from "../fixtures/curriculo.js";

describe("gerarDocx", () => {
  test("gera um Buffer não vazio para um currículo mínimo", async () => {
    const buffer = await gerarDocx(curriculoMinimo);

    expect(Buffer.isBuffer(buffer)).toBe(true);
    expect(buffer.length).toBeGreaterThan(0);
  });

  test("o Buffer gerado começa com a assinatura de um arquivo .docx (zip: 'PK')", async () => {
    // Um .docx é, por baixo dos panos, um arquivo .zip. Todo arquivo zip
    // começa com a assinatura "PK" (bytes 0x50 0x4B).
    const buffer = await gerarDocx(curriculoMinimo);

    expect(buffer.slice(0, 2).toString("latin1")).toBe("PK");
  });

  test("gera um .docx para um currículo completo, em português, sem lançar exceção", async () => {
    const buffer = await gerarDocx(criarCurriculoCompleto("pt"));

    expect(Buffer.isBuffer(buffer)).toBe(true);
    expect(buffer.length).toBeGreaterThan(0);
  });

  test("gera um .docx para um currículo completo, em inglês, sem lançar exceção", async () => {
    const buffer = await gerarDocx(criarCurriculoCompleto("en"));

    expect(Buffer.isBuffer(buffer)).toBe(true);
    expect(buffer.length).toBeGreaterThan(0);
  });

  test("o documento gerado com mais conteúdo é maior que o documento mínimo", async () => {
    const bufferMinimo = await gerarDocx(curriculoMinimo);
    const bufferCompleto = await gerarDocx(criarCurriculoCompleto("pt"));

    expect(bufferCompleto.length).toBeGreaterThan(bufferMinimo.length);
  });

  test("gera um .docx para um currículo com muitas experiências e bullets longos, sem lançar exceção", async () => {
    const buffer = await gerarDocx(criarCurriculoGrande());

    expect(Buffer.isBuffer(buffer)).toBe(true);
    expect(buffer.slice(0, 2).toString("latin1")).toBe("PK");
  });

  test("gera um .docx para um currículo com apenas parte das seções opcionais preenchidas", async () => {
    const buffer = await gerarDocx(curriculoComCamposParciais);

    expect(Buffer.isBuffer(buffer)).toBe(true);
    expect(buffer.slice(0, 2).toString("latin1")).toBe("PK");
  });

  test.each(curriculosComContatoVariado)(
    "gera um .docx válido para a variação de contato %#",
    async (curriculo) => {
      const buffer = await gerarDocx(curriculo);

      expect(Buffer.isBuffer(buffer)).toBe(true);
      expect(buffer.slice(0, 2).toString("latin1")).toBe("PK");
    }
  );
});