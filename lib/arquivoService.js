/**
 * Ponto de entrada único para geração de arquivos do currículo adaptado.
 * A lógica em si vive em lib/geradores/ (um arquivo por formato); este
 * módulo só reexporta, para que api/gerar-arquivo.js não precise mudar.
 */
export { gerarPdf } from "./geradores/pdfGerador.js";
export { gerarDocx } from "./geradores/docxGerador.js";