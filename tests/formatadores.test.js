import {
  formatarLinhaSecundaria,
  formatarDetalheCurso,
  analisarSegmentoContato,
} from "../lib/geradores/formatadores.js";

describe("formatarLinhaSecundaria", () => {
  test("junta partes não vazias com ' | '", () => {
    expect(formatarLinhaSecundaria(["FATEC Praia Grande", "Concluído em Jul/2026"])).toBe(
      "FATEC Praia Grande | Concluído em Jul/2026."
    );
  });

  test("ignora partes vazias, nulas ou undefined", () => {
    expect(formatarLinhaSecundaria(["FATEC Praia Grande", "", null, undefined])).toBe(
      "FATEC Praia Grande."
    );
  });

  test("retorna string vazia quando não há partes", () => {
    expect(formatarLinhaSecundaria([])).toBe("");
    expect(formatarLinhaSecundaria(undefined)).toBe("");
  });

  test("não duplica pontuação final se o texto já termina com . ! ou ?", () => {
    expect(formatarLinhaSecundaria(["Concluído em 2026!"])).toBe("Concluído em 2026!");
    expect(formatarLinhaSecundaria(["Pergunta?"])).toBe("Pergunta?");
  });
});

describe("formatarDetalheCurso", () => {
  test("junta instituição e ano no formato 'Instituição (ano)'", () => {
    expect(formatarDetalheCurso("Alura", "2026")).toBe("Alura (2026)");
  });

  test("retorna apenas a instituição quando não há ano", () => {
    expect(formatarDetalheCurso("Alura", "")).toBe("Alura");
    expect(formatarDetalheCurso("Alura", undefined)).toBe("Alura");
  });

  test("retorna apenas o ano entre parênteses quando não há instituição", () => {
    expect(formatarDetalheCurso("", "2026")).toBe("(2026)");
  });

  test("retorna string vazia quando não há instituição nem ano", () => {
    expect(formatarDetalheCurso("", "")).toBe("");
  });
});

describe("analisarSegmentoContato", () => {
  test("identifica um e-mail e monta o link mailto:", () => {
    expect(analisarSegmentoContato("candidato@email.com")).toEqual({
      link: "mailto:candidato@email.com",
    });
  });

  test("identifica um link já com https:// e mantém como está", () => {
    expect(analisarSegmentoContato("https://linkedin.com/in/candidato")).toEqual({
      link: "https://linkedin.com/in/candidato",
    });
  });

  test("identifica um link iniciado por www. e adiciona https://", () => {
    expect(analisarSegmentoContato("www.portfolio.com")).toEqual({
      link: "https://www.portfolio.com",
    });
  });

  test("retorna link nulo para textos que não são e-mail nem link", () => {
    expect(analisarSegmentoContato("São Paulo, SP")).toEqual({ link: null });
    expect(analisarSegmentoContato("(11) 99999-9999")).toEqual({ link: null });
  });

  test("lida com espaços em branco ao redor do texto", () => {
    expect(analisarSegmentoContato("  candidato@email.com  ")).toEqual({
      link: "mailto:candidato@email.com",
    });
  });
});
