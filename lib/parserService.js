import pdfParse from "pdf-parse";
import mammoth from "mammoth";

/**
 * Extrai o texto de um arquivo de currículo (PDF ou DOCX).
 * @param {Buffer} buffer - O buffer (que é o conteúdo do arquivo) do arquivo.
 * @param {string} mimetype - O mimetype do arquivo enviado no upload.
 * @returns {Promise<string>} - O texto extraído do arquivo.
 */
export async function extrairTextoDoArquivo(buffer, mimetype) {
  if (mimetype === "application/pdf") {
    const resultado = await pdfParse(buffer);
    return resultado.text;
  }

  if (
    mimetype ===
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    const resultado = await mammoth.extractRawText({ buffer });
    return resultado.value;
  }

  throw new Error(
    "Formato de arquivo não suportado. Envie um arquivo PDF ou DOCX."
  );
}