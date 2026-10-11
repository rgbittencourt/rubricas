# Arquitetura do Gerador de Rubricas

## Visão geral

O app tem duas partes:

1. **Front-end**: uma *Single Page Application* em HTML + CSS + JavaScript puro, sem frameworks, sem bundler e sem dependências externas. Todo o código fica em `index.html`.
2. **Função de IA**: um arquivo de servidor, `functions/api/gerar.js` (Cloudflare Pages Function), que recebe a atividade, chama a OpenAI ou a Anthropic e devolve a rubrica proposta. É o único lugar onde existe chave de API.

```
 Navegador (PWA)                                   Cloudflare Pages
┌──────────────────────────────┐   POST /api/gerar  ┌─────────────────────────────┐
│ index.html                   │ ─────────────────▶ │ functions/api/gerar.js      │
│  • rubricas (localStorage)   │                    │  • valida origem e código   │
│  • aplicar / editar / imprimir│ ◀───────────────── │  • valida e converte anexos │
│  • tela "Gerar com IA"       │   { rubrica }      │  • chama OpenAI ou Anthropic│
└──────────────────────────────┘                    └──────────────┬──────────────┘
        ↑                  ↑                                       │ chave (segredo)
   manifest.json         sw.js                                     ▼
   (identidade PWA)   (cache offline)                    api.openai.com / api.anthropic.com
```

As rubricas ficam **somente no navegador** do professor (`localStorage`). O servidor não guarda nada: ele só repassa a atividade ao provedor de IA e devolve a resposta.

---

## Telas

As telas se alternam com a classe `d-none`:

| Elemento | Função |
|---|---|
| `#tela-home` | Lista de rubricas salvas (cards). Botões: **Gerar com IA**, **Usar template**, **Nova em branco** |
| `#tela-ia` | Instruções da atividade, anexos, orientações, número de critérios e modo. Mostra o resultado para revisão antes de salvar |
| `#tela-rubrica` | Rubrica aberta, com 3 abas |

Abas de `#tela-rubrica`:

| Aba | Painel | Função |
|---|---|---|
| ▶ Aplicar | `#painel-aplicar` | Identificação do aluno, clique nos níveis e nota em tempo real |
| ✏️ Editar | `#painel-editar` | Critérios, pesos, níveis e descritores |
| 👁 Pré-visualizar | `#painel-preview` | Tabela completa; botão **Imprimir / PDF** |

Modais: `#modal-template` (escolher template) e `#modal-del` (confirmar exclusão).

---

## Estado global (`index.html`)

```javascript
let DB = [];            // rubricas salvas (espelhadas no localStorage)
let nextId = 1;         // próximo id numérico de rubrica
let rubrActual = null;  // id da rubrica aberta
let modoAtual = 'abs';  // 'abs' (pontos absolutos) ou 'pct' (pesos %)
let selecoes = {};      // seleções da avaliação atual: { idDoCriterio: pontos }
let iaCriterios = [];   // critérios da rubrica gerada pela IA, em edição
let anexos = [];        // arquivos anexados na tela de IA (base64)
```

### Estrutura de uma rubrica

```javascript
{
  id: 1,
  titulo: 'P2 – Recurso Educacional',
  disciplina: 'TEDPRO',
  atividade: 'P2 – Recurso Educacional Digital',
  turma: '', aluno: '', data: '',     // preenchidos na aba Aplicar
  modo: 'abs',                         // 'abs' | 'pct'
  criterios: [
    {
      id: 'c1',
      nome: 'Qualidade do recurso',
      peso: 30,                        // % (usado no modo 'pct')
      niveis: [
        { pts: 0, desc: 'Não foi possível avaliar…' },
        { pts: 2, desc: 'Boa qualidade, mas precisa de melhorias.' },
        { pts: 3, desc: 'Excelente qualidade.' }
      ]
    }
  ]
}
```

Os templates (`TEMPLATES`) usam exatamente esta estrutura. Ver [ADICIONAR_RUBRICA.md](ADICIONAR_RUBRICA.md).

### Persistência

| Chave do `localStorage` | Conteúdo |
|---|---|
| `inovalab-rubricas-v5` | `{ db: [...rubricas], nextId }` |
| `inovalab-rubricas-acesso` | Código de acesso à IA digitado pelo professor |

Toda leitura e escrita é protegida com `try/catch`: se o navegador bloquear o armazenamento, o app continua funcionando sem salvar.

> Versões antigas guardavam a chave da Anthropic em `anthropic-api-key`. O app apaga essa entrada ao carregar.

---

## Níveis exibidos na aba Aplicar

Só aparecem os níveis com descrição não vazia. Se um critério não usa todos os níveis, deixe a descrição em branco ou remova o nível no editor.

A seleção é guardada pelo **valor em pontos** (`selecoes[idDoCriterio] = pts`).

---

## Cálculo de nota

Ver [FORMULAS.md](FORMULAS.md). A função `calcNota(r, sel)` retorna `null` até que **todos** os critérios tenham seleção; depois retorna um valor entre 0 e 10.

---

## Segurança no front-end

- Todo texto de rubrica vindo do usuário, de templates ou da IA é escapado com `esc()` antes de entrar em `innerHTML`.
- Nenhuma chave de API existe no navegador.

---

## Geração com IA

Fluxo (`gerarComIA()` em `index.html`):

1. Lê instruções, orientações, número de critérios, modo e anexos (convertidos em base64 com `FileReader`).
2. Envia `POST /api/gerar` com o código de acesso no cabeçalho `X-Codigo-Acesso` (se houver).
3. Recebe `{ rubrica }`, atribui ids, ordena os níveis por pontos e abre o editor para revisão.
4. **Salvar esta rubrica** grava no `DB`.

Função `functions/api/gerar.js`:

1. Aceita só requisições da própria origem (`Origin`).
2. Escolhe o provedor (`PROVEDOR`, ou a chave cadastrada) e confere a chave.
3. Confere o código de acesso (`ACESSO`), se definido.
4. Valida os anexos (tipos, tamanho, base64) e os converte para o formato de cada API.
5. Pede a rubrica em **saída estruturada** (JSON Schema estrito): `json_schema` na OpenAI, ferramenta forçada na Anthropic.
6. Devolve `{ rubrica }` ou `{ erro }`. Erros de autenticação da chave não são repassados ao público.

Limites: 5 arquivos, ~15 MB no total, 60 mil caracteres de texto. Tipos aceitos: PDF, PNG, JPG, WebP, GIF, `.txt`, `.md`.

Configuração e solução de problemas: [CONFIGURAR_IA.md](CONFIGURAR_IA.md).

---

## PWA: Service Worker (`sw.js`)

| Requisição | Estratégia |
|---|---|
| Página (`/`, `*.html`, navegação) | **Rede primeiro**, cache como reserva offline. Atualizações chegam sem trocar a versão |
| Arquivos estáticos (ícones, manifest) | Cache primeiro, atualizado em segundo plano |
| `/api/*` e outras origens | Nunca passam pelo cache |

Só respostas bem-sucedidas da mesma origem são guardadas. Ao mudar a lista `ASSETS`, incremente `CACHE` (`rubricas-inovalab-vN`) para limpar caches antigos.

---

## Deploy

Cloudflare Pages conectado a este repositório (ramificação `main`, implantação automática). Arquivos relevantes:

| Arquivo | Função |
|---|---|
| `functions/api/gerar.js` | Função de IA (publicada em `/api/gerar`) |
| `_headers` | Cabeçalhos de segurança e cache |
| `_redirects` | Sem regras (o app tem uma única página) |

Variáveis de ambiente (segredos) ficam no painel do Cloudflare, nunca no repositório.

---

## Responsividade e impressão

CSS Grid e Flexbox com ajustes para telas estreitas (`@media (max-width: 480px)`). Em `@media print`, só `#painel-preview` fica visível; use **Imprimir / PDF** ou `Ctrl+P → Salvar como PDF`.

---

## Limitações conhecidas

- As avaliações dos alunos **não são guardadas**: as seleções ficam em memória e só o **Imprimir / PDF** registra o resultado. Aluno, turma e data são gravados na própria rubrica, então avaliar outro aluno sobrescreve esses campos.
- Dois níveis com a mesma pontuação no mesmo critério ficam ambos marcados, porque a seleção é por pontos.
- Níveis sem descrição são escondidos na aba Aplicar, mas continuam contando no máximo do critério.
- Trocar o modo (abs/pct) limpa as seleções e **não** converte pontos em pesos: o peso é o campo "Peso %" de cada critério.
- Os arquivos de `exemplos/` são referência de estrutura; o app ainda não importa JSON.
- A geração com IA só funciona no Cloudflare Pages (precisa da função de servidor).
