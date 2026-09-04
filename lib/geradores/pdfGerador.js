import PDFDocument from "pdfkit";
import { formatarLinhaSecundaria, formatarDetalheCurso, analisarSegmentoContato } from "./formatadores.js";

const COR_TITULO = "#2e4a3b";
const COR_TEXTO_SECUNDARIO = "#555555";
const COR_LINHA = "#dddddd";

const ESCALAS_PDF = [1.08, 1.0, 0.93, 0.87, 0.81, 0.75, 0.7, 0.65, 0.6, 0.55, 0.5, 0.45, 0.4];

// Rótulos de seção do PDF, em português e em inglês, conforme curriculo.idioma.
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

/**
 * Gera o PDF tentando escalas decrescentes de fonte/espaçamento até o
 * currículo caber em 1 página. Guarda sempre o melhor resultado obtido
 * (menor número de páginas) caso nenhuma escala consiga caber perfeitamente.
 */
export async function gerarPdf(curriculo) {
  let melhorResultado = null;

  for (const escala of ESCALAS_PDF) {
    try {
      const resultado = await renderizarPdf(curriculo, escala, 0);

      // Guarda sempre o resultado com menos páginas até agora (e não apenas
      // a última tentativa), para que uma falha pontual numa escala menor
      // não faça o resultado voltar para uma escala maior que ainda não coube.
      if (!melhorResultado || resultado.paginas <= melhorResultado.paginas) {
        melhorResultado = resultado;
      }

      if (resultado.paginas <= 1) break;
    } catch (err) {
      continue;
    }
  }

  if (!melhorResultado) {
    throw new Error("Não foi possível gerar o PDF com os dados fornecidos.");
  }

  if (melhorResultado.paginas <= 1) {
    const espacoSobrando = melhorResultado.alturaUtil - melhorResultado.alturaFinal;

    if (espacoSobrando > 60 && melhorResultado.numSecoes > 0) {
      const extraPorSecao = Math.min(
        espacoSobrando / (melhorResultado.numSecoes + 1),
        1
      );
      try {
        const ajustado = await renderizarPdf(curriculo, melhorResultado.escala, extraPorSecao);
        if (ajustado.paginas <= 1) {
          return ajustado.buffer;
        }
      } catch (err) {
        // Ajuste de espaço é apenas cosmético; se falhar, mantém o resultado já válido.
      }
    }
  }

  return melhorResultado.buffer;
}

// Desenha o currículo inteiro em uma escala específica e devolve o buffer
// junto com o número de páginas geradas, para gerarPdf decidir se serve.
function renderizarPdf(curriculo, escala, espacoExtra) {
  return new Promise((resolve, reject) => {
    const margem = Math.max(24, Math.round(38 * Math.min(1, escala)));

    const doc = new PDFDocument({ margin: margem, size: "A4", bufferPages: true });
    const pedacos = [];
    let numSecoes = 0;
    let alturaFinal = 0;

    doc.on("data", (pedaco) => pedacos.push(pedaco));

    doc.on("error", (err) => {
      reject(err);
    });

    doc.on("end", () => {
      try {
        const paginas = doc.bufferedPageRange().count;
        resolve({
          buffer: Buffer.concat(pedacos),
          paginas,
          alturaUtil: doc.page.height - margem * 2,
          alturaFinal,
          escala,
          numSecoes,
        });
      } catch (e) {
        reject(e);
      }
    });

    try {
      numSecoes = desenharConteudoPdf(doc, curriculo, escala, espacoExtra);
      alturaFinal = doc.y - margem;
      doc.end();
    } catch (drawError) {
      reject(drawError);
    }
  });
}

// Escala um tamanho de fonte
function t(base, escala) {
  const val = Number((base * escala).toFixed(2));
  if (!Number.isFinite(val)) throw new Error(`Cálculo de tamanho inválido (NaN): base=${base}, escala=${escala}`);
  return val;
}

// Escala uma distância/espaçamento
function d(base, escala) {
  const val = Number((base * escala).toFixed(2));
  if (!Number.isFinite(val)) throw new Error(`Cálculo de distância inválido (NaN): base=${base}, escala=${escala}`);
  return val;
}

/**
 * Desenha a linha de contato centralizada. Se a linha for larga demais para
 * caber na página, reduz a fonte progressivamente até caber, evitando que o
 * texto vaze para fora da margem direita. Ao final, reposiciona doc.x na
 * margem esquerda (essencial: essa função usa x explícito com
 * lineBreak:false, e o PDFKit não reseta doc.x sozinho nesse caso, o que
 * bagunçava a posição dos títulos das seções seguintes).
 */
function desenharLinhaCentralizada(doc, segmentos, tamanhoBase) {
  const larguraDisponivel = doc.page.width - doc.page.margins.left - doc.page.margins.right;

  let tamanho = tamanhoBase;
  let larguras = [];
  let larguraTotal = 0;

  for (let tentativa = 0; tentativa < 6; tentativa++) {
    larguras = segmentos.map((seg) => {
      doc.font("Times-Roman").fontSize(tamanho);
      return doc.widthOfString(seg.texto);
    });
    larguraTotal = larguras.reduce((soma, largura) => soma + largura, 0);

    if (larguraTotal <= larguraDisponivel || tamanho <= 6) break;
    tamanho = Math.max(6, tamanho * (larguraDisponivel / larguraTotal));
  }

  if (!Number.isFinite(larguraTotal) || !Number.isFinite(larguraDisponivel)) {
    throw new Error("Erro de cálculo de dimensão no PDF (largura inválida)");
  }

  const xInicial0 = doc.page.margins.left + Math.max(0, (larguraDisponivel - larguraTotal) / 2);
  let xInicial = xInicial0;
  const y = doc.y;

  segmentos.forEach((seg, indice) => {
    doc
      .font("Times-Roman")
      .fontSize(tamanho)
      .fillColor(seg.link ? COR_TITULO : COR_TEXTO_SECUNDARIO);

    doc.text(seg.texto, xInicial, y, { lineBreak: false });

    xInicial += larguras[indice];
  });

  doc.x = doc.page.margins.left;
  doc.y = y + tamanho * 1.35;
  doc.fillColor("#000000");
}

function montarSegmentosContato(contato) {
  const partes = (contato || "").split("|").map((p) => p.trim()).filter(Boolean);
  const segmentos = [];

  partes.forEach((parte, indice) => {
    if (indice > 0) {
      segmentos.push({ texto: "   |   ", link: null });
    }
    const { link } = analisarSegmentoContato(parte);
    segmentos.push({ texto: parte, link });
  });

  return segmentos;
}

/**
 * Desenha Cargo/Empresa à esquerda e Data à direita. Ao final, reposiciona
 * doc.x na margem esquerda pelo mesmo motivo de desenharLinhaCentralizada:
 * a data é desenhada com x explícito e lineBreak:false.
 */
function linhaComDireita(doc, esquerda, direita, tamanhoEsquerda, tamanhoDireita) {
  const larguraPagina = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const y = doc.y;

  doc.font("Times-Italic").fontSize(tamanhoDireita);
  const larguraDireita = direita ? doc.widthOfString(direita) : 0;

  doc.font("Times-Bold").fontSize(tamanhoEsquerda).fillColor("#000000");

  const espacoEntre = 20;
  const larguraEsquerdaDisponivel = direita
    ? Math.max(40, larguraPagina - larguraDireita - espacoEntre)
    : larguraPagina;

  if (!Number.isFinite(larguraEsquerdaDisponivel)) {
    throw new Error("Largura disponível inválida na linha com direita");
  }

  const alturaEsquerda = doc.heightOfString(esquerda, { width: larguraEsquerdaDisponivel });

  doc.text(esquerda, doc.page.margins.left, y, {
    width: larguraEsquerdaDisponivel,
    align: "left",
  });

  if (direita) {
    doc.font("Times-Italic").fontSize(tamanhoDireita).fillColor(COR_TEXTO_SECUNDARIO);
    doc.text(direita, doc.page.margins.left + larguraPagina - larguraDireita, y, {
      lineBreak: false,
    });
  }

  doc.x = doc.page.margins.left;
  doc.y = y + alturaEsquerda;
  doc.fillColor("#000000");
}

function desenharCabecalho(doc, curriculo, escala) {
  doc
    .font("Times-Bold")
    .fontSize(t(17, escala))
    .fillColor("#000000")
    .text((curriculo.nome || "").toUpperCase(), { align: "center", characterSpacing: 0.6 });

  if (curriculo.cargoAlvo) {
    doc.moveDown(d(0.12, escala));
    doc
      .font("Times-Bold")
      .fontSize(t(10.5, escala))
      .fillColor(COR_TITULO)
      .text(curriculo.cargoAlvo, { align: "center" });
  }

  if (curriculo.contato) {
    doc.moveDown(d(0.18, escala));
    desenharLinhaCentralizada(doc, montarSegmentosContato(curriculo.contato), t(8.6, escala));
  }
}

function desenharListaComBullets(doc, itens, { tamanhoFonte, bulletRadius, bulletIndent, textIndent, escala }) {
  if (!Number.isFinite(tamanhoFonte) || !Number.isFinite(bulletRadius) ||
      !Number.isFinite(bulletIndent) || !Number.isFinite(textIndent)) {
    throw new Error("Parâmetros de desenho de bullet inválidos (NaN)");
  }

  const larguraPagina = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const xBullet = doc.page.margins.left + bulletIndent;
  const xTexto = doc.page.margins.left + textIndent;
  const larguraTexto = larguraPagina - textIndent;

  (itens || []).forEach((item) => {
    if (!item) return;

    doc.font("Times-Roman").fontSize(tamanhoFonte);

    const alturaLinha = doc.currentLineHeight(true);
    const espacoRestante = doc.page.height - doc.page.margins.bottom - doc.y;

    if (alturaLinha > espacoRestante) {
      doc.addPage();
    }

    const yInicio = doc.y;
    if (!Number.isFinite(yInicio)) throw new Error("Posição Y inválida no bullet");

    const circleY = yInicio + tamanhoFonte * 0.38;
    if (!Number.isFinite(circleY)) throw new Error("Cálculo de posição do círculo inválido");

    doc
      .fillColor("#000000")
      .circle(xBullet, circleY, bulletRadius)
      .fill();

    doc
      .font("Times-Roman")
      .fontSize(tamanhoFonte)
      .fillColor("#000000")
      .text(item, xTexto, yInicio, {
        width: larguraTexto,
        align: "justify",
      });

    doc.moveDown(d(0.12, escala));
  });

  // Sem este reset, o próximo título/parágrafo (que não passa x explícito) nasceria indentado
  // também, em vez de voltar para a margem da página.
  doc.x = doc.page.margins.left;
}

function desenharCursosComBullets(doc, itens, escala) {
  const bulletRadius = Math.max(1, t(1.6, escala));
  const bulletIndent = Math.max(8, t(12, escala));
  const textIndent = Math.max(14, t(20, escala));
  const tamanhoFonte = t(9.2, escala);

  if (!Number.isFinite(tamanhoFonte) || !Number.isFinite(bulletRadius) ||
      !Number.isFinite(bulletIndent) || !Number.isFinite(textIndent)) {
    throw new Error("Parâmetros de desenho de cursos inválidos (NaN)");
  }

  const larguraPagina = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const xBullet = doc.page.margins.left + bulletIndent;
  const xTexto = doc.page.margins.left + textIndent;
  const larguraTexto = larguraPagina - textIndent;

  (itens || []).forEach((item) => {
    if (!item || !item.nome) return;

    const detalhe = formatarDetalheCurso(item.instituicao, item.ano);

    doc.font("Times-Bold").fontSize(tamanhoFonte);

    const alturaLinha = doc.currentLineHeight(true);
    const espacoRestante = doc.page.height - doc.page.margins.bottom - doc.y;

    if (alturaLinha > espacoRestante) {
      doc.addPage();
    }

    const yInicio = doc.y;
    if (!Number.isFinite(yInicio)) throw new Error("Posição Y inválida no bullet de cursos");

    const circleY = yInicio + tamanhoFonte * 0.38;
    if (!Number.isFinite(circleY)) throw new Error("Cálculo de posição do círculo inválido (cursos)");

    doc
      .fillColor("#000000")
      .circle(xBullet, circleY, bulletRadius)
      .fill();

    doc
      .font("Times-Bold")
      .fontSize(tamanhoFonte)
      .fillColor("#000000")
      .text(item.nome, xTexto, yInicio, {
        width: larguraTexto,
        continued: Boolean(detalhe),
      });

    if (detalhe) {
      doc
        .font("Times-Roman")
        .fontSize(tamanhoFonte)
        .fillColor(COR_TEXTO_SECUNDARIO)
        .text(` — ${detalhe}`, { width: larguraTexto });
    }

    doc.moveDown(d(0.12, escala));
  });

  doc.fillColor("#000000");
  // Mesmo motivo do reset em desenharListaComBullets: sem isto, o próximo
  // título/parágrafo nasceria indentado em vez de voltar para a margem.
  doc.x = doc.page.margins.left;
}

function desenharConteudoPdf(doc, curriculo, escala, espacoExtra = 0) {
  const rotulos = obterRotulos(curriculo.idioma);

  let numSecoes = 0;
  if (curriculo.resumoProfissional) numSecoes++;
  if (curriculo.experiencias.length > 0) numSecoes++;
  if (curriculo.projetos && curriculo.projetos.length > 0) numSecoes++;
  if (curriculo.formacao.length > 0) numSecoes++;
  if (curriculo.cursosCertificados && curriculo.cursosCertificados.length > 0) numSecoes++;
  if (curriculo.idiomas && curriculo.idiomas.length > 0) numSecoes++;
  if (curriculo.atividadesComplementares && curriculo.atividadesComplementares.length > 0) numSecoes++;
  if (curriculo.habilidades.length > 0) numSecoes++;

  desenharCabecalho(doc, curriculo, escala);

  const larguraUtil = doc.page.width - doc.page.margins.left - doc.page.margins.right;

  if (curriculo.resumoProfissional) {
    desenharTituloSecao(doc, rotulos.resumo, escala, espacoExtra);
    doc
      .font("Times-Roman")
      .fontSize(t(9.3, escala))
      .fillColor("#000000")
      .text(curriculo.resumoProfissional, { width: larguraUtil, align: "justify" });
  }

  if (curriculo.experiencias.length > 0) {
    desenharTituloSecao(doc, rotulos.experiencia, escala, espacoExtra);

    curriculo.experiencias.forEach((experiencia, indice) => {
      linhaComDireita(
        doc,
        `${experiencia.cargo || ""} | ${experiencia.empresa || ""}`,
        experiencia.periodo || "",
        t(10, escala),
        t(9, escala)
      );

      doc.moveDown(d(0.12, escala));

      if ((experiencia.bullets || []).length > 0) {
        desenharListaComBullets(doc, experiencia.bullets, {
          tamanhoFonte: t(9.3, escala),
          bulletRadius: Math.max(1, t(1.6, escala)),
          bulletIndent: Math.max(8, t(12, escala)),
          textIndent: Math.max(14, t(20, escala)),
          escala,
        });
      }

      if (experiencia.stack && experiencia.stack.length > 0) {
        doc
          .font("Times-Italic")
          .fontSize(t(8.6, escala))
          .fillColor(COR_TEXTO_SECUNDARIO)
          .text(`${rotulos.stack}: ${experiencia.stack.join(", ")}`, { width: larguraUtil, align: "justify" });
        doc.fillColor("#000000");
        doc.moveDown(d(0.08, escala));
      }

      if (indice < curriculo.experiencias.length - 1) {
        doc.moveDown(d(0.24, escala));
      }
    });
  }

  if (curriculo.projetos && curriculo.projetos.length > 0) {
    desenharTituloSecao(doc, rotulos.projetos, escala, espacoExtra);

    curriculo.projetos.forEach((projeto, indice) => {
      doc.font("Times-Bold").fontSize(t(9.6, escala)).fillColor("#000000").text(projeto.nome || "", { width: larguraUtil });

      if (projeto.descricao) {
        desenharListaComBullets(doc, [projeto.descricao], {
          tamanhoFonte: t(9.1, escala),
          bulletRadius: Math.max(1, t(1.6, escala)),
          bulletIndent: Math.max(8, t(12, escala)),
          textIndent: Math.max(14, t(20, escala)),
          escala,
        });
      }

      if (projeto.link) {
        doc
          .font("Times-Roman")
          .fontSize(t(8.8, escala))
          .fillColor(COR_TITULO)
          .text(projeto.link, { width: larguraUtil });
        doc.fillColor("#000000");
      }

      if (indice < curriculo.projetos.length - 1) {
        doc.moveDown(d(0.18, escala));
      }
    });
  }

  if (curriculo.formacao.length > 0) {
    desenharTituloSecao(doc, rotulos.formacao, escala, espacoExtra);

    curriculo.formacao.forEach((item) => {
      const detalhe = formatarLinhaSecundaria([item.instituicao, item.periodo]);

      doc
        .font("Times-Bold")
        .fontSize(t(9.6, escala))
        .fillColor("#000000")
        .text(item.curso || "", { width: larguraUtil, continued: Boolean(detalhe) });

      if (detalhe) {
        doc
          .font("Times-Roman")
          .fontSize(t(9, escala))
          .fillColor(COR_TEXTO_SECUNDARIO)
          .text(` — ${detalhe}`, { width: larguraUtil });
      }

      doc.moveDown(d(0.13, escala));
    });
  }

  if (curriculo.cursosCertificados && curriculo.cursosCertificados.length > 0) {
    desenharTituloSecao(doc, rotulos.cursos, escala, espacoExtra);
    desenharCursosComBullets(doc, curriculo.cursosCertificados, escala);
  }

  if (curriculo.idiomas && curriculo.idiomas.length > 0) {
    desenharTituloSecao(doc, rotulos.idiomas, escala, espacoExtra);
    doc.font("Times-Roman").fontSize(t(9.3, escala)).fillColor("#000000").text(curriculo.idiomas.join(" | "), { width: larguraUtil, align: "justify" });
  }

  if (curriculo.atividadesComplementares && curriculo.atividadesComplementares.length > 0) {
    desenharTituloSecao(doc, rotulos.atividades, escala, espacoExtra);
    desenharListaComBullets(doc, curriculo.atividadesComplementares, {
      tamanhoFonte: t(9.1, escala),
      bulletRadius: Math.max(1, t(1.6, escala)),
      bulletIndent: Math.max(8, t(12, escala)),
      textIndent: Math.max(14, t(20, escala)),
      escala,
    });
  }

  if (curriculo.habilidades.length > 0) {
    desenharTituloSecao(doc, rotulos.habilidades, escala, espacoExtra);
    doc.font("Times-Roman").fontSize(t(9.3, escala)).fillColor("#000000").text(curriculo.habilidades.join(" | "), { width: larguraUtil, align: "justify" });
  }

  return numSecoes;
}

function desenharTituloSecao(doc, titulo, escala, espacoExtra = 0) {
  doc.moveDown(d(0.22, escala));
  if (espacoExtra) doc.y += espacoExtra;

  const larguraMaximaTitulo = doc.page.width - doc.page.margins.left - doc.page.margins.right;

  // Linha separadora acima do título
  const yTopo = doc.y;
  doc
    .moveTo(doc.page.margins.left, yTopo)
    .lineTo(doc.page.margins.left + larguraMaximaTitulo, yTopo)
    .strokeColor(COR_LINHA)
    .lineWidth(1)
    .stroke();
  doc.y = yTopo + t(5, escala);

  doc.font("Times-Bold").fontSize(t(9.8, escala)).fillColor(COR_TITULO).text(titulo, {
    width: larguraMaximaTitulo,
    lineBreak: true,
    align: "left",
  });

  // Linha separadora abaixo do título
  const yBase = doc.y + t(1.5, escala);
  doc
    .moveTo(doc.page.margins.left, yBase)
    .lineTo(doc.page.margins.left + larguraMaximaTitulo, yBase)
    .strokeColor(COR_LINHA)
    .lineWidth(1)
    .stroke();
  doc.y = yBase;
  doc.moveDown(d(0.18, escala));
}