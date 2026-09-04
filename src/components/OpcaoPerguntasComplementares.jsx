/**
 * Checkbox que permite ao usuário desativar a etapa em que a IA faz
 * perguntas complementares antes de gerar o currículo adaptado.
 */
function OpcaoPerguntasComplementares({ permitirPerguntas, onAlterar }) {
  return (
    <label className="campo-opcional-item">
      <input
        type="checkbox"
        checked={permitirPerguntas}
        onChange={(evento) => onAlterar(evento.target.checked)}
      />
      <span>Permitir que a IA faça perguntas complementares antes de gerar o currículo</span>
    </label>
  );
}

export default OpcaoPerguntasComplementares;