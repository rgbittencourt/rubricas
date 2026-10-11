# 📐 Gerador de Rubricas · INOVALAB

**PWA para criação, simulação e aplicação de rubricas de avaliação**  
Instituto Federal de Santa Catarina — Campus Continente  
INOVALAB · Laboratório de Inovação e Mídias Digitais

[![Cloudflare Pages](https://img.shields.io/badge/demo-live-brightgreen?logo=cloudflare)](https://rubricas-inovalab.pages.dev)
[![PWA](https://img.shields.io/badge/PWA-instalável-5A0FC8?logo=pwa)](https://rubricas-inovalab.pages.dev)
[![Licença](https://img.shields.io/badge/licença-MIT-blue)](LICENSE)
[![Feito com](https://img.shields.io/badge/feito%20com-HTML%20%2B%20JS%20puro-orange)](index.html)

---

## ✨ O que é

O **Gerador de Rubricas** é uma Progressive Web App (PWA) que permite a professores e coordenadores de curso:

- **Gerar rubricas com IA** a partir das instruções da atividade (texto colado e/ou PDFs, formulários e imagens anexados)
- **Criar rubricas** do zero ou a partir de templates prontos
- **Simular notas** clicando nos níveis de desempenho — nota calculada em tempo real (0 a 10)
- **Dois modos de pontuação** intercambiáveis com conversão automática:
  - **Pontos absolutos** — soma direta (ideal para rubricas com escala própria)
  - **Pesos percentuais** — ponderação por critério (ideal para critérios de importância variável)
- **Garantia matemática**: máximo sempre = 10,00 · mínimo sempre = 0,00
- **Instalar como app** no Android, iOS e desktop (sem loja de aplicativos)
- **Funcionar offline** após a primeira visita

---

## 🎓 Templates incluídos (TEDPRO / TGE — IFSC)

| Template | UC | Total máx | Critérios |
|---|---|---|---|
| P2 — Recurso Educacional | TEDPRO | 10 pts | 5 |
| P4 — Portfólio / Relato Final | TEDPRO | 10 pts | 6 |
| AF — Plano de Aula Híbrida | PEH / CAP / PTE / TGE | 10 pts | 6 |
| AF — Análise de Ferramenta Digital | TEDPRO / TGE | 10 pts | 7 |

Todos os templates foram validados matematicamente: marcar todos os maiores níveis → **10,00** exato; marcar todos em "Não realizado" → **0,00** exato, nos dois modos.

---

## 🚀 Como usar agora (sem instalar nada)

**Opção 1 — Direto no navegador:**
```
https://rubricas-inovalab.pages.dev
```

**Opção 2 — Arquivo local:**
1. Baixe o repositório (botão verde **Code → Download ZIP**)
2. Extraia e abra `index.html` no Chrome ou Edge
3. Para funcionalidade PWA completa (offline + instalação), sirva via servidor local (ver abaixo)

---

## 📲 Instalação como PWA

### Android (Chrome)
1. Acesse a URL do GitHub Pages no Chrome
2. Toque no menu ⋮ → **"Adicionar à tela inicial"**
3. O app aparece na tela inicial como qualquer outro aplicativo

### iOS (Safari)
1. Acesse a URL no Safari
2. Toque em **Compartilhar** (ícone de caixa com seta)
3. Selecione **"Adicionar à Tela de Início"**

### Desktop (Chrome / Edge)
1. Acesse a URL
2. Clique no ícone de instalação na barra de endereço (ou menu → "Instalar")
3. O app abre em janela própria, sem barra do navegador

> **Nota:** Para instalar como PWA, o app precisa ser servido via HTTPS. O GitHub Pages fornece isso automaticamente.

---

## 🖥️ Rodar localmente (desenvolvimento)

O projeto é **zero dependências** — HTML + CSS + JS puros. Qualquer servidor HTTP funciona.

```bash
# Clone o repositório
git clone https://github.com/rgbittencourt/rubricas.git
cd rubricas

# Opção A — Python (já vem no sistema)
python3 -m http.server 8080
# Acesse: http://localhost:8080

# Opção B — Node.js
npx serve .
# Acesse: http://localhost:3000

# Opção C — PHP
php -S localhost:8080
```

> Abrir `index.html` diretamente (`file://`) funciona para testar o visual,  
> mas o Service Worker (cache offline) requer um servidor HTTP.
>
> A **geração com IA** depende da função `functions/api/gerar.js`, que só roda no Cloudflare Pages.
> Para testá-la localmente: `npx wrangler pages dev .` com um arquivo `.dev.vars` contendo `ANTHROPIC_KEY=sk-ant-...`
> (o `.dev.vars` está no `.gitignore`).

---

## ✨ Geração de rubrica com IA

Na tela **✨ Gerar com IA** o professor:

1. Cola as **instruções da atividade** como foram passadas aos alunos, e/ou
2. Anexa **arquivos** (até 5, 15 MB no total): enunciado em PDF, formulário/modelo a ser preenchido, prints (PNG/JPG/WebP) ou texto (.txt/.md);
3. Opcionalmente escreve **orientações para a rubrica** (ex.: "mais peso para a aplicação");
4. Escolhe o **número de critérios** e o **modo de pontuação**.

A IA lê tudo, mostra um resumo do que entendeu da atividade e propõe critérios e descritores, que podem ser editados antes de salvar.

**Como funciona por trás:** o navegador envia os dados para `/api/gerar` (Cloudflare Pages Function, mesmo domínio do app). A função chama a API da Anthropic com a chave guardada **somente no servidor**; nenhuma chave fica no navegador.

**Configuração (Cloudflare Pages → projeto → Settings → Variables and Secrets):**

| Variável | Obrigatória | Para quê |
|---|---|---|
| `ANTHROPIC_KEY` | sim (secreta) | Chave `sk-ant-...` da Anthropic |
| `ACESSO` | recomendada (secreta) | Código que o professor digita no app na primeira vez. Sem ele, qualquer pessoa com o link poderia gerar rubricas usando a sua chave |
| `MODELO` | não | Modelo da Anthropic. Padrão: `claude-sonnet-5-5` |

Depois de criar/alterar variáveis, faça um novo deploy (ou *Retry deployment*). Vale também definir um limite de gasto mensal no console da Anthropic.

---

## 📂 Estrutura do projeto

```
rubricas/
├── index.html          ← App completo (toda a lógica em um arquivo)
├── manifest.json       ← Manifesto PWA (nome, ícones, cores, orientação)
├── sw.js               ← Service Worker (cache offline, atualização automática)
├── functions/api/gerar.js ← Proxy da IA (Cloudflare Pages Function)
├── _headers / _redirects  ← Configuração do Cloudflare Pages
├── icon.svg            ← Ícone vetorial fonte
├── icon-72.png         ← Ícones PNG para dispositivos (todos os tamanhos)
├── icon-96.png
├── icon-128.png
├── icon-144.png
├── icon-152.png        ← iOS (apple-touch-icon)
├── icon-192.png        ← Android (padrão PWA)
├── icon-384.png
├── icon-512.png        ← Splash screen / maskable
├── docs/
│   ├── ARQUITETURA.md  ← Como o código está organizado
│   ├── FORMULAS.md     ← Matemática das fórmulas de nota
│   └── ADICIONAR_RUBRICA.md ← Como adicionar novos templates
├── exemplos/
│   ├── rubrica-exemplo-simples.json   ← Estrutura de rubrica para importar
│   └── rubrica-exemplo-completa.json  ← Rubrica com todos os campos
└── LICENSE             ← MIT
```

---

## 🔧 Personalização

### Adicionar um novo template de rubrica

Edite `index.html` e localize o array `const TPLS = [...]`. Adicione um objeto com esta estrutura:

```javascript
{
  titulo: 'Nome da Rubrica',
  disciplina: 'Código da UC',
  atividade: 'Tipo de atividade avaliada',
  modo: 'abs',   // 'abs' = pontos absolutos | 'pes' = pesos percentuais
  nivs: [
    { n: 'Não realizado',    p: 0   },
    { n: 'Insuficiente',     p: 1   },
    { n: 'Satisfatório',     p: 2   },
    { n: 'Excelente',        p: 3   },
  ],
  crits: [
    {
      n: 'Nome do critério',
      m: 3,         // maxPts: pontuação máxima para este critério
      d: [          // descritores: um por nível, na mesma ordem que 'nivs'
        'Descritor para Não realizado',
        'Descritor para Insuficiente',
        'Descritor para Satisfatório',
        'Descritor para Excelente',
      ]
    },
    // ... mais critérios
  ]
}
```

> **Regra de ouro:** A soma dos `maxPts` de todos os critérios deve ser um valor conveniente  
> (ex: 10). O app normaliza automaticamente para a escala 0–10.

Ver [docs/ADICIONAR_RUBRICA.md](docs/ADICIONAR_RUBRICA.md) para exemplos detalhados.

---

## 📐 Lógica de cálculo de nota

### Modo Pontos Absolutos

```
nota = (Σ pts_obtidos_i) / (Σ maxPts_i) × 10
```

Cada critério contribui com os pontos obtidos. A soma máxima possível é `Σ maxPts_i`.  
Todos no máximo → nota = 10,00. Todos em zero → nota = 0,00.

### Modo Pesos Percentuais

```
nota_crit_i = pts_i / maxPts_i          (proporção 0–1 dentro do critério)
nota        = Σ(nota_crit_i × peso_i) / Σ(peso_i) × 10
```

Cada critério é normalizado pelo seu próprio máximo, depois ponderado pelo peso.  
Funciona corretamente mesmo quando critérios têm escalas diferentes (ex: 0–3 e 0–0,5).

### Conversão automática entre modos

| De → Para | Fórmula |
|---|---|
| ABS → PES | `peso_i = (maxPts_i / Σ maxPts) × 100` |
| PES → ABS | `maxPts_i = ptMax_global × (peso_i / maxPeso)` arredondado a 0,5 |

Ver [docs/FORMULAS.md](docs/FORMULAS.md) para a derivação completa.

---

## 🌐 Deploy — Cloudflare Pages

Gratuito, com **HTTPS automático**, **PWA instalável** e suporte a `_headers`, `_redirects` e Pages Functions (usadas pela geração com IA).

**1. Crie uma conta em [pages.cloudflare.com](https://pages.cloudflare.com)**

**2. Conecte o repositório GitHub:**
- Clique em **Create a project** → **Connect to Git**
- Selecione o repositório `rubricas`
- Framework preset: **None**
- Build command: *(deixe em branco)*
- Build output directory: `/` (raiz)
- Clique **Save and Deploy**

> Projetos criados por **upload direto** (arrastar arquivos no painel) **não publicam a pasta `functions/`**.
> Use a conexão com o Git (acima) ou `npx wrangler pages deploy . --project-name rubricas-inovalab`.

**3. Configure as variáveis da IA** (tabela na seção *Geração de rubrica com IA*).

**4. O app fica em:**
```
https://rubricas-inovalab.pages.dev
```

**5. Domínio personalizado (opcional):**  
Settings → Custom domains → `rubricas.seudominio.com`

> GitHub Pages e servidores estáticos (seção abaixo) servem o app normalmente, mas **sem** a geração com IA.

---

### Atualizar o app

```bash
git clone https://github.com/rgbittencourt/rubricas.git
cd rubricas
git add .
git commit -m "Atualização"
git push
# deploy automático em ~1 minuto
```

---

## 🏗️ Hospedar em servidor próprio

O app é estático — qualquer servidor web funciona:

```nginx
# Nginx
server {
    listen 443 ssl;
    server_name rubricas.seudominio.ifsc.edu.br;
    root /var/www/rubricas;
    index index.html;

    # PWA precisa de HTTPS para instalar
    # Headers de cache recomendados:
    location /sw.js {
        add_header Cache-Control "no-cache";
    }
    location / {
        add_header Cache-Control "public, max-age=3600";
    }
}
```

```apache
# Apache (.htaccess)
<IfModule mod_headers.c>
    <FilesMatch "sw\.js$">
        Header set Cache-Control "no-cache"
    </FilesMatch>
</IfModule>
```

---

## 🔄 Evoluções previstas

- [x] Persistência com `localStorage` (rubricas salvas entre sessões no mesmo dispositivo)
- [ ] Backend Python + SQLite (salvar no servidor, multiusuário)
- [ ] Exportação de resultado em PDF (via `window.print()` já funciona)
- [ ] Exportação em DOCX (relatório de avaliação)
- [ ] Campo "Nome do aluno" + histórico de avaliações
- [ ] Importação/exportação de rubrica em JSON
- [ ] Modo professor: rubrica protegida, aluno só vê descritores
- [ ] Integração com Moodle via LTI

---

## 🏛️ Sobre o projeto

Desenvolvido no **INOVALAB — Laboratório de Inovação e Mídias Digitais**  
**IFSC — Instituto Federal de Santa Catarina · Campus Continente**  
R. Quatorze de Julho, 150 — Coqueiros — Florianópolis — SC — 88075-010

**Coordenação:** Prof. Rogério Gonçalves Bittencourt  
**Contato:** inovalab.cte@ifsc.edu.br  
*Onde ideias se transformam em realidade.*

---

## 📄 Licença

MIT License — veja [LICENSE](LICENSE)

Você pode usar, copiar, modificar e distribuir livremente,  
inclusive para fins comerciais, desde que mantenha a atribuição.
