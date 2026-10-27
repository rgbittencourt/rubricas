<?php
// Confere um CSV exportado para o Moodle com as mesmas regras do importador
// local_customgradingform_renderer (import.php, versão 1.0.x), sem precisar do Moodle.
// clean_param(PARAM_TEXT) ~ strip_tags; PARAM_FLOAT ~ floatval.
// Uso: php scripts/validar_csv_moodle.php arquivo.csv NOTA_MAXIMA
if ($argc < 3) { fwrite(STDERR, "Uso: php validar_csv_moodle.php arquivo.csv NOTA_MAXIMA\n"); exit(2); }
[$_, $arq, $grademax] = $argv; $grademax=(float)$grademax;
$content=file_get_contents($arq);
$lines=preg_split("/\r\n|\n|\r/",$content);
$headers=array_map('trim',str_getcsv((string)array_shift($lines)));
if (array_diff(['criterion','level','level_description','score'],array_map('strtolower',$headers))) { echo "ERRO cabecalho\n"; exit(1); }
foreach ($lines as $n=>$raw) { if ($raw==='') continue;
  $c=substr_count($raw,','); if ($c!==3 || strpbrk($raw,'";')!==false) { echo "ERRO linha ".($n+2).": $raw\n"; exit(1);} }
$rubric=[];
foreach ($lines as $raw) { if (trim($raw)==='') continue; $row=str_getcsv($raw); if(count($row)<3) continue;
  $row=array_combine($headers,$row); $rubric[strip_tags(trim($row['criterion']))][]=['d'=>strip_tags(trim($row['level_description'])),'s'=>(float)$row['score']]; }
$sum=0; foreach($rubric as $k=>$lv){ $sc=array_column($lv,'s'); $sum+=max($sc);
  if (count(array_unique($sc))<count($sc)) { echo "ERRO repetidos em $k\n"; exit(1);} }
if (round($sum,2)!==round($grademax,2)) { echo "ERRO soma $sum != $grademax\n"; exit(1); }
echo "OK ".count($rubric)." criterios, soma $sum\n";
