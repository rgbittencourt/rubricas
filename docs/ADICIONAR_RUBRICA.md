# Como Adicionar Novos Templates de Rubrica

## Estrutura de um template

No arquivo `index.html`, localize o array `const TPLS = [...]` e adicione um novo objeto:

```javascript
{
  titulo:     'Nome completo da rubrica',
  disciplina: 'Código ou nome da UC',
  atividade:  'Tipo de atividade avaliada',
  modo:       'abs',   // 'abs' ou 'pes' — modo padrão ao abrir

  // Níveis de desempenho (colunas da rubrica)
  // IMPORTANTE: sempre inclua um nível com p: 0 (não realizado)
  nivs: [
    { n: 'Não realizado', p: 0   },
    { n: 'Insuficiente',  p: 1   },
    { n: 'Satisfatório',  p: 2   },
    { n: 'Excelente',     p: 3   },
  ],

  // Critérios de avaliação (linhas da rubrica)
  crits: [
    {
      n: 'Nome do critério',
      m: 3,       // maxPts: pontuação máxima para ESTE critério
      d: [        // descritores: MESMO número que nivs, na mesma ordem
        'Descritor para Não realizado.',
        'Descritor para Insuficiente.',
        'Descritor para Satisfatório.',
        'Descritor para Excelente.',
      ]
    },
  ]
}
```

---

## Regras importantes

### 1. Soma dos maxPts deve dar um valor redondo

Para que a escala fique bonita (nota máxima = 10,00):

```
Σ maxPts_i = 10   → ideal (ex: 4 critérios de 2.5 pts, ou 5 de 2 pts)
Σ maxPts_i = 7    → também funciona (o app normaliza automaticamente)
```

O app sempre normaliza para 0–10 independentemente da soma,  
mas somas "redondas" facilitam a interpretação pelos professores.

### 2. Descritores vazios = nível oculto

Se um critério não usa todos os níveis, deixe o descritor como `''`:

```javascript
{
  n: 'Aplicação / Testagem',
  m: 0.5,
  d: [
    'Aplicação não relatada.',        // Não realizado (0 pts) — sempre aparece
    'Aplicado/testado com o público.', // Insuficiente (0.5 pts)
    '',   // ← vazio: este nível NÃO aparece para este critério
    '',   // ← vazio: este nível NÃO aparece para este critério
  ]
}
```

O nível com `pts: 0` **sempre aparece** mesmo sem descritor (é o "não realizado").  
Os outros só aparecem se tiverem descritor não-vazio.

### 3. Número de descritores = número de níveis

O array `d` deve ter **exatamente** o mesmo número de elementos que `nivs`.

---

## Exemplos práticos

### Rubrica simples (3 critérios, 4 níveis)

```javascript
{
  titulo:     'Seminário EaD',
  disciplina: 'TEDPRO',
  atividade:  'Apresentação de Seminário',
  modo:       'abs',
  nivs: [
    { n: 'Não realizado',      p: 0 },
    { n: 'Em desenvolvimento', p: 1 },
    { n: 'Satisfatório',       p: 2 },
    { n: 'Excelente',          p: 3 },
  ],
  crits: [
    {
      n: 'Qualidade do conteúdo',
      m: 3,
      d: [
        'Não apresentou ou o conteúdo é inadequado.',
        'Conteúdo superficial, com lacunas importantes.',
        'Conteúdo adequado, com pequenas lacunas.',
        'Conteúdo completo, preciso e bem fundamentado.',
      ]
    },
    {
      n: 'Clareza da apresentação',
      m: 4,
      d: [
        'Não apresentou.',
        'Apresentação confusa, difícil de acompanhar.',
        'Apresentação clara na maior parte.',
        'Apresentação muito clara, organizada e fluente.',
      ]
    },
    {
      n: 'Uso de recursos visuais',
      m: 3,
      d: [
        'Sem recursos visuais.',
        'Recursos visuais inadequados ou de baixa qualidade.',
        'Recursos visuais adequados.',
        'Recursos visuais excelentes, didáticos e bem elaborados.',
      ]
    },
  ]
}
// Soma maxPts = 3 + 4 + 3 = 10 → máximo = nota 10 ✓
```

### Rubrica com critérios de 2 níveis (binário)

```javascript
{
  titulo:     'Entrega de Atividade',
  disciplina: 'TGE',
  atividade:  'Checklist de entrega',
  modo:       'abs',
  nivs: [
    { n: 'Não entregue / Inadequado', p: 0 },
    { n: 'Entregue / Adequado',       p: 1 },
  ],
  crits: [
    { n: 'Prazo respeitado',          m: 1, d: ['Entrega fora do prazo.', 'Entrega dentro do prazo.'] },
    { n: 'Formato correto',           m: 1, d: ['Formato incorreto.',     'Formato correto.'] },
    { n: 'Completude do conteúdo',    m: 1, d: ['Incompleto.',            'Completo.'] },
    // ...
  ]
}
```

### Rubrica com modo pesos (critérios de importância variável)

```javascript
{
  titulo:     'Projeto Final',
  disciplina: 'Práticas Profissionais',
  atividade:  'Entrega do Projeto',
  modo:       'pes',   // modo pesos percentuais
  nivs: [
    { n: 'Não realizado', p: 0 },
    { n: 'Insuficiente',  p: 1 },
    { n: 'Bom',           p: 2 },
    { n: 'Excelente',     p: 3 },
  ],
  crits: [
    // peso reflete importância; maxPts é o máximo desta escala de níveis
    { n: 'Funcionalidade',  m: 3, d: ['...', '...', '...', '...'] },
    { n: 'Documentação',    m: 3, d: ['...', '...', '...', '...'] },
    { n: 'Apresentação',    m: 3, d: ['...', '...', '...', '...'] },
  ]
  // Ao abrir no modo 'pes', o app calcula automaticamente:
  // peso Funcionalidade  = 3/9 × 100 = 33.3%
  // peso Documentação    = 3/9 × 100 = 33.3%
  // peso Apresentação    = 3/9 × 100 = 33.4% (absorve arredondamento)
}
```

---

## Verificação: sempre testar após adicionar

Após adicionar um template:

1. Abra o app no navegador
2. Selecione o novo template em **📋 Usar template**
3. Na aba **▶ Aplicar**: marque **todos** os critérios no nível máximo disponível
   - A nota deve mostrar **10,00**
4. Clique em **↺ Limpar** e marque **todos** em "Não realizado"
   - A nota deve mostrar **0,00**
5. Clique no toggle **⚖️ Pesos %** e repita os passos 3 e 4
   - Resultados devem ser os mesmos

Se qualquer resultado divergir, verifique:
- Os `maxPts` de cada critério correspondem ao maior nível COM DESCRITOR para aquele critério
- O número de descritores em `d[]` é igual ao número de níveis em `nivs[]`
