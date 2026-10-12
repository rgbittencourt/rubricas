# Configurar a geração de rubricas com IA

A tela **✨ Gerar com IA** usa a função `functions/api/gerar.js`, que roda no Cloudflare Pages e guarda a chave de API do provedor. Este guia mostra como ligá-la com a **OpenAI** (ou a Anthropic).

> A IA só funciona no endereço do Cloudflare Pages (`https://rubricas-inovalab.pages.dev`). Em GitHub Pages, servidor estático ou `file://`, o restante do app funciona, mas a geração não.

---

## 1. Criar a chave de API

**OpenAI** (https://platform.openai.com/api-keys):

1. Entre com a conta que paga a API. A assinatura do ChatGPT não dá acesso à API.
2. Confira o projeto selecionado (por exemplo, "Gerador-Rubrica") e clique em **Create new secret key**.
3. Dê um nome (ex.: `rubricas-inovalab`), crie e **copie a chave na hora** (`sk-...`). Ela só é mostrada uma vez.
4. Em **Settings → Limits**, defina um limite mensal de gasto.

**Anthropic** (https://console.anthropic.com): crie uma chave `sk-ant-...` em *API keys* e defina um limite de gasto.

---

## 2. Cadastrar as variáveis no Cloudflare

Cloudflare → **Workers e Pages** → projeto **rubricas-inovalab** → **Configurações** → **Variáveis e segredos** (ambiente **Produção**) → **+ Adicionar**.

| Variável | Tipo | Obrigatória | Para quê |
|---|---|---|---|
| `OPENAI_KEY` | Segredo | uma das duas chaves | Chave da OpenAI |
| `ANTHROPIC_KEY` | Segredo | uma das duas chaves | Chave da Anthropic |
| `PROVEDOR` | Texto | não | `openai` ou `anthropic`. Sem ela, usa o provedor cuja chave existir (se houver as duas, Anthropic) |
| `ACESSO` | Segredo | **recomendada** | Código que o professor digita no app. Sem ele, qualquer pessoa com o link gera rubricas na sua conta |
| `MODELO` | Texto | não | Modelo do provedor escolhido. Padrões: `gpt-6.1-sol` (OpenAI) e `claude-sonnet-5-5` (Anthropic) |

Cuidados:

- **Digite os nomes**; não copie e cole. Em algumas fontes a letra `I` maiúscula parece um `L` minúsculo.
- Clique em **Salvar** (barra "Unsaved changes" no rodapé).
- **Variável só vale para implantações feitas depois de salva.** Depois de salvar, faça uma nova implantação (aba **Implantações** → menu ⋯ da última implantação de produção → tentar novamente) ou envie qualquer commit para a `main`.
- Para testar uma pré-visualização de PR, cadastre as variáveis também no ambiente **Visualização** (seletor no canto superior direito da tela).

---

## 3. Testar

1. Abra o app, entre em **Gerar com IA** e clique em **Gerar rubrica**.
2. Se `ACESSO` estiver ativo, o app pede o código na primeira vez. **Se gerar sem pedir, o `ACESSO` não está valendo**; recrie a variável.
3. Cole as instruções da atividade e/ou anexe PDFs, imagens ou texto, e gere.
4. Confira no painel do provedor: a chave passa a mostrar uso e gasto.

---

## Solução de problemas

| Mensagem no app | Causa provável | O que fazer |
|---|---|---|
| "Servidor sem chave configurada. Defina ANTHROPIC_KEY…" | A função não enxerga `OPENAI_KEY`: nome errado, valor vazio ou implantação anterior à variável | Recriar a variável digitando o nome, salvar e fazer nova implantação. Sem nenhuma chave, a função assume a Anthropic, por isso a mensagem cita `ANTHROPIC_KEY` |
| "Código de acesso inválido ou ausente" | Código digitado diferente do `ACESSO` | Digitar de novo (a caixa de código aparece sozinha) |
| "A chave da OpenAI … foi recusada" | Chave errada, revogada ou sem permissão | Criar outra chave e atualizar o segredo |
| "Erro da API OpenAI: … model …" | A conta não tem acesso ao modelo padrão | Definir `MODELO` com um modelo que a conta use |
| "Erro da API … quota/billing" | Sem crédito ou limite atingido | Conferir cobrança e limites no painel do provedor |
| "A IA recusou-se a processar este conteúdo" | Recusa de segurança do modelo | Revisar instruções e arquivos |
| "A resposta da IA foi cortada…" | Rubrica grande demais para a resposta | Reduzir número de critérios ou de arquivos |
| "Arquivos grandes demais" | Mais de ~15 MB no total | Enviar menos arquivos ou PDFs menores |
| "O serviço de IA não está disponível neste endereço" | App aberto fora do Cloudflare Pages | Usar `https://rubricas-inovalab.pages.dev` |

Projetos Cloudflare criados por **upload direto** (arrastando arquivos) não publicam a pasta `functions/`. Conecte o projeto ao repositório do GitHub ou use `npx wrangler pages deploy . --project-name rubricas-inovalab`.

---

## Testar a função localmente

```bash
# .dev.vars (já está no .gitignore)
OPENAI_KEY=sk-...
ACESSO=meu-codigo

npx wrangler pages dev .
# abre em http://localhost:8788
```

---

## Segurança e custos

- A chave existe só no servidor: nunca no navegador nem no repositório.
- A função aceita apenas requisições do próprio site e valida tipo, quantidade e tamanho dos arquivos.
- Cada geração tem custo no provedor. Defina limite de gasto e troque o `ACESSO` quando alguém sair do grupo.
- Se a chave vazar (commit, print, mensagem), revogue-a no painel do provedor e crie outra.
