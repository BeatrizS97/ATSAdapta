import { useMemo, useState } from "react";
import DownloadModal from "./DownloadModal.jsx";

const ROTULOS_OPERACAO = {
  copiar: "a cópia para a área de transferência",
  txt: "o arquivo .txt",
  pdf: "o PDF",
  docx: "o arquivo Word",
};

// Rótulos de seção do currículo, em português e em inglês. O idioma exibido
// depende do campo "idioma" retornado pela IA (ver lib/iaService.js, regra 14).
const ROTULOS_SECAO = {
  pt: {
    resumo: "Resumo profissional",
    experiencia: "Experiência profissional",
    projetos: "Projetos relevantes",
    formacao: "Formação",
    cursos: "Cursos e Certificados",
    idiomas: "Idiomas",
    atividades: "Atividades complementares",
    habilidades: "Habilidades Técnicas",
    stack: "Stack",
  },
  en: {
    resumo: "Professional Summary",
    experiencia: "Work Experience",
    projetos: "Relevant Projects",
    formacao: "Education",
    cursos: "Courses and Certifications",
    idiomas: "Languages",
    atividades: "Additional Activities",
    habilidades: "Technical Skills",
    stack: "Stack",
  },
};

function obterRotulos(idioma) {
  return ROTULOS_SECAO[idioma === "en" ? "en" : "pt"];
}

/**
 * Junta partes não vazias com " | " e garante pontuação final consistente
 * (ex: "FATEC Praia Grande | Concluído em Jul/2026."), independente do que
 * a IA tenha retornado.
 */
function formatarLinhaSecundaria(partes) {
  const texto = (partes || []).filter(Boolean).join(" | ");
  if (!texto) return "";
  return /[.!?]$/.test(texto) ? texto : `${texto}.`;
}

/**
 * Junta instituição e ano/período de um curso/certificado no formato
 * "Instituição (ano)", sem pontuação final — usada para compor a linha
 * única de cada item da lista de cursos e certificados.
 */
function formatarDetalheCurso(instituicao, ano) {
  const partes = [instituicao, ano ? `(${ano})` : ""].filter(Boolean);
  return partes.join(" ");
}

function normalizarParteNomeArquivo(texto) {
  return (texto || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9\s]/g, "")
    .trim()
    .replace(/\s+/g, "_");
}

// Usa só o primeiro e o último nome do candidato, para o arquivo não ficar
// gigante quando o nome completo tem vários nomes do meio.
function extrairNomeSobrenome(nomeCompleto) {
  const partes = (nomeCompleto || "").trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return "Curriculo";
  if (partes.length === 1) return normalizarParteNomeArquivo(partes[0]);
  return [normalizarParteNomeArquivo(partes[0]), normalizarParteNomeArquivo(partes[partes.length - 1])]
    .filter(Boolean)
    .join("_");
}

// Nome de arquivo padrão ATS/RH: "CV_Nome_Sobrenome_Area.extensao", usado
// para PDF, Word e TXT. A "Area" vem do cargoAlvo que a IA identificou a
// partir da vaga (não do texto colado da descrição, que podia ficar
// gigante/bagunçado no nome do arquivo).
function montarNomeArquivo(nomeCandidato, cargoAlvo, extensao) {
  const nomeSobrenome = extrairNomeSobrenome(nomeCandidato);
  const area = normalizarParteNomeArquivo(cargoAlvo) || "Curriculo";
  return `CV_${nomeSobrenome}_${area}.${extensao}`;
}

// Aplica a seleção de campos opcionais (checkboxes) ao currículo antes de
// exibir/copiar/baixar, para que a pré-visualização e os arquivos gerados
// fiquem sempre coerentes com o que o usuário marcou.
function filtrarCurriculo(curriculo, campos) {
  return {
    ...curriculo,
    idiomas: campos.idiomas ? curriculo.idiomas || [] : [],
    cursosCertificados: campos.cursosCertificados ? curriculo.cursosCertificados || [] : [],
    atividadesComplementares: campos.atividadesComplementares
      ? curriculo.atividadesComplementares || []
      : [],
    projetos: campos.projetos ? curriculo.projetos || [] : [],
  };
}

function converterParaTexto(curriculo) {
  const rotulos = obterRotulos(curriculo.idioma);
  const linhas = [];

  linhas.push(curriculo.nome);
  if (curriculo.cargoAlvo) linhas.push(curriculo.cargoAlvo);
  if (curriculo.contato) linhas.push(curriculo.contato);
  linhas.push("");

  if (curriculo.resumoProfissional) {
    linhas.push(rotulos.resumo.toUpperCase());
    linhas.push(curriculo.resumoProfissional);
    linhas.push("");
  }

  if (curriculo.experiencias.length > 0) {
    linhas.push(rotulos.experiencia.toUpperCase());
    curriculo.experiencias.forEach((experiencia) => {
      linhas.push(`${experiencia.cargo} | ${experiencia.empresa}`);
      if (experiencia.periodo) linhas.push(experiencia.periodo);
      (experiencia.bullets || []).forEach((bullet) => linhas.push(`- ${bullet}`));
      if (experiencia.stack && experiencia.stack.length > 0) {
        linhas.push(`${rotulos.stack}: ${experiencia.stack.join(", ")}`);
      }
      linhas.push("");
    });
  }

  if (curriculo.projetos && curriculo.projetos.length > 0) {
    linhas.push(rotulos.projetos.toUpperCase());
    curriculo.projetos.forEach((projeto) => {
      linhas.push(projeto.nome);
      if (projeto.descricao) linhas.push(`- ${projeto.descricao}`);
      if (projeto.link) linhas.push(projeto.link);
      linhas.push("");
    });
  }

  if (curriculo.formacao.length > 0) {
    linhas.push(rotulos.formacao.toUpperCase());
    curriculo.formacao.forEach((item) => {
      const detalhe = formatarLinhaSecundaria([item.instituicao, item.periodo]);
      linhas.push(detalhe ? `${item.curso} — ${detalhe}` : item.curso);
    });
    linhas.push("");
  }

  if (curriculo.cursosCertificados && curriculo.cursosCertificados.length > 0) {
    linhas.push(rotulos.cursos.toUpperCase());
    curriculo.cursosCertificados.forEach((item) => {
      const detalhe = formatarDetalheCurso(item.instituicao, item.ano);
      linhas.push(`- ${item.nome}${detalhe ? ` — ${detalhe}` : ""}`);
    });
    linhas.push("");
  }

  if (curriculo.idiomas && curriculo.idiomas.length > 0) {
    linhas.push(rotulos.idiomas.toUpperCase());
    curriculo.idiomas.forEach((idioma) => linhas.push(idioma));
    linhas.push("");
  }

  if (curriculo.atividadesComplementares && curriculo.atividadesComplementares.length > 0) {
    linhas.push(rotulos.atividades.toUpperCase());
    curriculo.atividadesComplementares.forEach((atividade) => linhas.push(atividade));
    linhas.push("");
  }

  if (curriculo.habilidades.length > 0) {
    linhas.push(rotulos.habilidades.toUpperCase());
    linhas.push(curriculo.habilidades.join(" | "));
  }

  return linhas.join("\n");
}

function ResultadoCurriculo({ curriculo, onErro, onSucesso }) {
  const [operacaoEmAndamento, setOperacaoEmAndamento] = useState("");

  const [campos, setCampos] = useState({
    idiomas: true,
    cursosCertificados: true,
    atividadesComplementares: true,
    projetos: true,
  });

  const curriculoFiltrado = useMemo(
    () => filtrarCurriculo(curriculo, campos),
    [curriculo, campos]
  );

  const rotulos = obterRotulos(curriculoFiltrado.idioma);

  const opcoesDisponiveis = [
    { chave: "idiomas", rotulo: "Idiomas", temConteudo: (curriculo.idiomas || []).length > 0 },
    {
      chave: "cursosCertificados",
      rotulo: "Cursos / Certificados",
      temConteudo: (curriculo.cursosCertificados || []).length > 0,
    },
    {
      chave: "atividadesComplementares",
      rotulo: "Atividades complementares",
      temConteudo: (curriculo.atividadesComplementares || []).length > 0,
    },
    {
      chave: "projetos",
      rotulo: "Projetos (com link)",
      temConteudo: (curriculo.projetos || []).length > 0,
    },
  ].filter((opcao) => opcao.temConteudo);

  function alternarCampo(chave) {
    setCampos((atual) => ({ ...atual, [chave]: !atual[chave] }));
  }

  // Garante que só uma operação (copiar / baixar txt / baixar pdf / baixar word)
  // rode por vez. Enquanto uma estiver em andamento, o modal aparece e os
  // demais botões ficam desabilitados (ver "disabled" nos botões abaixo).
  async function executarComBloqueio(operacao, funcao) {
    if (operacaoEmAndamento) return;
    setOperacaoEmAndamento(operacao);
    try {
      await funcao();
    } finally {
      setOperacaoEmAndamento("");
    }
  }

  function copiarTexto() {
    executarComBloqueio("copiar", async () => {
      await navigator.clipboard.writeText(converterParaTexto(curriculoFiltrado));
      onSucesso("Currículo copiado para a área de transferência.");
    });
  }

  function baixarComoTxt() {
    executarComBloqueio("txt", async () => {
      const blob = new Blob([converterParaTexto(curriculoFiltrado)], {
        type: "text/plain;charset=utf-8",
      });
      const nomeArquivo = montarNomeArquivo(curriculoFiltrado.nome, curriculoFiltrado.cargoAlvo, "txt");
      dispararDownload(blob, nomeArquivo);
      onSucesso("Download do arquivo .txt iniciado.");
    });
  }

  function baixarArquivoGerado(formato) {
    executarComBloqueio(formato, async () => {
      try {
        const resposta = await fetch("/api/gerar-arquivo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ curriculo: curriculoFiltrado, formato }),
        });

        if (!resposta.ok) {
          const dados = await resposta.json().catch(() => ({}));
          throw new Error(dados.erro || "Erro ao gerar o arquivo.");
        }

        const blob = await resposta.blob();
        const nomeArquivo = montarNomeArquivo(
          curriculoFiltrado.nome,
          curriculoFiltrado.cargoAlvo,
          formato === "pdf" ? "pdf" : "docx"
        );
        dispararDownload(blob, nomeArquivo);
        onSucesso(formato === "pdf" ? "PDF baixado com sucesso." : "Arquivo Word baixado com sucesso.");
      } catch (erro) {
        onErro(erro.message);
      }
    });
  }

  function dispararDownload(blob, nomeArquivo) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = nomeArquivo;
    link.click();
    URL.revokeObjectURL(url);
  }

  const algumaOperacaoEmAndamento = Boolean(operacaoEmAndamento);

  return (
    <div className="resultado">
      <DownloadModal rotulo={ROTULOS_OPERACAO[operacaoEmAndamento]} />

      <h2>Currículo adaptado</h2>

      {opcoesDisponiveis.length > 0 && (
        <div className="campos-opcionais">
          <p className="campos-opcionais-titulo">Incluir no currículo adaptado:</p>
          <div className="campos-opcionais-lista">
            {opcoesDisponiveis.map((opcao) => (
              <label key={opcao.chave} className="campo-opcional-item">
                <input
                  type="checkbox"
                  checked={campos[opcao.chave]}
                  onChange={() => alternarCampo(opcao.chave)}
                />
                <span>{opcao.rotulo}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      <div className="preview-curriculo">
        <p className="preview-nome">{curriculoFiltrado.nome}</p>
        {curriculoFiltrado.cargoAlvo && (
          <p className="preview-subtitulo">{curriculoFiltrado.cargoAlvo}</p>
        )}
        {curriculoFiltrado.contato && <p className="preview-contato">{curriculoFiltrado.contato}</p>}

        {curriculoFiltrado.resumoProfissional && (
          <div className="preview-secao">
            <p className="preview-titulo-secao">{rotulos.resumo}</p>
            <p>{curriculoFiltrado.resumoProfissional}</p>
          </div>
        )}

        {curriculoFiltrado.experiencias.length > 0 && (
          <div className="preview-secao">
            <p className="preview-titulo-secao">{rotulos.experiencia}</p>
            {curriculoFiltrado.experiencias.map((experiencia, indice) => (
              <div key={indice} className="preview-experiencia">
                <p className="preview-cargo">
                  {experiencia.cargo} | {experiencia.empresa}
                </p>
                {experiencia.periodo && (
                  <p className="preview-periodo">{experiencia.periodo}</p>
                )}
                <ul>
                  {(experiencia.bullets || []).map((bullet, indiceBullet) => (
                    <li key={indiceBullet}>{bullet}</li>
                  ))}
                </ul>
                {experiencia.stack && experiencia.stack.length > 0 && (
                  <p className="preview-stack">
                    <strong>{rotulos.stack}:</strong> {experiencia.stack.join(", ")}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {curriculoFiltrado.projetos && curriculoFiltrado.projetos.length > 0 && (
          <div className="preview-secao">
            <p className="preview-titulo-secao">{rotulos.projetos}</p>
            {curriculoFiltrado.projetos.map((projeto, indice) => (
              <div key={indice} className="preview-projeto">
                <p className="preview-cargo">{projeto.nome}</p>
                {projeto.descricao && (
                  <ul>
                    <li>{projeto.descricao}</li>
                  </ul>
                )}
                {projeto.link && (
                  <a
                    className="preview-projeto-link"
                    href={projeto.link}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {projeto.link}
                  </a>
                )}
              </div>
            ))}
          </div>
        )}

        {curriculoFiltrado.formacao.length > 0 && (
          <div className="preview-secao">
            <p className="preview-titulo-secao">{rotulos.formacao}</p>
            {curriculoFiltrado.formacao.map((item, indice) => {
              const detalhe = formatarLinhaSecundaria([item.instituicao, item.periodo]);
              return (
                <p key={indice} className="preview-formacao-linha">
                  <strong>{item.curso}</strong>
                  {detalhe && ` — ${detalhe}`}
                </p>
              );
            })}
          </div>
        )}

        {curriculoFiltrado.cursosCertificados && curriculoFiltrado.cursosCertificados.length > 0 && (
          <div className="preview-secao">
            <p className="preview-titulo-secao">{rotulos.cursos}</p>
            <ul>
              {curriculoFiltrado.cursosCertificados.map((item, indice) => (
                <li key={indice}>
                  <strong>{item.nome}</strong>
                  {item.instituicao && <> — {item.instituicao}</>}
                  {item.ano && <> ({item.ano})</>}
                </li>
              ))}
            </ul>
          </div>
        )}

        {curriculoFiltrado.idiomas && curriculoFiltrado.idiomas.length > 0 && (
          <div className="preview-secao">
            <p className="preview-titulo-secao">{rotulos.idiomas}</p>
            <p>{curriculoFiltrado.idiomas.join(" | ")}</p>
          </div>
        )}

        {curriculoFiltrado.atividadesComplementares &&
          curriculoFiltrado.atividadesComplementares.length > 0 && (
            <div className="preview-secao">
              <p className="preview-titulo-secao">{rotulos.atividades}</p>
              <ul>
                {curriculoFiltrado.atividadesComplementares.map((atividade, indice) => (
                  <li key={indice}>{atividade}</li>
                ))}
              </ul>
            </div>
          )}

        {curriculoFiltrado.habilidades.length > 0 && (
          <div className="preview-secao">
            <p className="preview-titulo-secao">{rotulos.habilidades}</p>
            <p>{curriculoFiltrado.habilidades.join(" | ")}</p>
          </div>
        )}
      </div>

      <div className="acoes-resultado">
        <button onClick={copiarTexto} disabled={algumaOperacaoEmAndamento}>
          {operacaoEmAndamento === "copiar" ? "Copiando..." : "Copiar"}
        </button>
        <button onClick={baixarComoTxt} disabled={algumaOperacaoEmAndamento}>
          {operacaoEmAndamento === "txt" ? "Gerando .txt..." : "Baixar .txt"}
        </button>
        <button onClick={() => baixarArquivoGerado("pdf")} disabled={algumaOperacaoEmAndamento}>
          {operacaoEmAndamento === "pdf" ? "Gerando PDF..." : "Baixar PDF"}
        </button>
        <button onClick={() => baixarArquivoGerado("docx")} disabled={algumaOperacaoEmAndamento}>
          {operacaoEmAndamento === "docx" ? "Gerando Word..." : "Baixar Word"}
        </button>
      </div>
    </div>
  );
}

export default ResultadoCurriculo;