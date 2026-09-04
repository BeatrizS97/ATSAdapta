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
  const modelo = process.env.GEMINI_MODEL || "gemini-3.6-flash";
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
O candidato respondeu às perguntas abaixo sobre dados quantitativos que faltavam no currículo original. Use essas respostas para preencher os marcadores [inserir número/percentual] correspondentes nos bullets da PARTE 1.
Se a resposta estiver em branco, ou for "não sei", "não lembro", "não sei informar" ou qualquer variação que indique que o candidato não possui o dado, REMOVA o marcador [inserir número/percentual] daquele bullet e reescreva a frase naturalmente, sem citar um número ou percentual, mantendo o restante do resultado descrito.
Se a resposta trouxer um valor, substitua o marcador correspondente pelo valor informado, escrito de forma natural na frase.

${itens}`;
}

function montarPrompt(textoCurriculo, descricaoVaga, perguntasRespostas = [], traduzirIngles = false) {
  return `Você é um especialista em recrutamento e em otimização de currículos para sistemas ATS (Applicant Tracking System).

Sua tarefa tem duas partes:

PARTE 1 - Reescrever o currículo abaixo, retornando cada seção em um campo separado (não um texto único), seguindo estas regras:

1. Escreva em português correto, usando sempre os acentos gráficos, cedilhas e tis corretos (exemplos: "não", "ação", "código", "proteção", "experiência"). NUNCA remova acentos das palavras (errado: "nao", "acao", "codigo", "protecao", "experiencia"). Essa regra vale para TODOS os campos da resposta, inclusive formação, cursos e listas de palavras-chave. Evite apenas símbolos decorativos incomuns (emojis, marcadores exóticos), mas acentos e pontuação normais do idioma devem ser usados sempre. Esta regra NÃO se aplica caso a regra 14 abaixo determine escrita em inglês.

2. MÉTODO STAR / AÇÃO + CONTEXTO + RESULTADO, OBRIGATÓRIO em CADA bullet de CADA experiência profissional. Use Situação, Tarefa, Ação e Resultado apenas como raciocínio interno para estruturar cada bullet, mas escreva o resultado como UMA ÚNICA FRASE FLUIDA que combine: (a) um verbo de ação forte no passado, em primeira pessoa e SEMPRE em voz ativa, logo no início da frase; (b) o contexto/o que foi feito; (c) o resultado ou impacto gerado. NUNCA escreva os rótulos "Situação", "Tarefa", "Ação" ou "Resultado" no texto final, e NUNCA copie o bullet original sem reescrevê-lo nesse formato.
   PROIBIDO usar construções passivas/vagas como "Responsável por", "Fui responsável por", "Fui encarregado(a) de", "Auxiliei em", "Ajudei com". Troque sempre por um verbo de ação direto (ex: em vez de "Responsável por liderar equipe de 5 pessoas", escreva "Liderei equipe de 5 pessoas"; em vez de "Fui encarregada de implementar o sistema", escreva "Implementei o sistema").
   Exemplo do padrão esperado (aplique esse raciocínio a TODAS as experiências, mesmo que o texto original já pareça bem escrito):
   - Fraco (não fazer): "Responsável por tarefas do dia a dia do setor."
   - Correto: "Assumi as rotinas críticas do setor, padronizando processos e reduzindo o retrabalho da equipe."
   Se o currículo original NÃO trouxer um número, percentual ou métrica de resultado para aquele bullet, NÃO invente um valor: insira um marcador de posição no ponto exato da frase, no formato [inserir número/percentual], para que o candidato preencha depois com o dado real (ex: "...reduzindo o tempo de resposta em [inserir percentual]."). Use no máximo um marcador por bullet, apenas quando fizer sentido, e nunca marque bullets que já não tratam de resultado quantificável.

3. Identifique as palavras-chave e competências da descrição da vaga e, sempre que forem verdadeiras para o candidato, incorpore-as naturalmente nos bullets e no resumo profissional. Além disso, SE a descrição da vaga mencionar explicitamente a missão, os valores ou a cultura da empresa contratante, use esse mesmo tom e essas mesmas palavras (quando verdadeiras para o candidato) para alinhar o resumo profissional e os bullets a esse discurso.
   IMPORTANTE: baseie-se APENAS no que estiver escrito no texto da vaga fornecido abaixo. NUNCA invente, pressuponha ou complete com conhecimento próprio a missão, os valores, a cultura ou qualquer outra informação sobre a empresa que não esteja explicitamente presente no texto da vaga. Se a vaga não mencionar nada sobre missão/valores/cultura da empresa, simplesmente ignore este ponto e siga apenas com as palavras-chave e competências técnicas da vaga.

4. Não invente experiências, cargos, empresas, projetos, links, cursos ou resultados que não estejam no currículo original.

5. Preencha "cargoAlvo": um subtítulo curto (MÁXIMO 6 PALAVRAS), no formato de título profissional que aparecerá logo abaixo do nome do candidato (ex: "Desenvolvedora Front-End", "Desenvolvedora Full Stack Júnior", "Analista de Dados Júnior"). Escolha com base no CARGO REAL da vaga descrita E nas competências/experiências comprovadas do candidato.
   IMPORTANTE: "cargoAlvo" deve conter APENAS o nome limpo do cargo/profissão. NUNCA copie trechos literais do anúncio da vaga, rótulos como "Título da vaga:", "Vaga:", "Cargo:", "Posição:", dois-pontos, aspas ou qualquer outro texto que não seja o próprio nome do cargo.
   Errado (não fazer): "Título da Vaga: Professora de Inteligência Artificial e Programação"
   Correto: "Professora de Inteligência Artificial"
   NUNCA invente senioridade, especialização ou área que o candidato não tenha comprovadamente.

6. Se o currículo original mencionar cursos, certificados ou formações complementares, inclua no campo "cursosCertificados" apenas os mais relevantes e qualificados para a vaga descrita (não invente cursos que não estejam no currículo original; se nenhum for relevante, retorne uma lista vazia).
   Se o currículo original mencionar um intercâmbio, decida em qual seção ele deve entrar, sem duplicar em mais de uma: inclua em "cursosCertificados" quando for de curta duração e voltado a aulas/cursos (ex: curso de idiomas, bootcamp); inclua em "formacao" quando for focado em estudos acadêmicos formais (um semestre de faculdade, graduação completa ou curso de extensão em instituição de ensino estrangeira); inclua em "experiencias" quando tiver envolvido estágio, trabalho remunerado ou programa de estudo-trabalho no exterior.

7. Se o currículo original mencionar idiomas, inclua todos no campo "idiomas", no formato "Idioma - Nível" (ex: "Inglês - Avançado"). Não invente idiomas que não estejam no currículo original.

8. Se o currículo original mencionar artigos publicados, palestras, ou outras atividades relevantes que NÃO sejam projetos de código/portfólio, selecione as mais relevantes e qualificadas para a vaga e inclua no campo "atividadesComplementares" (não invente; se nenhuma for relevante, retorne uma lista vazia).
   Se o currículo original mencionar um artigo científico publicado que traga um DOI (Digital Object Identifier), inclua esse DOI junto à referência do artigo, exatamente como aparece no currículo original. NUNCA invente ou complete um DOI que não esteja explicitamente presente no currículo original.

9. Se o currículo original mencionar projetos pessoais, autorais ou colaborativos que tenham um link (GitHub, repositório, deploy, portfólio, etc.), inclua cada um no campo "projetos" com: nome do projeto, uma descrição breve em uma frase (destacando tecnologias usadas e o problema resolvido) e o "link" copiado EXATAMENTE como aparece no currículo original (não invente, não altere e não abrevie o link). Se nenhum projeto do currículo original tiver link, retorne uma lista vazia em "projetos".

10. Para os campos "formacao" e "cursosCertificados", preencha "curso"/"nome", "instituicao" e "periodo"/"ano" como textos simples, SEM pontuação final (o sistema aplica a formatação e a pontuação final automaticamente depois) — apenas garanta que estejam com a acentuação correta.

11. Antes de finalizar, revise o tom de todo o texto: linguagem direta, profissional, em voz ativa, sem adjetivos vagos nem jargão vazio. Revise também se nenhuma experiência, empresa, resultado, curso ou link foi inventado ou exagerado além do que está no currículo original — em caso de dúvida, descreva de forma mais conservadora em vez de embelezar.

12. Para cada experiência profissional, identifique as tecnologias, ferramentas, linguagens, frameworks, bibliotecas ou plataformas mencionadas EXPLICITAMENTE no currículo original para aquela experiência (ex: linguagens de programação, frameworks, bancos de dados, metodologias como Scrum/Kanban, ferramentas como Git, Figma, GA4, etc.) e preencha o campo "stack" dessa experiência com uma lista dessas tecnologias, na mesma ordem em que aparecem no currículo original. NÃO invente tecnologias que não estejam mencionadas naquela experiência específica. Se nenhuma tecnologia for mencionada, retorne uma lista vazia em "stack".

13. Se o currículo original mencionar trabalho voluntário ou voluntariado:
   13.1. Verifique, entre as experiências profissionais do candidato, quantas NÃO são estágio (ou seja, desconsidere estágios nessa contagem).
   13.2. Se o candidato tiver SOMENTE estágio(s) como experiência profissional (nenhuma experiência que não seja estágio) E o voluntariado tiver relação direta com a vaga descrita (mesma área de atuação, habilidades ou responsabilidades), inclua o voluntariado como PRIMEIRO item do campo "experiencias" (usando os mesmos campos: cargo, empresa, periodo, bullets no método STAR e stack), para que apareça logo após o resumo profissional, evidenciando as habilidades práticas demonstradas.
   13.3. Em qualquer outro caso — o voluntariado NÃO tiver relação direta com a vaga, OU o candidato tiver mais de uma experiência profissional que não seja estágio, OU tiver qualquer experiência profissional remunerada que não seja estágio — inclua o voluntariado no campo "atividadesComplementares" em vez de "experiencias".
   Não invente trabalho voluntário que não esteja mencionado no currículo original.

14. TRADUZIR_PARA_INGLES = ${traduzirIngles ? "true" : "false"}.
   Se TRADUZIR_PARA_INGLES for true, escreva TODO o conteúdo textual do currículo adaptado (resumo profissional, cargos, bullets de experiência, descrições de projetos, formação, cursos, atividades complementares e habilidades) em inglês, seguindo as convenções de currículo internacional: verbos de ação no passado simples em inglês no início de cada bullet, formato de data MM/YYYY. NÃO traduza nomes próprios (nome do candidato, nomes de empresas, instituições de ensino e nomes de projetos), a menos que exista uma tradução oficialmente usada pela própria instituição/empresa. Preencha o campo "idioma" como "en".
   Se TRADUZIR_PARA_INGLES for false, mantenha todo o conteúdo em português conforme as demais regras e preencha o campo "idioma" como "pt".

PARTE 2 - Avaliar a aderência do currículo à vaga, ANTES e DEPOIS da adaptação:
1. Calcule "percentualAntes": de 0 a 100, o quanto o currículo ORIGINAL (antes da parte 1) atende aos requisitos e palavras-chave da vaga.
2. Calcule "percentualDepois": de 0 a 100, o quanto o currículo ADAPTADO (resultado da parte 1) atende aos requisitos e palavras-chave da vaga. Este número deve ser maior ou igual ao percentualAntes, já que o currículo adaptado incorpora as palavras-chave da vaga.
3. Liste as palavras-chave/competências da vaga que o currículo ADAPTADO já cobre, escritas com acentuação e pontuação corretas em português (independentemente do idioma escolhido para o currículo adaptado, esta lista permanece em português, pois é de uso interno do sistema).
4. Liste as palavras-chave/competências da vaga que ainda não aparecem no currículo ADAPTADO (lacunas reais), também escritas com acentuação e pontuação corretas em português.
${montarBlocoPerguntasRespostas(perguntasRespostas)}

Responda APENAS com um JSON válido, sem markdown e sem texto fora do JSON, no seguinte formato exato:
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
    "idioma": "pt ou en, conforme a regra 14"
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

Analise o currículo e a descrição da vaga abaixo. Para cada bullet de experiência profissional que descreve um resultado, mas NÃO traz um número, percentual, prazo ou quantidade que comprove esse resultado, crie uma pergunta objetiva e curta em português para o candidato informar esse dado.

Regras:
1. Crie no máximo 1 pergunta por bullet que precise de um dado quantitativo.
2. Não crie perguntas para bullets que já têm um número, percentual ou quantidade.
3. Não invente perguntas sobre informações que não têm relação com resultados quantificáveis.
4. Se nenhum bullet precisar de dado quantitativo, retorne uma lista vazia.
5. Escreva as perguntas em português correto, com acentuação.

Responda APENAS com um JSON válido, sem markdown e sem texto fora do JSON, no seguinte formato exato:
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