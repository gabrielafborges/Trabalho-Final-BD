# Executa comandos_redis.txt no redis-cli (ou memurai-cli), mostrando cada
# comando e sua resposta. Linhas em branco e iniciadas por # são ignoradas.
#
# Uso:  powershell -ExecutionPolicy Bypass -File redis/executar_redis.ps1
param(
    [string]$Arquivo = (Join-Path $PSScriptRoot "comandos_redis.txt")
)

$cli = Get-Command redis-cli -ErrorAction SilentlyContinue
if (-not $cli) { $cli = Get-Command memurai-cli -ErrorAction SilentlyContinue }
if (-not $cli) { $cli = Get-Command "C:\Program Files\Memurai\memurai-cli.exe" -ErrorAction SilentlyContinue }
if (-not $cli) { Write-Error "redis-cli / memurai-cli não encontrado no PATH."; exit 1 }

Get-Content -Encoding UTF8 $Arquivo | ForEach-Object {
    $linha = $_.Trim()
    if ($linha -eq "" -or $linha.StartsWith("#")) { return }
    Write-Host ("redis> " + $linha) -ForegroundColor Cyan
    $linha | & $cli.Source --no-raw
}
