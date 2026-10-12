# Changelog

## [1.2.0] — 2026-10-11

### Adicionado
- **Exportar rubricas em JSON**: todas (tela inicial), ou uma (botão **⬇ JSON** no card e **⬇ Exportar** dentro da rubrica). O arquivo não leva dados de alunos (aluno, turma, data).
- **Importar rubricas de JSON** (um ou vários arquivos), sempre como cópias novas. Aceita o arquivo exportado pelo app, uma lista ou uma rubrica avulsa. Validação campo a campo, limites de tamanho e relatório do que foi importado ou ignorado.
- `docs/FORMATO_JSON.md`; `exemplos/` agora no formato do app e prontos para importar.

### Alterado
- `dbSave()` informa se conseguiu gravar; a importação não aceita rubricas quando o armazenamento está cheio ou bloqueado.
- Botões do topo da rubrica não saem mais na impressão.

## [1.1.0] — 2026-10-11

### Adicionado
- **Geração de rubrica com IA a partir da atividade**: cole as instruções como foram passadas aos alunos e/ou anexe **PDF, imagens ou texto** (enunciados, formulários e modelos a preencher). A IA mostra um resumo do que entendeu e propõe critérios e descritores.
- Campo de **orientações para a rubrica**, número de critérios e modo de pontuação enviados como parâmetros.
- Aviso de soma de pontos e de pesos no editor da IA.
- Função de servidor `functions/api/gerar.js` (Cloudflare Pages Function) com **OpenAI** (Responses API) e **Anthropic**, escolha por `PROVEDOR` ou pela chave cadastrada, saída estruturada e validação de anexos.
- Código de acesso opcional (`ACESSO`) para proteger o uso da chave.
- Documentação: `docs/CONFIGURAR_IA.md` e `CHANGELOG.md`.

### Alterado
- A chave da API **sai do navegador**: fica só no servidor. Chaves antigas guardadas no `localStorage` são apagadas.
- Service Worker passa a buscar a página **na rede primeiro** (cache só como reserva offline); respostas de erro e `/api/*` não são guardadas.
- Selo dos cards da home mostra o número de critérios (antes mostrava sempre "Nota: —").
- Deploy apenas pelo **Cloudflare Pages**; README e docs de arquitetura, fórmulas e templates atualizados para o código atual.

### Corrigido
- "Failed to fetch" ao gerar rubrica (a chamada direta do navegador à API da Anthropic não funcionava).
- **XSS**: títulos, critérios e descritores agora são escapados na home, na aba Aplicar, no preview e nos templates.

### Removido
- `worker.js` (proxy que não era usado) e o workflow de GitHub Pages.

## [1.0.1] — 2026-10-07

- Primeira geração de rubrica com IA (Anthropic), chamada direto do navegador com a chave do próprio usuário, e um `worker.js` de proxy que não chegou a ser usado.

## [1.0.0] — 2026-08-20

- Primeira versão: criação, edição, aplicação e impressão de rubricas; 4 templates TEDPRO/TGE; modos pontos absolutos e pesos %; PWA offline.
