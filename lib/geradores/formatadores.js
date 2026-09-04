/**
 * Funções de formatação de texto usadas tanto na geração de PDF quanto de
 * DOCX, para manter os dois formatos consistentes entre si.
 */

// Junta partes não vazias com " | " e garante pontuação final (ex: "FATEC | Concluído em 2026.")
export function formatarLinhaSecundaria(partes) {
  const texto = (partes || []).filter(Boolean).join(" | ");
  if (!texto) return "";
  return /[.!?]$/.test(texto) ? texto : `${texto}.`;
}

// Junta instituição e ano/período de um curso no formato "Instituição (ano)"
export function formatarDetalheCurso(instituicao, ano) {
  const partes = [instituicao, ano ? `(${ano})` : ""].filter(Boolean);
  return partes.join(" ");
}

// Identifica se um trecho do campo "contato" é e-mail ou link, para poder
// virar hyperlink clicável no PDF/DOCX gerado.
export function analisarSegmentoContato(parte) {
  const parteLimpa = (parte || "").trim();

  const ehEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(parteLimpa);
  const ehLink = !ehEmail && /^(https?:\/\/|www\.)/i.test(parteLimpa);

  if (ehEmail) return { link: `mailto:${parteLimpa}` };
  if (ehLink) {
    return { link: /^https?:\/\//i.test(parteLimpa) ? parteLimpa : `https://${parteLimpa}` };
  }
  return { link: null };
}