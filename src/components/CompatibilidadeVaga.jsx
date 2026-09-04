function corPorPercentual(percentual) {
  if (percentual >= 70) return "compatibilidade-alta";
  if (percentual >= 40) return "compatibilidade-media";
  return "compatibilidade-baixa";
}

function CompatibilidadeVaga({
  percentualAntes,
  percentualDepois,
  palavrasChaveEncontradas,
  palavrasChaveFaltando,
}) {
  const diferenca = percentualDepois - percentualAntes;

  return (
    <div className="compatibilidade">
      <h2>Compatibilidade com a vaga</h2>

      <table className="tabela-compatibilidade">
        <thead>
          <tr>
            <th>Antes da adaptação</th>
            <th>Depois da adaptação</th>
            <th>Variação</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td data-label="Antes da adaptação">
              <span className={`selo-percentual ${corPorPercentual(percentualAntes)}`}>
                {percentualAntes}%
              </span>
            </td>
            <td data-label="Depois da adaptação">
              <span className={`selo-percentual ${corPorPercentual(percentualDepois)}`}>
                {percentualDepois}%
              </span>
            </td>
            <td data-label="Variação" className="variacao-percentual">
              {diferenca > 0 ? `+${diferenca}%` : `${diferenca}%`}
            </td>
          </tr>
        </tbody>
      </table>

      <div className="compatibilidade-palavras">
        {palavrasChaveEncontradas.length > 0 && (
          <div className="lista-palavras">
            {palavrasChaveEncontradas.map((palavra) => (
              <span key={palavra} className="badge badge-encontrada">
                {palavra}
              </span>
            ))}
          </div>
        )}

        {palavrasChaveFaltando.length > 0 && (
          <div className="lista-palavras">
            {palavrasChaveFaltando.map((palavra) => (
              <span key={palavra} className="badge badge-faltando">
                Falta: {palavra}
              </span>
            ))}
          </div>
        )}
      </div>

      <p className="compatibilidade-aviso">
        Percentuais calculados pela IA: "antes" considera o currículo original enviado, "depois"
        considera o currículo já adaptado à vaga.
      </p>
    </div>
  );
}

export default CompatibilidadeVaga;