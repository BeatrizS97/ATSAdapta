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

// Currículo com apenas parte das seções opcionais preenchidas (tem
// experiência e formação, mas não tem projetos, cursos, idiomas nem
// atividades complementares). Garante que cada seção opcional é renderizada
// de forma independente, sem depender de as outras estarem presentes.
export const curriculoComCamposParciais = {
  nome: "Ana Lima",
  cargoAlvo: "Analista de Suporte",
  contato: "Curitiba, PR | ana.lima@email.com",
  resumoProfissional: "Profissional de suporte técnico com foco em atendimento ao cliente.",
  experiencias: [
    {
      cargo: "Analista de Suporte N1",
      empresa: "Empresa Gama",
      periodo: "Mar/2023 - Atual",
      bullets: ["Resolvi chamados técnicos de usuários internos, priorizando os casos críticos."],
      stack: [],
    },
  ],
  projetos: [],
  formacao: [{ curso: "Técnico em Informática", instituicao: "SENAI", periodo: "2022" }],
  cursosCertificados: [],
  idiomas: [],
  atividadesComplementares: [],
  habilidades: ["Atendimento ao cliente", "Suporte técnico"],
  idioma: "pt",
};

// Três variações do campo "contato", usadas para garantir que o cabeçalho
// (PDF/DOCX) lida bem com combinações diferentes de e-mail e link, incluindo
// contato com um único segmento e contato sem nenhum link/e-mail.
export const curriculosComContatoVariado = [
  { ...curriculoComCamposParciais, contato: "candidato@email.com" },
  { ...curriculoComCamposParciais, contato: "www.portfolio-candidato.dev" },
  { ...curriculoComCamposParciais, contato: "São Paulo, SP | (11) 98888-7777" },
];

// Currículo com muitas experiências e bullets longos, usado para forçar o
// PDFKit (gerarPdf) a testar várias escalas antes de decidir o resultado, e
// para garantir que o DOCX também gera um arquivo válido com bastante
// conteúdo.
export function criarCurriculoGrande() {
  const base = criarCurriculoCompleto("pt");

  return {
    ...base,
    experiencias: Array.from({ length: 6 }, (_, indice) => ({
      cargo: `Cargo ${indice + 1}`,
      empresa: `Empresa ${indice + 1}`,
      periodo: "Jan/2024 - Atual",
      bullets: [
        "Liderei um projeto multidisciplinar de grande porte, coordenando times de produto, design e engenharia para entregar melhorias mensuráveis de performance e experiência do usuário.",
        "Implementei um pipeline de integração contínua que reduziu o tempo de deploy em uma proporção significativa, aumentando a confiabilidade das entregas.",
      ],
      stack: ["React", "Node.js", "PostgreSQL"],
    })),
  };
}