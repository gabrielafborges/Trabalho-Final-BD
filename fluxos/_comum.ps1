# Funções compartilhadas pelos scripts de fluxo.
# Localiza o mongosh e o redis-cli/memurai-cli e define Redis e Mongo.

$script:cli = Get-Command redis-cli -ErrorAction SilentlyContinue
if (-not $script:cli) { $script:cli = Get-Command memurai-cli -ErrorAction SilentlyContinue }
if (-not $script:cli) { $script:cli = Get-Command "C:\Program Files\Memurai\memurai-cli.exe" -ErrorAction SilentlyContinue }
if (-not $script:cli) { Write-Error "redis-cli / memurai-cli não encontrado."; exit 1 }

$script:mongosh = Get-Command mongosh -ErrorAction SilentlyContinue
if (-not $script:mongosh) { $script:mongosh = Get-Command "$env:LOCALAPPDATA\Programs\mongosh\mongosh.exe" -ErrorAction SilentlyContinue }
if (-not $script:mongosh) { Write-Error "mongosh não encontrado."; exit 1 }

$script:BANCO = "ingressos_bd2"

function Passo([string]$texto) {
    Write-Host ""
    Write-Host ("### " + $texto) -ForegroundColor Green
}

# Executa um comando no Redis e mostra comando + resposta
function Redis([string]$comando) {
    Write-Host ("redis> " + $comando) -ForegroundColor Cyan
    $comando | & $script:cli.Source --no-raw
}

# Executa um trecho JavaScript no mongosh (banco ingressos_bd2) e mostra comando + resposta
function Mongo([string]$js) {
    Write-Host ("mongosh> " + $js) -ForegroundColor Yellow
    & $script:mongosh.Source --quiet $script:BANCO --eval $js
}

# Executa JS no mongosh e devolve apenas a saída (para reutilizar o resultado)
function MongoValor([string]$js) {
    return (& $script:mongosh.Source --quiet $script:BANCO --eval $js | Out-String).Trim()
}
