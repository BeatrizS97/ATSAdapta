import { adaptarCurriculoComIA } from "../lib/iaService.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ erro: "Método não permitido." });
    return;
  }

  const { textoCurriculo, descricaoVaga, perguntasRespostas, traduzirIngles } = req.body || {};

  if (!textoCurriculo || textoCurriculo.trim().length === 0) {
    res.status(400).json({ erro: "Nenhum texto de currículo foi enviado." });
    return;
  }

  if (!descricaoVaga || descricaoVaga.trim().length === 0) {
    res.status(400).json({ erro: "A descrição da vaga é obrigatória." });
    return;
  }

  try {
    const resultado = await adaptarCurriculoComIA(
      textoCurriculo,
      descricaoVaga,
      Array.isArray(perguntasRespostas) ? perguntasRespostas : [],
      Boolean(traduzirIngles)
    );

    res.status(200).json(resultado);
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: erro.message || "Erro interno ao processar o currículo." });
  }
}