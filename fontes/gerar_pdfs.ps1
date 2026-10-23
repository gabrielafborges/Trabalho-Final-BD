# Gera relatorio.pdf e slides.pdf a partir dos arquivos HTML desta pasta,
# usando o modo headless do Microsoft Edge ou do Google Chrome.
#
# Uso:  powershell -ExecutionPolicy Bypass -File fontes/gerar_pdfs.ps1
$raiz = Split-Path $PSScriptRoot -Parent

$navegadores = @(
    "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
    "C:\Program Files\Microsoft\Edge\Application\msedge.exe",
    "C:\Program Files\Google\Chrome\Application\chrome.exe",
    "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"
)
$nav = $navegadores | Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $nav) { Write-Error "Edge/Chrome não encontrado."; exit 1 }

function Converter([string]$html, [string]$pdf) {
    $origem  = "file:///" + ((Join-Path $PSScriptRoot $html) -replace '\\', '/')
    $destino = Join-Path $raiz $pdf
    & $nav --headless=new --disable-gpu --no-pdf-header-footer --print-to-pdf="$destino" $origem 2>$null | Out-Null
    if (Test-Path $destino) { Write-Host "gerado: $pdf" } else { Write-Error "falha ao gerar $pdf" }
}

Converter "relatorio.html" "relatorio.pdf"
Converter "slides.html"    "slides.pdf"
