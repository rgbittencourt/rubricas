# Arquitetura do Gerador de Rubricas

## Visão geral

O app é uma **Single Page Application (SPA)** escrita em HTML + CSS + JavaScript puro,  
sem frameworks, sem bundler, sem dependências externas. Um único arquivo `index.html`  
contém toda a lógica da aplicação.

```
┌─────────────────────────────────────────────────────────────────┐
│                        index.html                               │
│                                                                 │
│  ┌──────────┐  ┌──────────────┐  ┌──────────────────────────┐  │
│  │  Estilos │  │   Estrutura  │  │      JavaScript          │  │
│  │  (CSS)   │  │   (HTML)     │  │      (lógica)            │  │
│  │          │  │              │  │                          │  │
│  │ variáveis│  │ view-home    │  │ TPLS[] templates         │  │
│  │ layout   │  │ view-rubrica │  │ R{}   rubrica ativa      │  │
│  │ mobile   │  │ overlay-tpl  │  │ DB[]  rubricas em memória│  │
│  │ print    │  │ overlay-del  │  │ sels{} seleções          │  │
│  └──────────┘  └──────────────┘  │ MODE  'abs'|'pes'        │  │
│                                  └──────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
         ↑                                      ↑
    manifest.json                             sw.js
    (identidade PWA)                  (cache offline)
```

---

## Views (telas)

O app tem duas views principais, alternadas via `display: none/block`:

### `#view-home`
Tela inicial — lista de rubricas salvas (grid de cards).  
Botões: **Usar template** (abre modal) e **+ Nova rubrica**.

### `#view-rubrica`
Tela de uma rubrica aberta. Contém 3 painéis (tabs):

| Tab | Painel | Função |
|---|---|---|
| ▶ Aplicar | `#panel-aplicar` | Clica nos níveis, vê nota em tempo real |
| ✏️ Editar | `#panel-editor` | Muda título, critérios, níveis |
| 👁 Ver | `#panel-preview` | Tabela completa para imprimir |

---

## Estado global

```javascript
let MODE = 'abs';   // modo de pontuação atual: 'abs' ou 'pes'
let sels = {};      // seleções da avaliação atual: { crit_key: niv_key }
let R    = {};      // rubrica ativa (deep copy do objeto em DB[])
let DB   = [];      // array de rubricas em memória (perdido ao recarregar)
```

### Estrutura de uma rubrica em `DB[]`

```javascript
{
  id:          1,                    // inteiro autoincrementado
  titulo:      "P2 — Recurso...",
  disciplina:  "TEDPRO",
  atividade:   "Produção de...",
  turma:       "2024/2",
  data:        "2024-11-15",
  modo:        "abs",                // 'abs' | 'pes'
  criado:      "2024-11-15T10:30:00.000Z",

  nivs: [                            // níveis de desempenho
    { k: "k1", nome: "Não realizado",   pts: 0   },
    { k: "k2", nome: "Insuficiente",    pts: 0.5 },
    { k: "k3", nome: "Em desenvolvimento", pts: 2 },
    { k: "k4", nome: "Satisfatório",    pts: 3   },
  ],

  crits: [                           // critérios de avaliação
    {
      k:      "k5",                  // chave única gerada por nk()
      nome:   "Qualidade do recurso",
      maxPts: 3,                     // pontuação máxima (modo abs)
      peso:   30,                    // peso percentual (modo pes)
    },
    // ...
  ],

  descs: {                           // descritores: "crit_key-niv_key" → texto
    "k5-k1": "Não foi possível avaliar...",
    "k5-k2": "",                     // string vazia = nível oculto nesse critério
    "k5-k3": "Boa qualidade na maior parte...",
    "k5-k4": "Excelente qualidade...",
  }
}
```

---

## Chaves únicas (`k`)

Cada critério e nível recebe uma chave `k` gerada por:

```javascript
let kc = 0;
const nk = () => `k${++kc}`;   // "k1", "k2", "k3", ...
```

As chaves são usadas como identificadores estáveis durante a sessão.  
Os descritores são indexados pelo par `"crit_key-niv_key"`.

---

## Níveis visíveis por critério (`nivsFor`)

Um nível aparece na tela de aplicação de um critério **somente se**:
- Tem descritor não-vazio para aquele critério, **OU**
- Tem `pts === 0` (o nível "Não realizado" é sempre exibido)

```javascript
function nivsFor(c) {
  return [...R.nivs]
    .sort((a, b) => b.pts - a.pts)   // decrescente (melhor primeiro)
    .filter(n => {
      const txt = (R.descs[`${c.k}-${n.k}`] || '').trim();
      return txt !== '' || n.pts === 0;
    });
}
```

Isso permite rubricas com **número diferente de níveis por critério**,  
como na P2 onde "Aplicação" tem só 2 opções (0 e 0.5 pts).

---

## Cálculo de nota

Ver [FORMULAS.md](FORMULAS.md) para a derivação completa.

```javascript
// Modo absoluto
nota = soma(pts_obtidos) / soma(maxPts por critério) * 10

// Modo pesos
nota_crit_i = pts_i / maxPts_i             // proporção 0–1
nota = Σ(nota_crit_i × peso_i) / Σ(peso_i) * 10
```

---

## Conversão entre modos (`syncModeValues`)

Chamada automaticamente ao clicar em "Pontos absolutos" ou "Pesos %":

```javascript
// ABS → PES: peso proporcional ao maxPts
peso_i = (maxPts_i / Σ maxPts) × 100   // soma dos pesos = 100%

// PES → ABS: maxPts proporcional ao peso
maxPts_i = ptMax_global × (peso_i / maxPeso)  // arredondado a 0.5
```

---

## PWA: Service Worker (`sw.js`)

Estratégia **cache-first para assets estáticos**:

1. **Install:** pré-cacheia `index.html`, `manifest.json`, ícones
2. **Fetch:** retorna do cache se disponível; senão vai à rede e cacheia
3. **Activate:** limpa caches de versões anteriores
4. **Update:** quando há nova versão, exibe toast e recarrega ao confirmar

```
Requisição → Cache?
              ├── Sim → retorna imediatamente (rápido, offline funciona)
              └── Não → busca na rede → cacheia → retorna
```

---

## Responsividade

O app usa CSS Grid e Flexbox com breakpoints:

| Viewport | Layout dos cards | Botões de nível |
|---|---|---|
| < 480px | 1 coluna | 2 por linha |
| 480–700px | 2 colunas | 2–3 por linha |
| > 700px | 3+ colunas | todos na mesma linha |

Variáveis `--safe-top` e `--safe-bot` respeitam o notch e a home bar do iOS.

---

## Print / PDF

CSS `@media print` torna apenas `#pz` (preview zone) visível.  
O resultado é uma tabela da rubrica pronta para impressão ou `Ctrl+P → Salvar como PDF`.

```css
@media print {
  body * { visibility: hidden }
  #pz, #pz * { visibility: visible }
  #pz { position: fixed; inset: 0; padding: 20px; background: #fff }
}
```
