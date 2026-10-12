# Exportar e importar rubricas (JSON)

O app guarda as rubricas só no navegador de quem as criou (`localStorage`). A exportação e a importação em arquivo `.json` servem para:

- **fazer backup** das suas rubricas;
- **levar rubricas** de um computador, celular ou navegador para outro;
- **compartilhar** uma rubrica com colegas (mande o arquivo; quem recebe importa).

---

## Como usar

**Exportar**
- Tela inicial → **⬇ Exportar todas**: baixa todas as rubricas em um arquivo (`rubricas-inovalab-AAAA-MM-DD.json`).
- Em um card → **⬇ JSON**, ou dentro da rubrica → **⬇ Exportar**: baixa só aquela (`rubrica-titulo-AAAA-MM-DD.json`).

**Importar**
- Tela inicial → **⬆ Importar** e escolha um ou mais arquivos `.json`.
- As rubricas entram como **cópias novas**: nada que você já tem é substituído ou apagado. Se importar o mesmo arquivo duas vezes, terá duas cópias (use **🗑** para apagar a sobra).
- O app mostra quantas foram importadas e, se algum item foi ignorado, o motivo.

> O arquivo contém **só o modelo da rubrica**. Nome do aluno, turma e data (preenchidos na aba Aplicar) **não são exportados**, para que a rubrica possa ser compartilhada sem dados pessoais. As seleções de níveis e a nota também não vão no arquivo.

---

## Formato do arquivo

```json
{
  "formato": "inovalab-rubricas",
  "versao": 1,
  "exportadoEm": "2026-10-11T21:00:00.000Z",
  "rubricas": [
    {
      "titulo": "Seminário EaD",
      "disciplina": "TEDPRO",
      "atividade": "Apresentação de seminário",
      "modo": "abs",
      "criterios": [
        {
          "nome": "Qualidade do conteúdo",
          "peso": 30,
          "niveis": [
            { "pts": 0, "desc": "Não apresentou ou o conteúdo é inadequado." },
            { "pts": 3, "desc": "Conteúdo completo, preciso e bem fundamentado." }
          ]
        }
      ]
    }
  ]
}
```

| Campo | Regra |
|---|---|
| `formato` | `"inovalab-rubricas"`. Outro valor é recusado |
| `versao` | Número. Versões maiores que a do app (hoje 1) são recusadas |
| `rubricas` | Lista de rubricas (até 200 por arquivo) |
| `modo` | `"abs"` (pontos absolutos) ou `"pct"` (pesos %). Outro valor vira `"abs"` |
| `criterios` | Obrigatório, de 1 a 50 critérios |
| `peso` | Número ≥ 0. Se faltar, os critérios dividem 100% igualmente |
| `niveis` | Obrigatório, de 1 a 20 níveis por critério |
| `pts` | Número ≥ 0 (aceita texto numérico como `"2,5"`). Os níveis são ordenados do menor para o maior |
| `titulo`, `nome` | Até 200 caracteres. Título vazio vira "Rubrica importada" |
| `desc` | Até 5.000 caracteres |

Também são aceitos: uma **lista** de rubricas (`[ {...}, {...} ]`) e uma **rubrica avulsa** (`{ "titulo": ..., "criterios": [...] }`), sem o envelope.

Tamanho máximo do arquivo: **2 MB**.

---

## Segurança

- O arquivo é lido apenas no navegador; nada é enviado a servidor.
- Cada campo é validado e **copiado** para um objeto novo; campos desconhecidos (inclusive `__proto__`) são ignorados.
- Todo texto é escapado ao ser exibido, então um arquivo com HTML ou scripts aparece como texto, sem executar.
- Se o navegador não tiver espaço para guardar as rubricas importadas, o app avisa e **não** importa nada pela metade.

---

## Exemplos

Em `exemplos/` há dois arquivos prontos para importar, no formato acima:

- `rubrica-exemplo-simples.json`: seminário com 3 critérios;
- `rubrica-p4-completa.json`: rubrica P4 (Portfólio / Relato Final) com 6 critérios.

Para criar uma rubrica à mão ou por script, basta seguir o formato. Dica: faça uma exportação e use o arquivo como modelo.

---

## Limitações

- Não há sincronização automática entre dispositivos: exportar e importar é manual.
- Não é possível importar sobre uma rubrica existente; a importação sempre cria cópias.
- O arquivo não guarda avaliações de alunos (ver `docs/ARQUITETURA.md`, "Limitações conhecidas").
