// Cloudflare Pages Function — POST /api/gerar
// Proxy seguro para a API da Anthropic: a chave fica só no servidor.
//
// Variáveis de ambiente (Pages > Settings > Variables and Secrets):
//   ANTHROPIC_KEY  (obrigatória, secreta)  chave sk-ant-...
//   ACESSO         (opcional, secreta)     código que o professor digita no app;
//                                          se definida, sem ela a geração é recusada
//   MODELO         (opcional)              padrão: claude-sonnet-5-5

const MODELO_PADRAO = 'claude-sonnet-5-5';
const MAX_TOKENS = 8192;
const MAX_ARQUIVOS = 5;
const MAX_BYTES_TOTAL = 20 * 1024 * 1024;   // ~20 MB em base64 (limite da API: 32 MB)
const MAX_TEXTO = 60000;                     // caracteres de instruções/observações
const TIPOS_ARQUIVO = {
  'application/pdf': 'document',
  'image/png': 'image', 'image/jpeg': 'image', 'image/webp': 'image', 'image/gif': 'image',
  'text/plain': 'text', 'text/markdown': 'text',
};

const SISTEMA = `Você é especialista em avaliação educacional do IFSC (Instituto Federal de Santa Catarina), com experiência em cursos de pós-graduação a distância como TEDPRO e TGE. Sua tarefa é LER e ANALISAR as instruções de uma atividade entregues aos alunos (texto e/ou arquivos anexos: enunciados, modelos, formulários a preencher) e propor uma rubrica de avaliação alinhada exatamente ao que foi pedido aos alunos.

Princípios:
- Os critérios devem derivar das entregas, etapas, formulários e requisitos que aparecem nas instruções. Não invente exigências que não estão lá.
- Se houver formulário ou modelo a ser preenchido, avalie o preenchimento das partes relevantes.
- Se as instruções já trazem critérios ou pontuações, respeite-os.
- Descritores claros, observáveis, no estilo acadêmico brasileiro, humanizados (não robóticos), em linguagem de avaliação formativa: o que o aluno fez ou deixou de fazer.
- Cada critério tem de 2 a 4 níveis, em ordem crescente de pontos. O menor nível vale 0 e descreve a não realização ou entrega insatisfatória.
- Use SEMPRE a ferramenta registrar_rubrica para responder.`;

const FERRAMENTA = {
  name: 'registrar_rubrica',
  description: 'Registra a rubrica de avaliação proposta para a atividade.',
  input_schema: {
    type: 'object',
    properties: {
      analise: { type: 'string', description: 'Resumo em 2 a 4 frases do que a atividade pede (entregas, formato, formulários), para o professor conferir que a leitura foi correta.' },
      titulo: { type: 'string' },
      disciplina: { type: 'string', description: 'Disciplina ou UC, se identificável; senão vazio.' },
      atividade: { type: 'string', description: 'Nome curto da atividade.' },
      criterios: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            nome: { type: 'string' },
            peso: { type: 'number', description: 'Peso percentual do critério; a soma de todos deve ser 100.' },
            niveis: {
              type: 'array',
              items: {
                type: 'object',
                properties: { pts: { type: 'number' }, desc: { type: 'string' } },
                required: ['pts', 'desc'],
              },
            },
          },
          required: ['nome', 'peso', 'niveis'],
        },
      },
    },
    required: ['analise', 'titulo', 'atividade', 'criterios'],
  },
};

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}

function iguais(a, b) {
  // comparação em tempo constante para o código de acesso
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}

function decodificarTexto(base64) {
  const bin = atob(base64);
  const bytes = Uint8Array.from(bin, c => c.charCodeAt(0));
  return new TextDecoder('utf-8').decode(bytes);
}

function montarPrompt({ instrucoes, observacoes, numCrit, modo, nomesArquivos }) {
  const regraPontos = modo === 'pct'
    ? '- Modo PESOS PERCENTUAIS: a soma dos pesos dos critérios deve ser exatamente 100. Os pontos de cada critério podem usar a escala que fizer sentido (ex.: 0, 1, 2, 3).'
    : '- Modo PONTOS ABSOLUTOS: a soma dos pontos MÁXIMOS de todos os critérios deve ser exatamente 10. Distribua conforme a importância. Informe também o peso percentual equivalente de cada critério (soma 100).';
  return [
    instrucoes ? `INSTRUÇÕES DA ATIVIDADE (como foram passadas aos alunos):\n${instrucoes}` : '',
    nomesArquivos.length ? `ARQUIVOS ANEXOS (leia todos): ${nomesArquivos.join(', ')}` : '',
    observacoes ? `ORIENTAÇÕES DO PROFESSOR PARA A RUBRICA:\n${observacoes}` : '',
    `PARÂMETROS:\n- Crie exatamente ${numCrit} critérios.\n${regraPontos}`,
  ].filter(Boolean).join('\n\n');
}

export async function onRequestPost({ request, env }) {
  // 1. Só aceita chamadas do próprio site
  const origem = request.headers.get('Origin');
  if (origem && origem !== new URL(request.url).origin) {
    return json({ erro: 'Origem não autorizada.' }, 403);
  }

  if (!env.ANTHROPIC_KEY) {
    return json({ erro: 'Servidor sem chave configurada. Defina ANTHROPIC_KEY nas variáveis do projeto no Cloudflare Pages.' }, 500);
  }

  // 2. Código de acesso (opcional)
  if (env.ACESSO && !iguais(request.headers.get('X-Codigo-Acesso') || '', env.ACESSO)) {
    return json({ erro: 'Código de acesso inválido ou ausente.', codigo: 'acesso' }, 401);
  }

  // 3. Tamanho do corpo
  const tam = Number(request.headers.get('Content-Length') || 0);
  if (tam > MAX_BYTES_TOTAL + 2 * MAX_TEXTO + 10000) {
    return json({ erro: 'Arquivos grandes demais (máximo ~15 MB no total).' }, 413);
  }

  let entrada;
  try { entrada = await request.json(); }
  catch { return json({ erro: 'Requisição inválida.' }, 400); }

  const instrucoes = String(entrada.instrucoes || '').slice(0, MAX_TEXTO).trim();
  const observacoes = String(entrada.observacoes || '').slice(0, MAX_TEXTO).trim();
  const numCrit = Math.min(15, Math.max(1, parseInt(entrada.numCrit, 10) || 5));
  const modo = entrada.modo === 'pct' ? 'pct' : 'abs';
  const arquivos = Array.isArray(entrada.arquivos) ? entrada.arquivos : [];

  if (arquivos.length > MAX_ARQUIVOS) return json({ erro: `Envie no máximo ${MAX_ARQUIVOS} arquivos.` }, 400);
  if (!instrucoes && !arquivos.length) return json({ erro: 'Informe as instruções da atividade ou anexe um arquivo.' }, 400);

  // 4. Monta os blocos de conteúdo
  const blocos = [];
  const nomes = [];
  let total = 0;
  for (const a of arquivos) {
    const nome = String(a.nome || 'arquivo').slice(0, 200);
    const tipoBloco = TIPOS_ARQUIVO[a.tipo];
    const dados = String(a.dados || '');
    if (!tipoBloco) return json({ erro: `Tipo de arquivo não suportado: ${nome}. Use PDF, imagem (PNG/JPG/WebP) ou texto.` }, 400);
    if (!/^[A-Za-z0-9+/]+=*$/.test(dados)) return json({ erro: `Arquivo corrompido: ${nome}.` }, 400);
    total += dados.length;
    if (total > MAX_BYTES_TOTAL) return json({ erro: 'Arquivos grandes demais (máximo ~15 MB no total).' }, 413);
    nomes.push(nome);
    if (tipoBloco === 'text') {
      blocos.push({ type: 'text', text: `--- Arquivo: ${nome} ---\n${decodificarTexto(dados).slice(0, MAX_TEXTO)}` });
    } else {
      blocos.push({ type: tipoBloco, source: { type: 'base64', media_type: a.tipo, data: dados } });
      if (tipoBloco === 'document') blocos[blocos.length - 1].title = nome;
    }
  }
  blocos.push({ type: 'text', text: montarPrompt({ instrucoes, observacoes, numCrit, modo, nomesArquivos: nomes }) });

  // 5. Chama a Anthropic
  let resp;
  try {
    resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': env.ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: env.MODELO || MODELO_PADRAO,
        max_tokens: MAX_TOKENS,
        system: SISTEMA,
        tools: [FERRAMENTA],
        tool_choice: { type: 'tool', name: FERRAMENTA.name },
        messages: [{ role: 'user', content: blocos }],
      }),
    });
  } catch (e) {
    return json({ erro: 'Não foi possível contactar a Anthropic. Tente novamente.' }, 502);
  }

  const dados = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    const msg = dados?.error?.message || `HTTP ${resp.status}`;
    // não repassa detalhes de autenticação da chave ao público
    if (resp.status === 401 || resp.status === 403) return json({ erro: 'A chave da Anthropic configurada no servidor foi recusada.' }, 502);
    return json({ erro: `Erro da API Anthropic: ${msg}` }, resp.status === 429 ? 429 : 502);
  }

  const uso = (dados.content || []).find(b => b.type === 'tool_use' && b.name === FERRAMENTA.name);
  if (!uso || !Array.isArray(uso.input?.criterios)) {
    const motivo = dados.stop_reason === 'max_tokens' ? ' (resposta cortada por tamanho; reduza o número de critérios)' : '';
    return json({ erro: 'A IA não devolveu uma rubrica válida' + motivo + '. Tente novamente.' }, 502);
  }
  return json({ rubrica: uso.input });
}
