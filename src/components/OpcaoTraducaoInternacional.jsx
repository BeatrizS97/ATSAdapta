/**
 * Checkbox que permite ao usuário pedir o currículo adaptado já traduzido
 * para inglês, no padrão de currículo internacional.
 */
function OpcaoTraducaoInternacional({ traduzirIngles, onAlterar }) {
  return (
    <label className="campo-opcional-item">
      <input
        type="checkbox"
        checked={traduzirIngles}
        onChange={(evento) => onAlterar(evento.target.checked)}
      />
      <span>Gerar currículo em inglês (padrão internacional)</span>
    </label>
  );
}

export default OpcaoTraducaoInternacional;