# Exportar rubricas para o Moodle (CSV)

O botão **🎓 Moodle** (no card da rubrica e dentro dela) baixa um arquivo `.csv` para importar a rubrica numa **Tarefa** do Moodle.

---

## Pesos e pontos

A rubrica do Moodle trabalha com **pontos por nível**. Não existe campo de peso: a nota é a soma dos pontos dos níveis marcados, convertida para a nota máxima da tarefa. Para dar mais peso a um critério, dá-se mais pontos aos níveis dele.

Por isso a exportação converte a rubrica em pontos, nos dois modos do app:

| Modo no Gerador | Pontos de cada nível no Moodle |
|---|---|
| Pontos absolutos | `pts × nota máxima ÷ soma dos pontos máximos` |
| Pesos % | `pts ÷ máximo do critério × peso ÷ soma dos pesos × nota máxima` |

É a mesma conta de `calcNota()`, então a soma dos níveis máximos fica igual à **nota máxima da tarefa** e a nota no Moodle coincide com a do Gerador. Os pontos são arredondados em centésimos e a sobra do arredondamento vai para o nível máximo do critério que vale mais. Quando a divisão não é exata (nota máxima 7,5, por exemplo), a nota pode diferir em poucos centésimos.

Exemplo, template P2 com nota máxima 100: os três critérios de 3 pontos ficam com níveis 0 · 20 · 30 e os dois de 0,5 ponto ficam com 0 · 5.

---

## Como usar

1. Abra a rubrica (ou use o card) e clique em **🎓 Moodle**.
2. Informe a **nota máxima da tarefa no Moodle** (o app lembra o último valor; padrão 10).
3. Confira a tabela de pontos e os avisos e clique em **⬇ Baixar CSV**.

### Importar com plugin

O Moodle não importa rubricas por arquivo sem plugin. O CSV segue o formato de dois plugins gratuitos, que o **administrador do Moodle** precisa instalar:

- [Rubric Importer Core](https://moodle.org/plugins/local_customgradingform_renderer) (`local_customgradingform_renderer`)
- [Import rubric from CSV](https://moodle.org/plugins/block_importrubric) (`block_importrubric`)

Com eles instalados:

1. Na Tarefa, em **Configurações → Nota**, use a mesma **nota máxima** informada no app e o método de avaliação **Rubrica**.
2. Adicione o bloco **Import rubric from CSV** na Tarefa, clique no botão do bloco e envie o arquivo.
3. A rubrica entra como rascunho. Revise em **Avaliação avançada** e salve como pronta.

A Tarefa não pode ter rubrica definida antes da importação: o plugin recusa.

### Sem plugin

Use a tabela do modal como guia e monte a rubrica em **Avaliação avançada → Definir nova rubrica do zero**, copiando critérios, descritores e pontos.

---

## Formato do arquivo

```
criterion,level,level_description,score
Qualidade do recurso,1,Não foi possível avaliar o recurso…,0
Qualidade do recurso,2,O recurso tem boa qualidade…,20
Qualidade do recurso,3,O recurso tem excelente qualidade…,30
```

- Uma linha por nível, do menor para o maior. `level` é só a numeração; o plugin usa `criterion`, `level_description` e `score`.
- UTF-8 **sem BOM** (com BOM o plugin não reconhece o cabeçalho). Se abrir no Excel, os acentos podem aparecer trocados; no Moodle, não.
- Pontos com ponto decimal (`2.5`).

O importador rejeita qualquer linha com aspas, ponto e vírgula ou mais de três vírgulas, e não aceita campos entre aspas. Por isso o app troca, nos textos:

| No Gerador | No CSV |
|---|---|
| `,` e `;` | `‚` (vírgula baixa, parecida com a vírgula) |
| `"` | `“` `”` |
| quebra de linha | espaço |

---

## Regras conferidas antes de baixar

| Situação | O que o app faz |
|---|---|
| Dois níveis do mesmo critério com a mesma pontuação | **Bloqueia** e diz qual critério ajustar (o plugin exige pontos diferentes) |
| Critério cujo nível máximo vale 0 | Fica de fora do CSV, com aviso (não muda a nota) |
| Dois critérios com o mesmo nome | O segundo recebe ` (2)` (o plugin juntaria os dois) |
| Critério sem nível de 0 ponto | Aviso: inclua um nível 0 para a nota coincidir com a do Gerador |
| Nível sem descrição | Recebe `Nível N` |
| Nota máxima vazia, zero ou acima de 1000 | Bloqueia |

`scripts/validar_csv_moodle.php` reproduz a validação do plugin (versão 1.0.x) fora do Moodle:

```bash
php scripts/validar_csv_moodle.php moodle-p2-recurso-educacional-2026-10-27.csv 100
```
