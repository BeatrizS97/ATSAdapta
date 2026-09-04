// GEMINI_API_KEY e GEMINI_MODEL NÃO podem ser lidos em consts no topo do
// arquivo: como este módulo é importado através de dev-server/apiDevPlugin.js
// -> vite.config.js, a leitura aconteceria ANTES do loadEnv() do próprio
// vite.config.js carregar o .env no process.env, deixando o valor travado
// como undefined para sempre. Por isso lemos dentro de funções, chamadas
// somente quando uma requisição chega (momento em que o .env já foi carregado).
function obterChaveGeminiApi() {
  return process.env.GEMINI_API_KEY;
}

function obterUrlGemini() {
  const modelo = process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";
  return `https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent`;
}

function montarBlocoPerguntasRespostas(perguntasRespostas) {
  if (!perguntasRespostas || perguntasRespostas.length === 0) return "";

  const itens = perguntasRespostas
    .map(
      (item) =>
        `Pergunta: ${item.pergunta}\nResposta do candidato: ${
          item.resposta && item.resposta.trim() ? item.resposta.trim() : "(não respondida)"
        }`
    )
    .join("\n\n");

  return `

PARTE 3 - RESPOSTAS COMPLEMENTARES DO CANDIDATO
O candidato respondeu às perguntas abaixo. Use essas respostas para preencher os marcadores [inserir número/percentual] correspondentes nos bullets da PARTE 1.
Se a resposta estiver em branco, ou for "não sei", "não lembro" ou qualquer variação parecida: remova o marcador [inserir número/percentual] daquele bullet e reescreva a frase sem citar número, mantendo o resto do resultado descrito.
Se a resposta trouxer um valor: substitua o marcador pelo valor informado, de forma natural na frase.

${itens}`;
}

function montarPrompt(textoCurriculo, descricaoVaga, perguntasRespostas = [], traduzirIngles = false) {
  return `Você é um especialista em recrutamento e em otimização de currículos para sistemas ATS (Applicant Tracking System).

Sua tarefa tem duas partes. Siga cada regra abaixo à risca, uma de cada vez.

PARTE 1 - Reescrever o currículo abaixo, retornando cada seção em um campo separado.

REGRAS QUE NUNCA PODEM SER QUEBRADAS:
- NUNCA invente experiências, cargos, empresas, projetos, links, cursos, idiomas ou resultados que não estejam no currículo original.
- NUNCA invente um número ou percentual de resultado. Se o currículo original não trouxer esse dado para um bullet, insira o marcador [inserir número/percentual] no lugar exato do valor.
- Use no máximo um marcador por bullet, e só quando fizer sentido.
- Em caso de dúvida entre inventar ou ser conservador, seja sempre conservador.

REGRA 1 - Idioma e acentuação:
Escreva em português correto, com todos os acentos, cedilhas e tis (exemplos corretos: "não", "ação", "código", "experiência"). NUNCA remova acentos (errado: "nao", "acao", "codigo"). Isso vale para TODOS os campos da resposta. Evite emojis e marcadores exóticos. Esta regra não se aplica se a regra 14 abaixo pedir inglês.

REGRA 2 - Bullets de experiência no método STAR:
Cada bullet de cada experiência profissional deve ser UMA ÚNICA FRASE, em primeira pessoa e voz ativa, com esta estrutura:
1. Comece com um verbo de ação forte no passado.
2. Descreva o que foi feito (contexto).
3. Termine com o resultado ou impacto gerado.
NUNCA escreva os rótulos "Situação", "Tarefa", "Ação" ou "Resultado" no texto.
NUNCA copie o bullet original sem reescrevê-lo nesse formato.
PROIBIDO usar: "Responsável por", "Fui responsável por", "Fui encarregado(a) de", "Auxiliei em", "Ajudei com". Troque sempre por um verbo de ação direto.
Exemplo errado: "Responsável por tarefas do dia a dia do setor."
Exemplo correto: "Assumi as rotinas críticas do setor, padronizando processos e reduzindo o retrabalho da equipe."
Ao reescrever cada bullet, use os termos técnicos e as competências da vaga identificados na REGRA 3, sempre que forem verdadeiros para a experiência descrita naquele bullet. NUNCA invente uma competência ou tecnologia que o candidato não tenha comprovadamente usado naquela experiência.

REGRA 2.1 - Ordem das experiências:
O array "experiencias" deve seguir ordem cronológica inversa: a experiência mais recente primeiro, a mais antiga por último. Use o campo "periodo" de cada experiência do currículo original para decidir a ordem. Se o currículo original não estiver nessa ordem, reordene ao montar a resposta. Uma experiência sem data de término (ex: "Atual", "até o momento") é sempre a mais recente.

REGRA 3 - Palavras-chave da vaga:
Identifique, no texto da vaga, até 10 palavras-chave divididas em dois grupos:
(a) competências técnicas (hard skills): ferramentas, tecnologias, linguagens, certificações, metodologias exigidas;
(b) habilidades comportamentais (soft skills): comunicação, liderança, trabalho em equipe, proatividade, entre outras mencionadas na vaga.
Sempre que forem verdadeiras para o candidato, incorpore ambos os tipos (técnicas e comportamentais) nos bullets e no resumo profissional, nunca só as técnicas.
Se a descrição da vaga mencionar EXPLICITAMENTE a missão, os valores ou a cultura da empresa, use esse mesmo tom nessas mesmas palavras (só quando verdadeiro para o candidato).
NUNCA invente ou complete com conhecimento próprio a missão, os valores ou a cultura da empresa. Use apenas o que está escrito no texto da vaga abaixo. Se a vaga não falar nada sobre isso, ignore este ponto.

REGRA 3.1 - Resumo profissional otimizado para ATS:
Reescreva o resumo profissional do candidato usando as palavras-chave técnicas e comportamentais identificadas na REGRA 3, de forma que um sistema ATS reconheça os termos da vaga.
O texto deve soar natural e autêntico, como se tivesse sido escrito por uma pessoa, nunca como uma lista de palavras-chave emendadas. NÃO empilhe termos da vaga um atrás do outro só para "bater" com o ATS; incorpore cada termo dentro de uma frase com sentido.
Baseie o conteúdo apenas em experiências, competências e resultados que já estejam no currículo original. Não invente qualificações que o candidato não comprove ter.

REGRA 4 - Cargo alvo:
Preencha "cargoAlvo": um subtítulo curto, com no MÁXIMO 6 PALAVRAS, no formato de título profissional (ex: "Desenvolvedora Front-End", "Analista de Dados Júnior"). Baseie-se no cargo real da vaga e nas competências comprovadas do candidato.
"cargoAlvo" deve conter APENAS o nome limpo do cargo. NUNCA copie trechos do anúncio da vaga, nem rótulos como "Título da vaga:", "Vaga:", "Cargo:", "Posição:", dois-pontos ou aspas.
Errado: "Título da Vaga: Professora de Inteligência Artificial e Programação"
Correto: "Professora de Inteligência Artificial"
NUNCA invente senioridade ou especialização que o candidato não tenha comprovadamente.

REGRA 5 - Cursos e certificados:
Se o currículo original mencionar cursos, certificados ou formações complementares, inclua em "cursosCertificados" apenas os mais relevantes para a vaga. Não invente cursos. Se nenhum for relevante, retorne lista vazia.
Se o currículo mencionar um intercâmbio, escolha UMA única seção para ele, sem duplicar:
- "cursosCertificados": se for curto e focado em aulas/cursos (idiomas, bootcamp).
- "formacao": se for acadêmico formal (semestre de faculdade, graduação, extensão em instituição estrangeira).
- "experiencias": se envolveu estágio, trabalho remunerado ou programa de estudo-trabalho.

REGRA 5.1 - Ordem dos cursos e certificados:
O array "cursosCertificados" também segue ordem cronológica inversa. Cursos EM ANDAMENTO (não concluídos, sem data de conclusão, ou com indicação como "em andamento", "cursando") são sempre a coisa mais recente e devem vir PRIMEIRO na lista, antes de qualquer curso já concluído. Depois deles, liste os cursos concluídos do mais recente para o mais antigo, usando o campo "ano".

REGRA 6 - Idiomas:
Se o currículo mencionar idiomas, inclua todos em "idiomas", no formato "Idioma - Nível" (ex: "Inglês - Avançado"). Não invente idiomas.

REGRA 7 - Atividades complementares:
Se o currículo mencionar artigos, palestras ou outras atividades que NÃO sejam projetos de código/portfólio, selecione as mais relevantes para a vaga e inclua em "atividadesComplementares". Não invente. Se nenhuma for relevante, retorne lista vazia.
Se houver um artigo publicado com DOI, inclua o DOI exatamente como está no currículo original. NUNCA invente ou complete um DOI.

REGRA 8 - Projetos:
Se o currículo mencionar projetos pessoais ou colaborativos com link (GitHub, deploy, portfólio), inclua cada um em "projetos" com: nome, uma descrição breve (tecnologias usadas e problema resolvido) e o "link" copiado EXATAMENTE como está no original. Não invente, não altere e não abrevie o link. Se nenhum projeto tiver link, retorne lista vazia em "projetos".

REGRA 9 - Formação e cursos, campos sem pontuação:
Em "formacao" e "cursosCertificados", preencha "curso"/"nome", "instituicao" e "periodo"/"ano" como texto simples, SEM pontuação final. Mantenha a acentuação correta.

REGRA 10 - Revisão final:
Revise o tom: linguagem direta, profissional, voz ativa, sem adjetivos vagos. Confirme que nenhuma experiência, empresa, resultado, curso ou link foi inventado ou exagerado além do que está no currículo original.

REGRA 11 - Stack de tecnologias:
Para cada experiência, identifique as tecnologias, ferramentas, linguagens ou metodologias mencionadas EXPLICITAMENTE naquela experiência (linguagens, frameworks, bancos de dados, Scrum/Kanban, Git, Figma, GA4, etc.) e preencha o campo "stack" dela, na mesma ordem em que aparecem no original. Não invente tecnologia que não esteja mencionada naquela experiência. Se não houver nenhuma, retorne lista vazia.

REGRA 12 - Trabalho voluntário, siga esta ordem exata:
Se o currículo mencionar trabalho voluntário, siga os passos abaixo, nesta ordem:
Passo 1: Conte quantas experiências profissionais do candidato NÃO são estágio.
Passo 2: Se esse número for ZERO (ou seja, o candidato só tem estágio(s) ou não tem nenhuma experiência) E o voluntariado tiver relação direta com a vaga (mesma área, habilidades ou responsabilidades): inclua o voluntariado como o PRIMEIRO item de "experiencias" (respeitando ainda a REGRA 2.1 de ordem cronológica), usando os mesmos campos (cargo, empresa, periodo, bullets no método STAR, stack).
Passo 3: Em qualquer outro caso, inclua o voluntariado em "atividadesComplementares" em vez de "experiencias".
Não invente trabalho voluntário que não esteja no currículo original.

REGRA 13 - Idioma de saída:
TRADUZIR_PARA_INGLES = ${traduzirIngles ? "true" : "false"}.
Se for true: escreva TODO o conteúdo textual (resumo, cargos, bullets, descrições de projetos, formação, cursos, atividades e habilidades) em inglês, com verbos de ação no passado simples no início de cada bullet e datas no formato MM/YYYY. NÃO traduza nomes próprios (candidato, empresas, instituições, projetos), a menos que exista tradução oficial usada pela própria instituição/empresa. Preencha "idioma" como "en".
Se for false: mantenha tudo em português conforme as demais regras e preencha "idioma" como "pt".

PARTE 2 - Avaliar a aderência do currículo à vaga, antes e depois da adaptação:
1. Calcule "percentualAntes": de 0 a 100, o quanto o currículo ORIGINAL atende à vaga.
2. Calcule "percentualDepois": de 0 a 100, o quanto o currículo ADAPTADO atende à vaga. Este número deve ser maior ou igual ao percentualAntes.
3. Liste em "palavrasChaveEncontradas" as palavras-chave da vaga que o currículo ADAPTADO já cobre, em português com acentuação correta (mesmo que o currículo esteja em inglês, esta lista é interna e fica em português).
4. Liste em "palavrasChaveFaltando" as palavras-chave da vaga que ainda não aparecem no currículo ADAPTADO, também em português.
${montarBlocoPerguntasRespostas(perguntasRespostas)}

Responda APENAS com um JSON válido, sem markdown e sem texto fora do JSON, exatamente neste formato:
{
  "curriculoAdaptado": {
    "nome": "nome completo do candidato",
    "cargoAlvo": "subtítulo curto de cargo/área alinhado à vaga (ex: Desenvolvedora Front-End)",
    "contato": "linha única com cidade/estado, telefone, email, linkedin, github, portfolio, separados por | (somente os que existirem no original)",
    "resumoProfissional": "parágrafo único do resumo profissional",
    "experiencias": [
      {
        "cargo": "cargo",
        "empresa": "empresa",
        "periodo": "período (ex: Fev/2026 - Ago/2026)",
        "bullets": ["bullet no método STAR, sem rótulos", "bullet no método STAR, sem rótulos"],
        "stack": ["tecnologia1", "tecnologia2"]
      }
    ],
    "formacao": [
      { "curso": "nome do curso", "instituicao": "instituição", "periodo": "período" }
    ],
    "cursosCertificados": [
      { "nome": "nome do curso ou certificado", "instituicao": "instituição (se houver)", "ano": "ano (se houver)" }
    ],
    "idiomas": ["idioma - nível (ex: Inglês - Avançado)"],
    "atividadesComplementares": ["descrição da atividade complementar"],
    "projetos": [
      { "nome": "nome do projeto", "descricao": "descrição breve com tecnologias e problema resolvido", "link": "link exato copiado do currículo original" }
    ],
    "habilidades": ["habilidade 1", "habilidade 2"],
    "idioma": "pt ou en, conforme a regra 13"
  },
  "percentualAntes": 0,
  "percentualDepois": 0,
  "palavrasChaveEncontradas": ["exemplo1", "exemplo2"],
  "palavrasChaveFaltando": ["exemplo3"]
}

--- CURRÍCULO ORIGINAL ---
${textoCurriculo}

--- DESCRIÇÃO DA VAGA ---
${descricaoVaga}
`;
}

function montarPromptPerguntas(textoCurriculo, descricaoVaga) {
  return `Você é um especialista em recrutamento e currículos no formato ATS.

Analise o currículo e a descrição da vaga abaixo, seguindo estes passos:
1. Percorra cada bullet de experiência profissional do currículo.
2. Para cada bullet que descreve um resultado mas NÃO traz número, percentual, prazo ou quantidade que comprove esse resultado: crie uma pergunta curta e objetiva em português para o candidato informar esse dado.
3. Crie no máximo 1 pergunta por bullet.
4. NÃO crie pergunta para bullets que já têm número, percentual ou quantidade.
5. NÃO crie pergunta sobre informações sem relação com resultado quantificável.
6. Se nenhum bullet precisar de dado quantitativo, retorne uma lista vazia.
7. Escreva as perguntas em português correto, com acentuação.

Responda APENAS com um JSON válido, sem markdown e sem texto fora do JSON, exatamente neste formato:
{
  "perguntas": [
    { "id": "p1", "pergunta": "Em quantos % você reduziu o tempo de resposta ao liderar a migração de dados?" }
  ]
}

--- CURRÍCULO ORIGINAL ---
${textoCurriculo}

--- DESCRIÇÃO DA VAGA ---
${descricaoVaga}
`;
}

function limparRespostaJson(texto) {
  return texto.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
}

/**
 * Rede de segurança caso a IA copie um trecho literal do anúncio da vaga
 * (ex: "Título da Vaga: Professora de IA") em vez de extrair só o cargo.
 */
function sanitizarCargoAlvo(texto) {
  if (!texto) return "";

  let limpo = texto
    .replace(/^["'“”]+|["'“”]+$/g, "")
    .replace(/^(t[ií]tulo\s+da\s+vaga|vaga|cargo|posi[cç][aã]o)\s*[:\-–]\s*/i, "")
    .trim();

  const palavras = limpo.split(/\s+/).filter(Boolean);
  if (palavras.length > 6) {
    limpo = palavras.slice(0, 6).join(" ");
  }

  return limpo;
}

function aguardar(milissegundos) {
  return new Promise((resolve) => setTimeout(resolve, milissegundos));
}

async function chamarGeminiComRetry(prompt, maxTentativas = 3) {
  const chaveApi = obterChaveGeminiApi();
  const urlGemini = obterUrlGemini();

  for (let tentativa = 1; tentativa <= maxTentativas; tentativa++) {
    const resposta = await fetch(`${urlGemini}?key=${chaveApi}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.3,
        },
      }),
    });

    if (resposta.ok) {
      return resposta;
    }

    const erroTransitorio = resposta.status === 503 || resposta.status === 429;
    const aindaTemTentativa = tentativa < maxTentativas;

    if (erroTransitorio && aindaTemTentativa) {
      await aguardar(tentativa * 2000);
      continue;
    }

    const erro = await resposta.text();

    if (erroTransitorio) {
      throw new Error(
        "O Gemini está com alta demanda no momento (erro 503). Tente novamente em alguns segundos."
      );
    }

    throw new Error(`Erro na API do Gemini (${resposta.status}): ${erro}`);
  }
}

/**
 * Pede à IA uma lista de perguntas sobre dados quantitativos que faltam no
 * currículo, para o usuário responder antes da geração final.
 */
export async function gerarPerguntasComplementares(textoCurriculo, descricaoVaga) {
  if (!obterChaveGeminiApi()) {
    throw new Error(
      "GEMINI_API_KEY não configurada. Adicione a variável de ambiente no projeto da Vercel."
    );
  }

  const prompt = montarPromptPerguntas(textoCurriculo, descricaoVaga);
  const resposta = await chamarGeminiComRetry(prompt);
  const dados = await resposta.json();
  const textoGerado = dados?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!textoGerado) {
    throw new Error("A IA não retornou nenhum texto. Tente novamente.");
  }

  let resultado;
  try {
    resultado = JSON.parse(limparRespostaJson(textoGerado));
  } catch (erroParse) {
    throw new Error("A IA retornou uma resposta em formato inesperado. Tente novamente.");
  }

  return Array.isArray(resultado.perguntas) ? resultado.perguntas : [];
}

/**
 * Envia o currículo, a descrição da vaga, as respostas às perguntas
 * complementares e a preferência de tradução para o Gemini e retorna o
 * currículo adaptado.
 */
export async function adaptarCurriculoComIA(
  textoCurriculo,
  descricaoVaga,
  perguntasRespostas = [],
  traduzirIngles = false
) {
  if (!obterChaveGeminiApi()) {
    throw new Error(
      "GEMINI_API_KEY não configurada. Adicione a variável de ambiente no projeto da Vercel."
    );
  }

  const prompt = montarPrompt(textoCurriculo, descricaoVaga, perguntasRespostas, traduzirIngles);

  const resposta = await chamarGeminiComRetry(prompt);

  const dados = await resposta.json();

  const textoGerado = dados?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!textoGerado) {
    throw new Error("A IA não retornou nenhum texto. Tente novamente.");
  }

  let resultado;
  try {
    resultado = JSON.parse(limparRespostaJson(textoGerado));
  } catch (erroParse) {
    throw new Error("A IA retornou uma resposta em formato inesperado. Tente novamente.");
  }

  if (!resultado.curriculoAdaptado || typeof resultado.curriculoAdaptado !== "object") {
    throw new Error("A resposta da IA não trouxe o currículo adaptado no formato esperado. Tente novamente.");
  }

  const curriculo = resultado.curriculoAdaptado;

  return {
    curriculoAdaptado: {
      nome: curriculo.nome || "",
      cargoAlvo: sanitizarCargoAlvo(curriculo.cargoAlvo || ""),
      contato: curriculo.contato || "",
      resumoProfissional: curriculo.resumoProfissional || "",
      experiencias: Array.isArray(curriculo.experiencias) ? curriculo.experiencias : [],
      formacao: Array.isArray(curriculo.formacao) ? curriculo.formacao : [],
      cursosCertificados: Array.isArray(curriculo.cursosCertificados) ? curriculo.cursosCertificados : [],
      idiomas: Array.isArray(curriculo.idiomas) ? curriculo.idiomas : [],
      atividadesComplementares: Array.isArray(curriculo.atividadesComplementares)
        ? curriculo.atividadesComplementares
        : [],
      projetos: Array.isArray(curriculo.projetos) ? curriculo.projetos : [],
      habilidades: Array.isArray(curriculo.habilidades) ? curriculo.habilidades : [],
      // Garante um valor sempre válido, mesmo que a IA omita o campo.
      idioma: curriculo.idioma === "en" ? "en" : "pt",
    },
    percentualAntes: Number(resultado.percentualAntes) || 0,
    percentualDepois: Number(resultado.percentualDepois) || 0,
    descricaoVaga: resultado.descricaoVaga || "",
    palavrasChaveEncontradas: Array.isArray(resultado.palavrasChaveEncontradas)
      ? resultado.palavrasChaveEncontradas
      : [],
    palavrasChaveFaltando: Array.isArray(resultado.palavrasChaveFaltando)
      ? resultado.palavrasChaveFaltando
      : [],
  };
}