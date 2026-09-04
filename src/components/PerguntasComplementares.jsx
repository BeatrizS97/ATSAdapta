import { useState } from "react";

function PerguntasComplementares({ perguntas, onResponder, onCancelar, carregando }) {
  const [respostas, setRespostas] = useState({});

  function handleRespostaChange(id, valor) {
    setRespostas((atual) => ({ ...atual, [id]: valor }));
  }

  function handleSubmit(evento) {
    evento.preventDefault();

    const perguntasRespostas = perguntas.map((pergunta) => ({
      pergunta: pergunta.pergunta,
      resposta: (respostas[pergunta.id] || "").trim(),
    }));

    onResponder(perguntasRespostas);
  }

  return (
    <div className="formulario perguntas-complementares">
      <h2>Antes de gerar seu currículo</h2>
      <p className="perguntas-complementares-intro">
        A IA identificou pontos que ficam mais fortes com um número ou resultado concreto.
        Responda o que souber — se não souber, deixe em branco ou escreva "não sei" que o
        currículo é gerado sem esse dado.
      </p>

      <form onSubmit={handleSubmit}>
        {perguntas.map((pergunta) => (
          <div key={pergunta.id} className="campo">
            <label htmlFor={`pergunta-${pergunta.id}`}>{pergunta.pergunta}</label>
            <textarea
              id={`pergunta-${pergunta.id}`}
              rows={2}
              placeholder="Sua resposta (ou deixe em branco se não souber)"
              value={respostas[pergunta.id] || ""}
              onChange={(evento) => handleRespostaChange(pergunta.id, evento.target.value)}
            />
          </div>
        ))}

        <div className="perguntas-complementares-acoes">
          <button type="button" onClick={onCancelar} disabled={carregando}>
            Voltar
          </button>
          <button type="submit" disabled={carregando}>
            {carregando ? "Gerando currículo..." : "Gerar currículo adaptado"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default PerguntasComplementares;