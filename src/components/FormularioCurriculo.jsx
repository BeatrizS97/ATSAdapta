import { useRef, useState } from "react";
import OpcaoTraducaoInternacional from "./OpcaoTraducaoInternacional.jsx";
import OpcaoPerguntasComplementares from "./OpcaoPerguntasComplementares.jsx";

const LIMITE_CARACTERES_VAGA = 5000;

const TAMANHO_MAXIMO_ARQUIVO_MB = 5;
const TAMANHO_MAXIMO_ARQUIVO = TAMANHO_MAXIMO_ARQUIVO_MB * 1024 * 1024;
const EXTENSOES_ACEITAS = [".pdf", ".docx"];

function extensaoValida(nomeArquivo) {
  const nomeMinusculo = nomeArquivo.toLowerCase();
  return EXTENSOES_ACEITAS.some((extensao) => nomeMinusculo.endsWith(extensao));
}

function FormularioCurriculo({ onEnviar, carregando, onErro }) {
  const inputArquivoRef = useRef(null);
  const [arquivo, setArquivo] = useState(null);
  const [nomeArquivoSelecionado, setNomeArquivoSelecionado] = useState("");
  const [descricaoVaga, setDescricaoVaga] = useState("");

  // Opções adicionais de geração, controladas pelos componentes de checkbox.
  const [traduzirIngles, setTraduzirIngles] = useState(false);
  const [permitirPerguntas, setPermitirPerguntas] = useState(true);

  function removerArquivo() {
    setArquivo(null);
    setNomeArquivoSelecionado("");
    if (inputArquivoRef.current) {
      inputArquivoRef.current.value = "";
    }
  }

  function handleArquivoChange(evento) {
    const arquivoSelecionado = evento.target.files[0];

    if (!arquivoSelecionado) {
      removerArquivo();
      return;
    }

    if (!extensaoValida(arquivoSelecionado.name)) {
      onErro("Formato não suportado. Envie um arquivo PDF ou DOCX.");
      removerArquivo();
      return;
    }

    if (arquivoSelecionado.size > TAMANHO_MAXIMO_ARQUIVO) {
      onErro(`O arquivo excede o limite de ${TAMANHO_MAXIMO_ARQUIVO_MB}MB.`);
      removerArquivo();
      return;
    }

    setArquivo(arquivoSelecionado);
    setNomeArquivoSelecionado(arquivoSelecionado.name);
  }

  function handleDescricaoChange(evento) {
    setDescricaoVaga(evento.target.value.slice(0, LIMITE_CARACTERES_VAGA));
  }

  function handleSubmit(evento) {
    evento.preventDefault();

    if (!arquivo) {
      onErro("Selecione um arquivo de currículo (PDF ou DOCX).");
      return;
    }

    if (descricaoVaga.trim().length === 0) {
      onErro("Cole a descrição da vaga.");
      return;
    }

    onEnviar(arquivo, descricaoVaga, { traduzirIngles, permitirPerguntas });
  }

  const proporcaoCaracteres = descricaoVaga.length / LIMITE_CARACTERES_VAGA;
  let classeContador = "contador-caracteres";
  if (proporcaoCaracteres >= 1) {
    classeContador += " contador-caracteres-limite";
  } else if (proporcaoCaracteres >= 0.8) {
    classeContador += " contador-caracteres-aviso";
  }

  return (
    <form onSubmit={handleSubmit} className="formulario">
      <div className="campo">
        <label htmlFor="arquivo">Currículo (PDF ou DOCX)</label>
        <div className="campo-arquivo">
          <input
            id="arquivo"
            ref={inputArquivoRef}
            type="file"
            accept=".pdf,.docx"
            onChange={handleArquivoChange}
          />
          {nomeArquivoSelecionado && (
            <div className="campo-arquivo-selecionado">
              <span className="campo-arquivo-nome">{nomeArquivoSelecionado}</span>
              <button
                type="button"
                className="campo-arquivo-remover"
                onClick={removerArquivo}
                aria-label="Remover arquivo selecionado"
              >
                <svg
                  viewBox="0 0 24 24"
                  width="16"
                  height="16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                  <path d="M10 11v6" />
                  <path d="M14 11v6" />
                  <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                </svg>
              </button>
            </div>
          )}
        </div>
        <span className="campo-ajuda">
          Formatos aceitos: PDF ou DOCX, até {TAMANHO_MAXIMO_ARQUIVO_MB}MB.
        </span>
      </div>

      {/* Correção: classe "campo-vaga" adicional faz este campo crescer para
          preencher a altura do card do formulário (ver .formulario e
          .campo-vaga no App.css), harmonizando com a altura do bloco de
          texto à esquerda do hero. */}
      <div className="campo campo-vaga">
        <label htmlFor="vaga">Descrição da vaga</label>
        <textarea
          id="vaga"
          rows={8}
          placeholder="Cole aqui o texto da vaga..."
          value={descricaoVaga}
          onChange={handleDescricaoChange}
          maxLength={LIMITE_CARACTERES_VAGA}
        />
        <span className={classeContador}>
          {descricaoVaga.length} / {LIMITE_CARACTERES_VAGA} caracteres
        </span>
      </div>

      <div className="campos-opcionais">
        <p className="campos-opcionais-titulo">Opções de geração:</p>
        <div className="campos-opcionais-lista">
          <OpcaoTraducaoInternacional
            traduzirIngles={traduzirIngles}
            onAlterar={setTraduzirIngles}
          />
          <OpcaoPerguntasComplementares
            permitirPerguntas={permitirPerguntas}
            onAlterar={setPermitirPerguntas}
          />
        </div>
      </div>

      <button type="submit" disabled={carregando}>
        {carregando ? "Adaptando currículo..." : "Adaptar currículo"}
      </button>
    </form>
  );
}

export default FormularioCurriculo;