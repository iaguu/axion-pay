param(
  [string]$Path = "payment/logs/woovi-log.jsonl",
  [string]$OutFile = "payment/logs/woovi-log.pretty.json"
)

if (-not (Test-Path $Path)) {
  Write-Error "Arquivo nao encontrado: $Path"
  exit 1
}

$items = @()
Get-Content $Path | ForEach-Object {
  $line = $_.Trim()
  if ($line.Length -eq 0) {
    return
  }
  try {
    $items += ($line | ConvertFrom-Json)
  } catch {
    Write-Warning "Linha ignorada (JSON invalido)."
  }
}

$items | ConvertTo-Json -Depth 12 | Set-Content -Encoding UTF8 $OutFile
Write-Host "Gerado: $OutFile"
