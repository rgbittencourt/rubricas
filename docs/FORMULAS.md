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

## Modo Pesos Percentuais (`pes`)

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

## Conversão automática entre modos

### ABS → PES (derivar pesos a partir de maxPts)

```
peso_i = (maxPts_i / Σ maxPts_j) × 100
```

Garante: `Σ peso_i = 100%` e pesos proporcionais à importância original.

**Ajuste de arredondamento:** O último critério absorve o resto  
para garantir soma exata de 100%:
```javascript
if (i === crits.length - 1) {
  peso = 100 - acumulado;   // absorve erro de arredondamento
} else {
  peso = Math.round((maxPts / somaMaxPts) * 1000) / 10;
}
```

### PES → ABS (derivar maxPts a partir de pesos)

```
maxPts_i = ptMax_global × (peso_i / maxPeso)
```

Arredondado para múltiplos de 0.5 (escala comum em rubricas):
```
maxPts_i = max(0.5, round(raw × 2) / 2)
```

Onde `ptMax_global` = maior `pts` entre todos os níveis,  
e `maxPeso` = maior peso entre todos os critérios.

---

## Validação das 4 rubricas

Todos os resultados validados matematicamente (ver `scripts/validar.py`):

| Rubrica | ABS máx | ABS mín | PES máx | PES mín |
|---|---|---|---|---|
| P2 — Recurso Educacional | **10,00** | **0,00** | **10,00** | **0,00** |
| P4 — Portfólio | **10,00** | **0,00** | **10,00** | **0,00** |
| AF — Plano de Aula Híbrida | **10,00** | **0,00** | **10,00** | **0,00** |
| AF — Análise de Ferramenta Digital | **10,00** | **0,00** | **10,00** | **0,00** |

---

## Implementação JavaScript

```javascript
function calcNota() {
  const nSel = Object.keys(sels).length;
  let nota = null, soma = 0;

  if (MODE === 'abs') {
    const smx = R.crits.reduce((s, c) => s + (c.maxPts || 0), 0);
    R.crits.forEach(c => {
      const n = sels[c.k] ? R.nivs.find(x => x.k === sels[c.k]) : null;
      if (n) soma += n.pts;
    });
    if (nSel > 0 && smx > 0) nota = (soma / smx) * 10;

  } else {
    const somaPesos = R.crits.reduce((s, c) => s + (c.peso || 0), 0);
    if (somaPesos > 0) {
      let somaPond = 0;
      R.crits.forEach(c => {
        const n = sels[c.k] ? R.nivs.find(x => x.k === sels[c.k]) : null;
        const maxC = c.maxPts || 0;
        const pts = n ? n.pts : null;
        if (pts !== null && maxC > 0)
          somaPond += (pts / maxC) * (c.peso / somaPesos);
      });
      if (nSel > 0) nota = somaPond * 10;
    }
  }

  // Clamp: evita 10.0000001 por floating point
  if (nota !== null) nota = Math.min(10, Math.max(0, nota));
  return nota;
}
```
