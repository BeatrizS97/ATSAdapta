import formidable from "formidable";
import fs from "fs";
import { extrairTextoDoArquivo } from "../lib/parserService.js";
import { gerarPerguntasComplementares } from "../lib/iaService.js";

// Desliga o parser padrao para ler o multipart/form-data manualmente
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ erro: "Método não permitido." });
    return;
  }

  try {
    const form = formidable({ maxFileSize: 5 * 1024 * 1024 });
    const [fields, files] = await form.parse(req);

    const arquivo = Array.isArray(files.curriculo) ? files.curriculo[0] : files.curriculo;
    const descricaoVaga = Array.isArray(fields.descricaoVaga)
      ? fields.descricaoVaga[0]
      : fields.descricaoVaga;

    // Campo opcional enviado pelo formulário; se ausente, assume-se "true"
    // (comportamento padrão: perguntas complementares habilitadas).
    const permitirPerguntasRaw = Array.isArray(fields.permitirPerguntas)
      ? fields.permitirPerguntas[0]
      : fields.permitirPerguntas;
    const permitirPerguntas = permitirPerguntasRaw !== "false";

    if (!arquivo) {
      res.status(400).json({ erro: "Envie um arquivo de currículo (PDF ou DOCX)." });
      return;
    }

    if (!descricaoVaga || descricaoVaga.trim().length === 0) {
      res.status(400).json({ erro: "A descrição da vaga é obrigatória." });
      return;
    }

    const buffer = fs.readFileSync(arquivo.filepath);
    const mimetype = arquivo.mimetype;

    const textoCurriculo = await extrairTextoDoArquivo(buffer, mimetype);

    if (!textoCurriculo || textoCurriculo.trim().length === 0) {
      res.status(400).json({
        erro: "Não foi possível extrair texto do arquivo enviado. Verifique se o PDF não é uma imagem escaneada.",
      });
      return;
    }

    const perguntas = permitirPerguntas
      ? await gerarPerguntasComplementares(textoCurriculo, descricaoVaga)
      : [];

    res.status(200).json({ textoCurriculo, descricaoVaga, perguntas });
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: erro.message || "Erro interno ao processar o currículo." });
  }
}