import { gerarPdf, gerarDocx } from "../../lib/arquivoService.js";
import { curriculoMinimo, curriculoComCamposParciais } from "../fixtures/curriculo.js";

// Estes testes garantem que o ponto de entrada
// usado por api/gerar-arquivo.js continua funcionando de ponta a ponta.

describe("arquivoService", () => {
  test("reexporta gerarPdf e gerarDocx como funções", () => {
    expect(typeof gerarPdf).toBe("function");
    expect(typeof gerarDocx).toBe("function");
  });

  test("gerarPdf, via arquivoService, retorna um Buffer válido", async () => {
    const buffer = await gerarPdf(curriculoMinimo);
    expect(Buffer.isBuffer(buffer)).toBe(true);
    expect(buffer.length).toBeGreaterThan(0);
  });

  test("gerarDocx, via arquivoService, retorna um Buffer válido", async () => {
    const buffer = await gerarDocx(curriculoMinimo);
    expect(Buffer.isBuffer(buffer)).toBe(true);
    expect(buffer.length).toBeGreaterThan(0);
  });

  test("gerarPdf e gerarDocx, via arquivoService, funcionam com um currículo de campos parciais", async () => {
    const bufferPdf = await gerarPdf(curriculoComCamposParciais);
    const bufferDocx = await gerarDocx(curriculoComCamposParciais);

    expect(Buffer.isBuffer(bufferPdf)).toBe(true);
    expect(Buffer.isBuffer(bufferDocx)).toBe(true);
  });
});