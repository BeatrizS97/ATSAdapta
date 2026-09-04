// Currículo mínimo válido: só os campos que os geradores acessam sem optional
// chaining (nome, experiencias, formacao, habilidades) precisam sempre existir.
export const curriculoMinimo = {
  nome: "Maria Souza",
  cargoAlvo: "",
  contato: "",
  resumoProfissional: "",
  experiencias: [],
  projetos: [],
  formacao: [],
  cursosCertificados: [],
  idiomas: [],
  atividadesComplementares: [],
  habilidades: [],
  idioma: "pt",
};

// Currículo completo, com todas as seções preenchidas, usado para garantir
// que o fluxo inteiro de geração (cabeçalho, experiências com bullets,
// projetos, formação, cursos, idiomas, atividades e habilidades) roda sem
// lançar exceção, tanto em português quanto em inglês.
export function criarCurriculoCompleto(idioma = "pt") {
  return {
    nome: "João Pereira",
    cargoAlvo: "Desenvolvedor Full Stack",
    contato: "São Paulo, SP | (11) 99999-9999 | joao@email.com | www.joaopereira.dev",
    resumoProfissional:
      "Desenvolvedor com experiência em aplicações web, focado em performance e boas práticas de código.",
    experiencias: [
      {
        cargo: "Desenvolvedor Front-End",
        empresa: "Empresa Alpha",
        periodo: "Jan/2024 - Atual",
        bullets: [
          "Liderei a migração de dados que reduziu o tempo de resposta em 30%.",
          "Implementei testes automatizados que reduziram bugs em produção em 25%.",
        ],
        stack: ["React", "TypeScript", "Jest"],
      },
      {
        cargo: "Estagiário de Desenvolvimento",
        empresa: "Empresa Beta",
        periodo: "Jan/2023 - Dez/2023",
        bullets: ["Desenvolvi componentes reutilizáveis para o design system da empresa."],
        stack: ["Vue", "CSS"],
      },
    ],
    projetos: [
      {
        nome: "Adaptador de Currículo ATS",
        descricao: "Ferramenta que adapta currículos a vagas usando IA generativa.",
        link: "https://github.com/joaopereira/curriculo-ats",
      },
    ],
    formacao: [
      { curso: "Análise e Desenvolvimento de Sistemas", instituicao: "FATEC", periodo: "2021 - 2024" },
    ],
    cursosCertificados: [
      { nome: "React Avançado", instituicao: "Alura", ano: "2025" },
    ],
    idiomas: ["Inglês - Avançado", "Espanhol - Intermediário"],
    atividadesComplementares: ["Palestrante em evento local de tecnologia."],
    habilidades: ["JavaScript", "React", "Node.js", "Git"],
    idioma,
  };
}
