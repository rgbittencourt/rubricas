#!/usr/bin/env python3
"""
Validador matemático das rubricas — Gerador de Rubricas · INOVALAB
Verifica que: nota_maxima == 10.00 e nota_minima == 0.00
em ambos os modos (absoluto e pesos percentuais).

Uso:
    python3 scripts/validar_rubricas.py
"""


def calc_nota_abs(crits, sels):
    """
    Modo pontos absolutos.
    nota = soma(pts_obtidos_i) / soma(maxPts_i) * 10
    """
    soma_max = sum(c["maxPts"] for c in crits)
    if soma_max == 0:
        return None
    soma = sum(
        sels[i]["pts"] for i in range(len(crits)) if i in sels
    )
    return min(10.0, max(0.0, soma / soma_max * 10))


def calc_nota_pes(crits, sels):
    """
    Modo pesos percentuais.
    nota_crit_i = pts_i / maxPts_i          (proporção 0–1)
    nota = Σ(nota_crit_i * peso_i) / Σ(peso_i) * 10
    """
    soma_pesos = sum(c["peso"] for c in crits)
    if soma_pesos == 0:
        return None
    soma_pond = 0.0
    for i, c in enumerate(crits):
        if i not in sels:
            continue
        pts = sels[i]["pts"]
        max_c = c["maxPts"]
        if max_c > 0:
            soma_pond += (pts / max_c) * (c["peso"] / soma_pesos)
    return min(10.0, max(0.0, soma_pond * 10))


def pesos_de_maxpts(crits):
    """Deriva pesos proporcionais a partir de maxPts (ABS → PES)."""
    soma = sum(c["maxPts"] for c in crits)
    if soma == 0:
        return [100 / len(crits)] * len(crits)
    pesos = []
    acum = 0.0
    for i, c in enumerate(crits):
        if i == len(crits) - 1:
            pesos.append(round(100 - acum, 1))
        else:
            p = round((c["maxPts"] / soma) * 100, 1)
            pesos.append(p)
            acum += p
    return pesos


def validar_rubrica(rubrica):
    """
    Valida uma rubrica nos dois modos.
    Retorna dict com resultados e status.
    """
    nome = rubrica["nome"]
    crits_raw = rubrica["crits"]
    nivs = rubrica["nivs"]

    # Monta crits com pesos derivados
    crits = []
    for c in crits_raw:
        crits.append({
            "maxPts": c["maxPts"],
            "peso":   c.get("peso", 0),
            "nome":   c["nome"],
            # Nível máximo disponível (maior pts que tem descritor ou pts > 0)
            "maxNivIdx": c["maxNivIdx"],
        })

    # Deriva pesos se não fornecidos
    pesos = pesos_de_maxpts(crits)
    for i, c in enumerate(crits):
        if c["peso"] == 0:
            c["peso"] = pesos[i]

    # sels_max: cada critério no nível máximo disponível
    sels_max = {i: nivs[c["maxNivIdx"]] for i, c in enumerate(crits)}
    # sels_min: cada critério no nível zero (primeiro nível com pts=0)
    idx_zero = next(j for j, n in enumerate(nivs) if n["pts"] == 0)
    sels_min = {i: nivs[idx_zero] for i in range(len(crits))}

    nota_abs_max = calc_nota_abs(crits, sels_max)
    nota_abs_min = calc_nota_abs(crits, sels_min)
    nota_pes_max = calc_nota_pes(crits, sels_max)
    nota_pes_min = calc_nota_pes(crits, sels_min)

    TOL = 0.005  # tolerância para floating point

    ok = all([
        nota_abs_max is not None and abs(nota_abs_max - 10) < TOL,
        nota_abs_min is not None and abs(nota_abs_min - 0)  < TOL,
        nota_pes_max is not None and abs(nota_pes_max - 10) < TOL,
        nota_pes_min is not None and abs(nota_pes_min - 0)  < TOL,
    ])

    return {
        "nome":        nome,
        "ok":          ok,
        "abs_max":     nota_abs_max,
        "abs_min":     nota_abs_min,
        "pes_max":     nota_pes_max,
        "pes_min":     nota_pes_min,
        "soma_maxpts": sum(c["maxPts"] for c in crits),
        "pesos":       [c["peso"] for c in crits],
    }


# ── Rubricas para validar ─────────────────────────────────────────────────────

RUBRICAS = [
    {
        "nome": "P2 — Recurso Educacional",
        "nivs": [
            {"nome": "Não realizado",      "pts": 0},
            {"nome": "Insuficiente",       "pts": 0.5},
            {"nome": "Em desenvolvimento", "pts": 2},
            {"nome": "Satisfatório",       "pts": 3},
        ],
        "crits": [
            {"nome": "Qualidade do recurso",          "maxPts": 3,   "peso": 30, "maxNivIdx": 3},
            {"nome": "Aderência ao desafio",          "maxPts": 3,   "peso": 30, "maxNivIdx": 3},
            {"nome": "Relato da elaboração",          "maxPts": 3,   "peso": 30, "maxNivIdx": 3},
            {"nome": "Aplicação / Testagem",          "maxPts": 0.5, "peso":  5, "maxNivIdx": 1},
            {"nome": "Opinião do público-alvo",       "maxPts": 0.5, "peso":  5, "maxNivIdx": 1},
        ],
    },
    {
        "nome": "P4 — Portfólio / Relato Final",
        "nivs": [
            {"nome": "Não realizado", "pts": 0},
            {"nome": "Parcial",       "pts": 0.5},
            {"nome": "Básico",        "pts": 1},
            {"nome": "Detalhado",     "pts": 2},
            {"nome": "Completo",      "pts": 3},
            {"nome": "Excelente",     "pts": 4},
        ],
        "crits": [
            {"nome": "Sobre o Desafio",            "maxPts": 1, "peso": 10, "maxNivIdx": 2},
            {"nome": "Sobre os recursos (P1–P4)",  "maxPts": 4, "peso": 40, "maxNivIdx": 5},
            {"nome": "Sobre a aplicação",          "maxPts": 2, "peso": 20, "maxNivIdx": 3},
            {"nome": "Competências adquiridas",    "maxPts": 1, "peso": 10, "maxNivIdx": 2},
            {"nome": "Continuidade da pesquisa",   "maxPts": 1, "peso": 10, "maxNivIdx": 2},
            {"nome": "Transparência no uso de IA", "maxPts": 1, "peso": 10, "maxNivIdx": 2},
        ],
    },
    {
        "nome": "AF — Plano de Aula Híbrida",
        "nivs": [
            {"nome": "Não realizado", "pts": 0},
            {"nome": "Parcial",       "pts": 0.5},
            {"nome": "Satisfatório",  "pts": 1},
            {"nome": "Pleno",         "pts": 2},
        ],
        "crits": [
            {"nome": "Coerência atividades/conteúdo/modelo", "maxPts": 2, "peso": 20, "maxNivIdx": 3},
            {"nome": "Adequação dos recursos",               "maxPts": 1, "peso": 10, "maxNivIdx": 2},
            {"nome": "Coerência espaços/modelo",             "maxPts": 2, "peso": 20, "maxNivIdx": 3},
            {"nome": "Mediação pedagógica",                  "maxPts": 2, "peso": 20, "maxNivIdx": 3},
            {"nome": "Ferramenta de gestão",                 "maxPts": 2, "peso": 20, "maxNivIdx": 3},
            {"nome": "Transparência no uso de IA",           "maxPts": 1, "peso": 10, "maxNivIdx": 2},
        ],
    },
    {
        "nome": "AF — Análise de Ferramenta Digital",
        "nivs": [
            {"nome": "Não realizado", "pts": 0},
            {"nome": "Parcial",       "pts": 0.5},
            {"nome": "Básico",        "pts": 1},
            {"nome": "Adequado",      "pts": 2},
            {"nome": "Excelente",     "pts": 3},
        ],
        "crits": [
            {"nome": "Adequação ao formato",      "maxPts": 1, "peso": 10, "maxNivIdx": 2},
            {"nome": "Apresentação da ferramenta","maxPts": 1, "peso": 10, "maxNivIdx": 2},
            {"nome": "Relatos individuais",       "maxPts": 3, "peso": 30, "maxNivIdx": 4},
            {"nome": "Relação com desafios",      "maxPts": 2, "peso": 20, "maxNivIdx": 3},
            {"nome": "Vantagens e desvantagens",  "maxPts": 1, "peso": 10, "maxNivIdx": 2},
            {"nome": "Registros visuais",         "maxPts": 1, "peso": 10, "maxNivIdx": 2},
            {"nome": "Transparência no uso de IA","maxPts": 1, "peso": 10, "maxNivIdx": 2},
        ],
    },
]


# ── Execução ──────────────────────────────────────────────────────────────────

def main():
    print("═" * 70)
    print("VALIDAÇÃO MATEMÁTICA — Gerador de Rubricas · INOVALAB")
    print("Requisito: nota_max = 10,00 · nota_min = 0,00 (ambos os modos)")
    print("═" * 70)

    todas_ok = True
    for r in RUBRICAS:
        res = validar_rubrica(r)
        todas_ok = todas_ok and res["ok"]
        icone = "✅" if res["ok"] else "❌"
        print(f"\n{icone} {res['nome']}")
        print(f"   Soma maxPts: {res['soma_maxpts']}  |  Pesos: {res['pesos']}")
        print(f"   ABS → máx: {res['abs_max']:.4f}  mín: {res['abs_min']:.4f}")
        print(f"   PES → máx: {res['pes_max']:.4f}  mín: {res['pes_min']:.4f}")

    print("\n" + "═" * 70)
    if todas_ok:
        print("✅ TODAS AS RUBRICAS APROVADAS — invariante 0/10 garantida")
    else:
        print("❌ FALHA EM UMA OU MAIS RUBRICAS — verificar fórmulas")
    print("═" * 70)
    return 0 if todas_ok else 1


if __name__ == "__main__":
    raise SystemExit(main())
