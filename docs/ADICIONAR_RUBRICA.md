# Como adicionar novos templates de rubrica

Templates são rubricas prontas que aparecem em **📋 Usar template**. Eles ficam no array `const TEMPLATES = [...]` no início do `<script>` de `index.html`.

> Para criar uma rubrica sem mexer em código, use **✨ Gerar com IA**, **＋ Nova em branco** ou o próprio editor do app. Template só vale a pena para rubricas que o grupo vai reutilizar sempre.

---

## Estrutura de um template

```javascript
{
  id: 't5',                          // único entre os templates
  titulo: 'Nome completo da rubrica',
  disciplina: 'Código ou nome da UC',
  atividade: 'Atividade avaliada',
  modo: 'abs',                       // 'abs' (pontos) ou 'pct' (pesos %)

  criterios: [
    {
      id: 'c1',                      // único dentro da rubrica
      nome: 'Nome do critério',
      peso: 30,                      // % do critério (soma 100 entre todos)
      niveis: [                      // do menor para o maior
        { pts: 0, desc: 'Não realizado…' },
        { pts: 2, desc: 'Parcialmente…' },
        { pts: 3, desc: 'Plenamente…' }
      ]
    }
    // ... mais critérios
  ]
}
```

---

## Regras

1. **Sempre inclua um nível com `pts: 0`** (não realizado) em cada critério.
2. **A soma dos pontos máximos de todos os critérios deve ser 10.** O app normaliza para 0–10 de qualquer jeito, mas somas redondas são mais fáceis de interpretar.
3. **A soma dos `peso` deve ser 100.** O modo `pct` usa o peso de cada critério; no modo `abs` ele é ignorado.
4. **Descrição vazia esconde o nível** na aba Aplicar. Use isso só quando o critério realmente tiver menos opções.
5. **Cada critério pode ter um número diferente de níveis** (por exemplo, um critério binário com 0 e 0,5).
6. **Não repita a mesma pontuação** em dois níveis do mesmo critério: a seleção é guardada por pontos e os dois ficariam marcados.
7. **Peso proporcional aos pontos** é o mais simples: os dois modos dão a mesma nota. Pesos diferentes só fazem diferença no modo `pct`.

---

## Exemplo: rubrica simples

```javascript
{
  id: 't5',
  titulo: 'Seminário EaD',
  disciplina: 'TEDPRO',
  atividade: 'Apresentação de seminário',
  modo: 'abs',
  criterios: [
    { id: 'c1', nome: 'Qualidade do conteúdo', peso: 30, niveis: [
      { pts: 0, desc: 'Não apresentou ou o conteúdo é inadequado.' },
      { pts: 1, desc: 'Conteúdo superficial, com lacunas importantes.' },
      { pts: 2, desc: 'Conteúdo adequado, com pequenas lacunas.' },
      { pts: 3, desc: 'Conteúdo completo, preciso e bem fundamentado.' }
    ]},
    { id: 'c2', nome: 'Clareza da apresentação', peso: 40, niveis: [
      { pts: 0, desc: 'Não apresentou.' },
      { pts: 2, desc: 'Apresentação confusa, difícil de acompanhar.' },
      { pts: 3, desc: 'Apresentação clara na maior parte.' },
      { pts: 4, desc: 'Muito clara, organizada e fluente.' }
    ]},
    { id: 'c3', nome: 'Uso de recursos visuais', peso: 30, niveis: [
      { pts: 0, desc: 'Sem recursos visuais.' },
      { pts: 1, desc: 'Recursos inadequados ou de baixa qualidade.' },
      { pts: 2, desc: 'Recursos adequados.' },
      { pts: 3, desc: 'Recursos excelentes, didáticos e bem elaborados.' }
    ]}
  ]
}
// Pontos máximos: 3 + 4 + 3 = 10 · Pesos: 30 + 40 + 30 = 100 ✓
```

## Exemplo: critério binário

```javascript
{ id: 'c4', nome: 'Prazo respeitado', peso: 5, niveis: [
  { pts: 0,   desc: 'Entrega fora do prazo.' },
  { pts: 0.5, desc: 'Entrega dentro do prazo.' }
]}
```

---

## Verificação depois de adicionar

1. Abra o app e escolha o novo template em **📋 Usar template**.
2. Na aba **▶ Aplicar**, marque **todos** os critérios no nível máximo: a nota deve ser **10,00**.
3. Clique em **↺ Limpar** e marque todos no nível 0: a nota deve ser **0,00**.
4. Troque para **⚖️ Pesos %** e repita os passos 2 e 3. Os resultados devem ser os mesmos.

Se divergir, confira:

- cada critério tem um nível com `pts: 0`;
- a soma dos pontos máximos é 10 e a soma dos pesos é 100;
- nenhum nível com pontos altos ficou sem descrição (ele é escondido, mas continua contando no máximo).

O script `scripts/validar_rubricas.py` confere a matemática (10,00 e 0,00 nos dois modos) para as rubricas que estão nele. Ele tem uma cópia própria dos dados, então, ao criar um template novo, acrescente-o ao script também.

---

## Formato JSON de referência

Para criar rubricas sem editar o código, use o arquivo `.json` do app: os arquivos de `exemplos/` podem ser importados com **⬆ Importar**, e **⬇ Exportar** gera arquivos no mesmo formato. Detalhes em [FORMATO_JSON.md](FORMATO_JSON.md).
