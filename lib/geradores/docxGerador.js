import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
  ExternalHyperlink,
  BorderStyle,
  TabStopType,
  TabStopPosition,
} from "docx";
import { formatarLinhaSecundaria, formatarDetalheCurso, analisarSegmentoContato } from "./formatadores.js";

const COR_TITULO_DOCX = "2E4A3B";
const COR_TEXTO_SECUNDARIO_DOCX = "555555";
const COR_LINHA_DOCX = "DDDDDD";

// Rótulos de seção do DOCX, em português e em inglês, conforme curriculo.idioma.
const ROTULOS_SECAO = {
  pt: {
    resumo: "RESUMO PROFISSIONAL",
    experiencia: "EXPERIÊNCIA PROFISSIONAL",
    projetos: "PROJETOS RELEVANTES",
    formacao: "FORMAÇÃO",
    cursos: "CURSOS E CERTIFICADOS",
    idiomas: "IDIOMAS",
    atividades: "ATIVIDADES COMPLEMENTARES",
    habilidades: "HABILIDADES TÉCNICAS",
    stack: "Stack",
  },
  en: {
    resumo: "PROFESSIONAL SUMMARY",
    experiencia: "WORK EXPERIENCE",
    projetos: "RELEVANT PROJECTS",
    formacao: "EDUCATION",
    cursos: "COURSES AND CERTIFICATIONS",
    idiomas: "LANGUAGES",
    atividades: "ADDITIONAL ACTIVITIES",
    habilidades: "TECHNICAL SKILLS",
    stack: "Stack",
  },
};

function obterRotulos(idioma) {
  return ROTULOS_SECAO[idioma === "en" ? "en" : "pt"];
}

// Soma o tamanho aproximado de todo o texto do currículo, usada para
// decidir o quanto reduzir fonte/espaçamento e caber melhor no documento.
function calcularPesoConteudo(curriculo) {
  let peso = 0;
  peso += (curriculo.resumoProfissional || "").length;

  (curriculo.experiencias || []).forEach((exp) => {
    peso += (exp.cargo || "").length + (exp.empresa || "").length + (exp.periodo || "").length + 20;
    (exp.bullets || []).forEach((bullet) => (peso += bullet.length + 12));
    peso += (exp.stack || []).join(", ").length + 10;
  });

  (curriculo.projetos || []).forEach((projeto) => {
    peso += (projeto.nome || "").length + (projeto.descricao || "").length + (projeto.link || "").length + 20;
  });

  (curriculo.formacao || []).forEach((item) => {
    peso += (item.curso || "").length + (item.instituicao || "").length + (item.periodo || "").length + 14;
  });

  (curriculo.cursosCertificados || []).forEach((item) => {
    peso += (item.nome || "").length + (item.instituicao || "").length + (item.ano || "").length + 14;
  });

  peso += (curriculo.idiomas || []).join(" ").length;

  (curriculo.atividadesComplementares || []).forEach((atividade) => (peso += atividade.length + 12));

  peso += (curriculo.habilidades || []).join(" ").length;

  return peso;
}

function escolherEscalaDocx(peso) {
  if (peso < 1300) return 1.08;
  if (peso < 1900) return 1.0;
  if (peso < 2500) return 0.96;
  if (peso < 3100) return 0.92;
  return 0.88;
}

function calcularFatorEspacamento(peso) {
  if (peso < 900) return 1.5;
  if (peso < 1300) return 1.3;
  if (peso < 1900) return 1.15;
  if (peso < 2500) return 1.05;
  return 1;
}

// Escala um tamanho de fonte (respeitando um mínimo de 14)
function ts(base, escala) {
  return Math.max(14, Math.round(base * escala));
}

// Escala um espaçamento entre parágrafos
function es(base, escalaEspaco) {
  return Math.max(0, Math.round(base * escalaEspaco));
}

function montarRunsContato(contato, tamanho) {
  const partes = (contato || "").split("|").map((p) => p.trim()).filter(Boolean);
  const runs = [];

  partes.forEach((parte, indice) => {
    if (indice > 0) {
      runs.push(new TextRun({ text: "   |   ", size: tamanho, color: COR_TEXTO_SECUNDARIO_DOCX }));
    }

    const { link } = analisarSegmentoContato(parte);

    if (link) {
      runs.push(
        new ExternalHyperlink({
          link,
          children: [
            new TextRun({ text: parte, size: tamanho, color: COR_TITULO_DOCX, underline: {} }),
          ],
        })
      );
    } else {
      runs.push(new TextRun({ text: parte, size: tamanho, color: COR_TEXTO_SECUNDARIO_DOCX }));
    }
  });

  return runs;
}

export async function gerarDocx(curriculo) {
  const rotulos = obterRotulos(curriculo.idioma);
  const peso = calcularPesoConteudo(curriculo);
  const escala = escolherEscalaDocx(peso);
  const escalaEspaco = escala * calcularFatorEspacamento(peso);
  const paragrafos = [];

  paragrafos.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({ text: (curriculo.nome || "").toUpperCase(), bold: true, size: ts(30, escala) }),
      ],
      spacing: { after: es(40, escalaEspaco) },
    })
  );

  if (curriculo.cargoAlvo) {
    paragrafos.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({ text: curriculo.cargoAlvo, bold: true, size: ts(21, escala), color: COR_TITULO_DOCX }),
        ],
        spacing: { after: es(60, escalaEspaco) },
      })
    );
  }

  if (curriculo.contato) {
    paragrafos.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: montarRunsContato(curriculo.contato, ts(17, escala)),
        spacing: { after: es(200, escalaEspaco) },
        border: {
          bottom: { color: COR_LINHA_DOCX, space: 4, style: BorderStyle.SINGLE, size: 4 },
        },
      })
    );
  }

  if (curriculo.resumoProfissional) {
    paragrafos.push(tituloSecaoDocx(rotulos.resumo, escala, escalaEspaco));
    paragrafos.push(
      new Paragraph({
        children: [new TextRun({ text: curriculo.resumoProfissional, size: ts(20, escala) })],
        alignment: AlignmentType.JUSTIFIED,
        spacing: { after: es(160, escalaEspaco) },
      })
    );
  }

  if (curriculo.experiencias.length > 0) {
    paragrafos.push(tituloSecaoDocx(rotulos.experiencia, escala, escalaEspaco));

    curriculo.experiencias.forEach((experiencia) => {
      paragrafos.push(
        new Paragraph({
          tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
          children: [
            new TextRun({
              text: `${experiencia.cargo || ""} | ${experiencia.empresa || ""}`,
              bold: true,
              size: ts(21, escala),
            }),
            ...(experiencia.periodo
              ? [
                  new TextRun({
                    text: `\t${experiencia.periodo}`,
                    italics: true,
                    size: ts(18, escala),
                    color: COR_TEXTO_SECUNDARIO_DOCX,
                  }),
                ]
              : []),
          ],
          spacing: { after: es(60, escalaEspaco) },
        })
      );

      (experiencia.bullets || []).forEach((bullet) => {
        paragrafos.push(
          new Paragraph({
            children: [new TextRun({ text: bullet, size: ts(20, escala) })],
            bullet: { level: 0 },
            alignment: AlignmentType.JUSTIFIED,
            spacing: { after: es(20, escalaEspaco) },
          })
        );
      });

      if (experiencia.stack && experiencia.stack.length > 0) {
        paragrafos.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `${rotulos.stack}: ${experiencia.stack.join(", ")}`,
                italics: true,
                size: ts(18, escala),
                color: COR_TEXTO_SECUNDARIO_DOCX,
              }),
            ],
            spacing: { after: es(60, escalaEspaco) },
          })
        );
      }

      paragrafos.push(new Paragraph({ text: "", spacing: { after: es(100, escalaEspaco) } }));
    });
  }

  if (curriculo.projetos && curriculo.projetos.length > 0) {
    paragrafos.push(tituloSecaoDocx(rotulos.projetos, escala, escalaEspaco));

    curriculo.projetos.forEach((projeto) => {
      paragrafos.push(
        new Paragraph({
          children: [new TextRun({ text: projeto.nome || "", bold: true, size: ts(20, escala) })],
          spacing: { after: es(20, escalaEspaco) },
        })
      );

      if (projeto.descricao) {
        paragrafos.push(
          new Paragraph({
            children: [new TextRun({ text: projeto.descricao, size: ts(19, escala) })],
            bullet: { level: 0 },
            alignment: AlignmentType.JUSTIFIED,
            spacing: { after: es(20, escalaEspaco) },
          })
        );
      }

      if (projeto.link) {
        paragrafos.push(
          new Paragraph({
            children: [
              new ExternalHyperlink({
                link: projeto.link,
                children: [
                  new TextRun({
                    text: projeto.link,
                    size: ts(18, escala),
                    color: COR_TITULO_DOCX,
                    underline: {},
                  }),
                ],
              }),
            ],
            spacing: { after: es(120, escalaEspaco) },
          })
        );
      }
    });
  }

  if (curriculo.formacao.length > 0) {
    paragrafos.push(tituloSecaoDocx(rotulos.formacao, escala, escalaEspaco));

    curriculo.formacao.forEach((item) => {
      const detalhe = formatarLinhaSecundaria([item.instituicao, item.periodo]);

      const runsFormacao = [new TextRun({ text: item.curso || "", bold: true, size: ts(20, escala) })];
      if (detalhe) {
        runsFormacao.push(
          new TextRun({ text: ` — ${detalhe}`, size: ts(19, escala), color: COR_TEXTO_SECUNDARIO_DOCX })
        );
      }

      paragrafos.push(
        new Paragraph({
          children: runsFormacao,
          spacing: { after: es(120, escalaEspaco) },
        })
      );
    });
  }

  if (curriculo.cursosCertificados && curriculo.cursosCertificados.length > 0) {
    paragrafos.push(tituloSecaoDocx(rotulos.cursos, escala, escalaEspaco));

    curriculo.cursosCertificados.forEach((item) => {
      const detalhe = formatarDetalheCurso(item.instituicao, item.ano);

      const runsItem = [new TextRun({ text: item.nome || "", bold: true, size: ts(20, escala) })];
      if (detalhe) {
        runsItem.push(
          new TextRun({ text: ` — ${detalhe}`, size: ts(19, escala), color: COR_TEXTO_SECUNDARIO_DOCX })
        );
      }

      paragrafos.push(
        new Paragraph({
          children: runsItem,
          bullet: { level: 0 },
          spacing: { after: es(80, escalaEspaco) },
        })
      );
    });
  }

  if (curriculo.idiomas && curriculo.idiomas.length > 0) {
    paragrafos.push(tituloSecaoDocx(rotulos.idiomas, escala, escalaEspaco));
    paragrafos.push(
      new Paragraph({
        children: [new TextRun({ text: curriculo.idiomas.join(" | "), size: ts(20, escala) })],
        spacing: { after: es(160, escalaEspaco) },
      })
    );
  }

  if (curriculo.atividadesComplementares && curriculo.atividadesComplementares.length > 0) {
    paragrafos.push(tituloSecaoDocx(rotulos.atividades, escala, escalaEspaco));

    curriculo.atividadesComplementares.forEach((atividade) => {
      paragrafos.push(
        new Paragraph({
          children: [new TextRun({ text: atividade, size: ts(20, escala) })],
          bullet: { level: 0 },
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: es(20, escalaEspaco) },
        })
      );
    });
  }

  if (curriculo.habilidades.length > 0) {
    paragrafos.push(tituloSecaoDocx(rotulos.habilidades, escala, escalaEspaco));
    paragrafos.push(
      new Paragraph({
        children: [new TextRun({ text: curriculo.habilidades.join(" | "), size: ts(20, escala) })],
      })
    );
  }

  const margemDocx = Math.max(420, Math.round(620 * Math.min(1, escala)));

  const documento = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: { top: margemDocx, bottom: margemDocx, left: margemDocx, right: margemDocx },
          },
        },
        children: paragrafos,
      },
    ],
  });

  return Packer.toBuffer(documento);
}

function tituloSecaoDocx(titulo, escala, escalaEspaco) {
  return new Paragraph({
    children: [new TextRun({ text: titulo, bold: true, color: COR_TITULO_DOCX, size: ts(20, escala) })],
    spacing: { before: es(160, escalaEspaco), after: es(80, escalaEspaco) },
    alignment: AlignmentType.LEFT,
    border: {
      bottom: { color: COR_LINHA_DOCX, space: 1, style: BorderStyle.SINGLE, size: 4 },
    },
  });
}