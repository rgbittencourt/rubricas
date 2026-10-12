# Fórmulas de Cálculo de Nota

## Requisito fundamental

> **Marcar todos os critérios no nível máximo → nota = 10,00**  
> **Marcar todos os critérios em "Não realizado" (0 pts) → nota = 0,00**  
> Válido em **ambos os modos**, para **qualquer rubrica**.

---

## Modo Pontos Absolutos (`abs`)

### Fórmula

```
nota = ( Σᵢ pts_obtidos_i ) / ( Σᵢ maxPts_i ) × 10
```

Onde:
- `pts_obtidos_i` = pontos do nível selecionado no critério `i`
- `maxPts_i` = pontuação máxima possível do critério `i`

### Por que funciona

- **Todos no máximo:** `pts_obtidos_i = maxPts_i` para todo `i`  
  → numerador = denominador → **nota = 10,00** ✓

- **Todos em zero:** `pts_obtidos_i = 0` para todo `i`  
  → numerador = 0 → **nota = 0,00** ✓

### Exemplo — P2 Recurso Educacional

| Critério | maxPts | pts obtidos | Contribuição |
|---|---|---|---|
| Qualidade | 3 | 3 | 3 |
| Aderência | 3 | 2 | 2 |
| Relato | 3 | 3 | 3 |
| Aplicação | 0.5 | 0.5 | 0.5 |
| Opinião | 0.5 | 0 | 0 |
| **Total** | **10** | **8.5** | |

```
nota = 8.5 / 10 × 10 = 8,50
```

---

## Modo Pesos Percentuais (`pct`)

### Por que não usar uma fórmula global simples

Se usarmos `nota = Σ(pts_i × peso_i/100) / ptMax_global × 10`,  
o resultado **não garante nota 10 quando todos estão no máximo**  
quando os critérios têm escalas diferentes.

**Exemplo do problema (P2):**
- Qualidade: máx = 3 pts, peso = 30%
- Aplicação: máx = 0.5 pts, peso = 5%
- `ptMax_global` = 3 (maior de todos)

Se todos no máximo:
```
soma = 3×0.30 + 3×0.30 + 3×0.30 + 0.5×0.05 + 0.5×0.05
     = 0.9 + 0.9 + 0.9 + 0.025 + 0.025 = 2.75

nota = 2.75 / 3 × 10 = 9,17  ← ERRADO, deveria ser 10!
```

O problema: `ptMax_global = 3` mas Aplicação nunca pode atingir 3 pts.

### Solução: normalização por critério

```
nota_crit_i = pts_i / maxPts_i          (proporção: 0 = mínimo, 1 = máximo)

nota = Σ(nota_crit_i × peso_i) / Σ(peso_i) × 10
```

### Por que funciona

- **Todos no máximo:** `pts_i = maxPts_i` → `nota_crit_i = 1` para todo `i`  
  → `nota = Σ(1 × peso_i) / Σ(peso_i) × 10 = 1 × 10 = 10,00` ✓

- **Todos em zero:** `pts_i = 0` → `nota_crit_i = 0` para todo `i`  
  → `nota = 0 × 10 = 0,00` ✓

### Exemplo — P2 com pesos derivados de maxPts

| Critério | maxPts | peso | pts obtidos | nota_crit | contribuição |
|---|---|---|---|---|---|
| Qualidade | 3 | 30% | 3 | 3/3 = 1.000 | 1.000 × 30 = 30 |
| Aderência | 3 | 30% | 2 | 2/3 = 0.667 | 0.667 × 30 = 20 |
| Relato | 3 | 30% | 3 | 3/3 = 1.000 | 1.000 × 30 = 30 |
| Aplicação | 0.5 | 5% | 0.5 | 0.5/0.5 = 1.000 | 1.000 × 5 = 5 |
| Opinião | 0.5 | 5% | 0 | 0/0.5 = 0.000 | 0.000 × 5 = 0 |
| **Total** | | **100%** | | | **85** |

```
nota = 85 / 100 × 10 = 8,50
```

Mesmo resultado do modo absoluto — consistência garantida.

---

## Relação entre os modos

O app **não converte** automaticamente pontos em pesos nem o contrário. Trocar o modo só muda a fórmula usada e limpa as seleções. No modo `pct` vale o campo **Peso %** de cada critério (aba ✏️ Editar).

- **Peso proporcional aos pontos máximos** (como nos 4 templates): os dois modos dão exatamente a mesma nota.
- **Pesos diferentes dos pontos máximos:** o modo `abs` ignora os pesos, e o modo `pct` ignora a diferença de escala entre os critérios (cada um vale pelo seu peso).

Para derivar pesos a partir dos pontos máximos ao montar uma rubrica:

```
peso_i = (maxPts_i / Σ maxPts_j) × 100
```

Ajuste os valores para somarem 100 (o último critério absorve o arredondamento).

---

## Validação das 4 rubricas

Todos os resultados validados matematicamente (ver `scripts/validar_rubricas.py`):

| Rubrica | Pontos máx | Pontos mín | Pesos máx | Pesos mín |
|---|---|---|---|---|
| P2 — Recurso Educacional | **10,00** | **0,00** | **10,00** | **0,00** |
| P4 — Portfólio | **10,00** | **0,00** | **10,00** | **0,00** |
| AF — Plano de Aula Híbrida | **10,00** | **0,00** | **10,00** | **0,00** |
| AF — Análise de Ferramenta Digital | **10,00** | **0,00** | **10,00** | **0,00** |

---

## Implementação JavaScript

Trecho de `index.html` (resumido). A nota só existe quando **todos** os critérios foram marcados:

```javascript
function calcNota(r, sel) {
  if (!r || !r.criterios || !r.criterios.length) return null;
  if (!Object.keys(sel).length) return null;
  const modo = (r.id === rubrActual) ? modoAtual : (r.modo || 'abs');

  if (modo === 'abs') {
    let obt = 0, maxT = 0;
    for (const c of r.criterios) {
      maxT += Math.max(...c.niveis.map(n => n.pts));
      if (sel[c.id] !== undefined) obt += sel[c.id]; else return null;
    }
    return maxT === 0 ? null : Math.min(10, (obt / maxT) * 10);
  }

  let pesoT = 0, soma = 0;
  for (const c of r.criterios) {
    const mx = Math.max(...c.niveis.map(n => n.pts));
    if (mx === 0) continue;                  // critério sem pontuação possível
    pesoT += (c.peso || 1);
    if (sel[c.id] !== undefined) soma += (sel[c.id] / mx) * (c.peso || 1); else return null;
  }
  return pesoT === 0 ? null : Math.min(10, (soma / pesoT) * 10);
}
```

O `Math.min(10, …)` evita resultados como 10,0000001 por ponto flutuante.

### Faixas exibidas na aba Aplicar

| Nota | Rótulo |
|---|---|
| ≥ 7 | ✅ Aprovado |
| ≥ 5 e < 7 | ⚠️ Recuperação |
| < 5 | ❌ Reprovado |
