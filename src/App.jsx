import { useEffect, useRef, useState } from "react";
import FormularioCurriculo from "./components/FormularioCurriculo.jsx";
import PerguntasComplementares from "./components/PerguntasComplementares.jsx";
import CompatibilidadeVaga from "./components/CompatibilidadeVaga.jsx";
import ResultadoCurriculo from "./components/ResultadoCurriculo.jsx";
import ToastContainer from "./components/ToastContainer.jsx";

let proximoIdToast = 1;

function App() {
  const [carregando, setCarregando] = useState(false);
  const [mensagemCarregando, setMensagemCarregando] = useState("Adaptando seu currículo...");
  const [resultado, setResultado] = useState(null);
  const [descricaoVagaEnviada, setDescricaoVagaEnviada] = useState("");
  const [toasts, setToasts] = useState([]);

  // Guarda o texto já extraído do currículo, a vaga, as perguntas geradas
  // pela IA e a preferência de tradução, enquanto se aguarda o usuário
  // responder, antes da geração final.
  const [dadosPerguntas, setDadosPerguntas] = useState(null);

  // Usado para rolar a tela até o currículo adaptado assim que ele fica pronto.
  const resultadoRef = useRef(null);

  useEffect(() => {
    if (resultado && resultadoRef.current) {
      resultadoRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [resultado]);

  // Assim que as perguntas complementares da IA aparecem, o formulário de
  // perguntas substitui o formulário de envio dentro da mesma seção "hero".
  // Sem isto, a página mantém a posição de rolagem anterior e, como o
  // formulário de perguntas costuma ser mais alto, o usuário acaba caindo
  // no meio dele em vez de ver o início (o título "Antes de gerar seu
  // currículo"). Por isso rolamos explicitamente para o topo da página.
  useEffect(() => {
    if (dadosPerguntas) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [dadosPerguntas]);

  function mostrarToast(mensagem, tipo = "erro") {
    const id = proximoIdToast++;
    setToasts((atual) => [...atual, { id, mensagem, tipo }]);

    setTimeout(() => {
      setToasts((atual) => atual.filter((toast) => toast.id !== id));
    }, 5000);
  }

  function mostrarErro(mensagem) {
    mostrarToast(mensagem, "erro");
  }

  function mostrarSucesso(mensagem) {
    mostrarToast(mensagem, "sucesso");
  }

  function fecharToast(id) {
    setToasts((atual) => atual.filter((toast) => toast.id !== id));
  }

  async function buscarPerguntas(arquivo, descricaoVaga, opcoes) {
    setResultado(null);
    setDadosPerguntas(null);
    setMensagemCarregando("Analisando seu currículo...");
    setCarregando(true);

    try {
      const formData = new FormData();
      formData.append("curriculo", arquivo);
      formData.append("descricaoVaga", descricaoVaga);
      formData.append("permitirPerguntas", opcoes.permitirPerguntas ? "true" : "false");

      const resposta = await fetch("/api/perguntas", {
        method: "POST",
        body: formData,
      });

      const dados = await resposta.json();

      if (!resposta.ok) {
        throw new Error(dados.erro || "Erro ao analisar o currículo.");
      }

      if (dados.perguntas && dados.perguntas.length > 0) {
        setDadosPerguntas({
          textoCurriculo: dados.textoCurriculo,
          descricaoVaga: dados.descricaoVaga,
          perguntas: dados.perguntas,
          traduzirIngles: opcoes.traduzirIngles,
        });
        setCarregando(false);
        return;
      }

      await adaptarCurriculoFinal(dados.textoCurriculo, dados.descricaoVaga, [], opcoes.traduzirIngles);
    } catch (erroCapturado) {
      mostrarErro(erroCapturado.message);
      setCarregando(false);
    }
  }

  async function adaptarCurriculoFinal(textoCurriculo, descricaoVaga, perguntasRespostas, traduzirIngles) {
    setMensagemCarregando("Adaptando seu currículo...");
    setCarregando(true);

    try {
      const resposta = await fetch("/api/adaptar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          textoCurriculo,
          descricaoVaga,
          perguntasRespostas,
          traduzirIngles: Boolean(traduzirIngles),
        }),
      });

      const dados = await resposta.json();

      if (!resposta.ok) {
        throw new Error(dados.erro || "Erro ao adaptar o currículo.");
      }

      setDescricaoVagaEnviada(descricaoVaga);
      setResultado(dados);
      setDadosPerguntas(null);
    } catch (erroCapturado) {
      mostrarErro(erroCapturado.message);
    } finally {
      setCarregando(false);
    }
  }

  function cancelarPerguntas() {
    setDadosPerguntas(null);
  }

  return (
    <div className="pagina">
      <ToastContainer toasts={toasts} onFechar={fecharToast} />

      {carregando && (
        <div className="overlay-carregando" role="status" aria-live="polite">
          <div className="spinner-carregando" />
          <p>{mensagemCarregando}</p>
        </div>
      )}

      <header className="cabecalho">
        <div className="container">
          <span className="marca">
            <span className="marca-destaque">ATS</span>Adapta
          </span>
          <p className="marca-subtitulo">Um currículo novo pra cada vaga, em minutos</p>
        </div>
      </header>

      <main className="container">
        <section className="hero">
          <div className="hero-texto">
            <h1>
              Adapte seu currículo para <em>passar pelo ATS</em>
            </h1>
            <p>
              Envie seu currículo e cole a descrição da vaga. A IA reescreve suas
              experiências no formato STAR e ajusta o texto ao padrão ATS.
            </p>
            <ul className="hero-lista">
              <li>Palavras-chave da vaga incorporadas automaticamente</li>
              <li>Compatibilidade calculada antes e depois da adaptação</li>
              <li>Download em .txt, PDF ou Word</li>
            </ul>

            <div className="hero-manuscrito">
              <p className="manuscrito-rotulo">Como a reescrita funciona</p>
              <p className="manuscrito-linha manuscrito-riscado">
                Responsável por tarefas do dia a dia
              </p>
              <p className="manuscrito-linha manuscrito-linha-nova">
                <span className="manuscrito-seta">→</span>
                <span className="manuscrito-inserido">
                  Liderei a migração de dados que reduziu o tempo de resposta em 30%
                </span>
              </p>
              <span className="manuscrito-nota">+ 3 palavras-chave da vaga incorporadas</span>
            </div>
          </div>

          {dadosPerguntas ? (
            <PerguntasComplementares
              perguntas={dadosPerguntas.perguntas}
              carregando={carregando}
              onResponder={(perguntasRespostas) =>
                adaptarCurriculoFinal(
                  dadosPerguntas.textoCurriculo,
                  dadosPerguntas.descricaoVaga,
                  perguntasRespostas,
                  dadosPerguntas.traduzirIngles
                )
              }
              onCancelar={cancelarPerguntas}
            />
          ) : (
            <FormularioCurriculo
              onEnviar={buscarPerguntas}
              carregando={carregando}
              onErro={mostrarErro}
            />
          )}
        </section>

        {resultado && (
          <div ref={resultadoRef}>
            <ResultadoCurriculo
              curriculo={resultado.curriculoAdaptado}
              descricaoVaga={descricaoVagaEnviada}
              onErro={mostrarErro}
              onSucesso={mostrarSucesso}
            />
            <CompatibilidadeVaga
              percentualAntes={resultado.percentualAntes}
              percentualDepois={resultado.percentualDepois}
              palavrasChaveEncontradas={resultado.palavrasChaveEncontradas}
              palavrasChaveFaltando={resultado.palavrasChaveFaltando}
            />
          </div>
        )}
      </main>
    </div>
  );
}

export default App;