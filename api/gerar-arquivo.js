import { gerarPdf, gerarDocx } from "../lib/arquivoService.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ erro: "Método não permitido." });
    return;
  }

  const { curriculo, formato } = req.body || {};

  if (!curriculo || typeof curriculo !== "object") {
    res.status(400).json({ erro: "Nenhum currículo foi enviado." });
    return;
  }

  if (formato !== "pdf" && formato !== "docx") {
    res.status(400).json({ erro: "Formato inválido. Use 'pdf' ou 'docx'." });
    return;
  }

  try {
    if (formato === "pdf") {
      const buffer = await gerarPdf(curriculo);
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", "attachment; filename=curriculo-adaptado.pdf");
      res.status(200).send(buffer);
      return;
    }

    const buffer = await gerarDocx(curriculo);
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    );
    res.setHeader("Content-Disposition", "attachment; filename=curriculo-adaptado.docx");
    res.status(200).send(buffer);
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: erro.message || "Erro ao gerar o arquivo." });
  }
}