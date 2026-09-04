import { gerarPdf } from "../../lib/geradores/pdfGerador.js";
import { curriculoMinimo, criarCurriculoCompleto } from "../fixtures/curriculo.js";

// Estes testes não validam pixel a pixel o layout do PDF (isso exigiria um
// leitor de PDF completo), mas garantem o "fluxo" descrito no projeto: dado
// um currículo válido, gerarPdf sempre resolve com um Buffer de PDF válido,
// sem lançar exceção, tanto em cenários simples quanto em cenários que
// forçam o PDFKit a testar várias escalas (currículo grande).
describe("gerarPdf", () => {
  test("gera um Buffer não vazio para um currículo mínimo", async () => {
    const buffer = await gerarPdf(curriculoMinimo);

    expect(Buffer.isBuffer(buffer)).toBe(true);
    expect(buffer.length).toBeGreaterThan(0);
  });

  test("o Buffer gerado começa com a assinatura de um arquivo PDF válido (%PDF)", async () => {
    const buffer = await gerarPdf(curriculoMinimo);

    expect(buffer.slice(0, 4).toString("latin1")).toBe("%PDF");
  });

  test("gera um PDF para um currículo completo, em português, sem lançar exceção", async () => {
    const curriculo = criarCurriculoCompleto("pt");
    const buffer = await gerarPdf(curriculo);

    expect(Buffer.isBuffer(buffer)).toBe(true);
    expect(buffer.length).toBeGreaterThan(0);
  });

  test("gera um PDF para um currículo completo, em inglês, sem lançar exceção", async () => {
    const curriculo = criarCurriculoCompleto("en");
    const buffer = await gerarPdf(curriculo);

    expect(Buffer.isBuffer(buffer)).toBe(true);
    expect(buffer.length).toBeGreaterThan(0);
  });

  test("gera um PDF mesmo com muitas experiências e bullets longos (força redução de escala)", async () => {
    const curriculo = criarCurriculoCompleto("pt");

    // Duplica as experiências e alonga os bullets para forçar o laço de
    // ESCALAS_PDF a tentar mais de uma escala antes de decidir o resultado.
    curriculo.experiencias = Array.from({ length: 6 }, (_, indice) => ({
      cargo: `Cargo ${indice + 1}`,
      empresa: `Empresa ${indice + 1}`,
      periodo: "Jan/2024 - Atual",
      bullets: [
        "Liderei um projeto multidisciplinar de grande porte, coordenando times de produto, design e engenharia para entregar melhorias mensuráveis de performance e experiência do usuário.",
        "Implementei um pipeline de integração contínua que reduziu o tempo de deploy em uma proporção significativa, aumentando a confiabilidade das entregas.",
      ],
      stack: ["React", "Node.js", "PostgreSQL"],
    }));

    const buffer = await gerarPdf(curriculo);

    expect(Buffer.isBuffer(buffer)).toBe(true);
    expect(buffer.slice(0, 4).toString("latin1")).toBe("%PDF");
  });

  test("rejeita quando o currículo não tem os campos mínimos esperados", async () => {
    await expect(gerarPdf({})).rejects.toThrow();
  });
});
