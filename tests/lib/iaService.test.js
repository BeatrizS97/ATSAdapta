// Estes testes cobrem o comportamento de iaService.js que NÃO depende de
// fazer uma chamada de rede real para o Gemini (o que exigiria uma chave de
// API válida e sairia do escopo de um teste unitário). O fluxo de chamada
// HTTP em si (sucesso, retry em 429/503, parse do JSON) é responsabilidade
// da própria API do Gemini e do fetch nativo do Node, não é reescrito aqui.
describe("iaService", () => {
  const chaveOriginal = process.env.GEMINI_API_KEY;

  beforeEach(() => {
    jest.resetModules();
    delete process.env.GEMINI_API_KEY;
  });

  afterAll(() => {
    if (chaveOriginal !== undefined) {
      process.env.GEMINI_API_KEY = chaveOriginal;
    }
  });

  test("gerarPerguntasComplementares rejeita quando GEMINI_API_KEY não está configurada", async () => {
    const { gerarPerguntasComplementares } = await import("../../lib/iaService.js");

    await expect(
      gerarPerguntasComplementares("texto do currículo", "descrição da vaga")
    ).rejects.toThrow(/GEMINI_API_KEY/);
  });

  test("adaptarCurriculoComIA rejeita quando GEMINI_API_KEY não está configurada", async () => {
    const { adaptarCurriculoComIA } = await import("../../lib/iaService.js");

    await expect(
      adaptarCurriculoComIA("texto do currículo", "descrição da vaga")
    ).rejects.toThrow(/GEMINI_API_KEY/);
  });
});
