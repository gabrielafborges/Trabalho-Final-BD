# Gera as imagens da pasta evidencias/ a partir dos logs reais de execução
# (saída do mongosh e do redis-cli), desenhando o texto em estilo terminal.
#
# Uso:  powershell -ExecutionPolicy Bypass -File fontes/gerar_evidencias.ps1
Add-Type -AssemblyName System.Drawing

$raiz = Split-Path $PSScriptRoot -Parent
$ev   = Join-Path $raiz "evidencias"

function Trecho([string]$arquivo, [string]$inicio, [string]$fim) {
    # devolve as linhas entre a primeira ocorrência de $inicio e a primeira de $fim (exclusivo)
    $linhas = Get-Content -Encoding UTF8 (Join-Path $ev $arquivo)
    $out = New-Object System.Collections.Generic.List[string]
    $dentro = $false
    foreach ($l in $linhas) {
        if (-not $dentro -and $inicio -ne "" -and $l -like "*$inicio*") { $dentro = $true }
        if ($inicio -eq "") { $dentro = $true }
        if ($dentro -and $fim -ne "" -and $l -like "*$fim*") { break }
        if ($dentro) { $out.Add($l) }
    }
    return $out
}

function Renderizar([string]$titulo, [string[]]$linhas, [string]$saida, [int]$colunas = 110) {
    # quebra linhas longas
    $texto = New-Object System.Collections.Generic.List[string]
    foreach ($l in $linhas) {
        $l = $l.TrimEnd()
        while ($l.Length -gt $colunas) { $texto.Add($l.Substring(0, $colunas)); $l = "    " + $l.Substring($colunas) }
        $texto.Add($l)
    }
    # remove linhas em branco repetidas no início/fim
    while ($texto.Count -gt 0 -and $texto[0] -eq "") { $texto.RemoveAt(0) }
    while ($texto.Count -gt 0 -and $texto[$texto.Count-1] -eq "") { $texto.RemoveAt($texto.Count-1) }

    $fonte   = New-Object System.Drawing.Font("Consolas", 11)
    $fonteT  = New-Object System.Drawing.Font("Segoe UI", 11, [System.Drawing.FontStyle]::Bold)
    $altura  = 20
    $margem  = 18
    $largura = [int]($colunas * 8.6) + 2 * $margem
    $alt     = $texto.Count * $altura + 2 * $margem + 40

    $bmp = New-Object System.Drawing.Bitmap $largura, $alt
    $g   = [System.Drawing.Graphics]::FromImage($bmp)
    $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::ClearTypeGridFit
    $g.Clear([System.Drawing.Color]::FromArgb(30, 31, 38))

    # barra de título
    $g.FillRectangle((New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(45, 47, 58))), 0, 0, $largura, 34)
    foreach ($i in 0..2) {
        $cores = @([System.Drawing.Color]::FromArgb(255,95,86), [System.Drawing.Color]::FromArgb(255,189,46), [System.Drawing.Color]::FromArgb(39,201,63))
        $g.FillEllipse((New-Object System.Drawing.SolidBrush $cores[$i]), 12 + $i*20, 10, 13, 13)
    }
    $g.DrawString($titulo, $fonteT, [System.Drawing.Brushes]::WhiteSmoke, 80, 7)

    $corCmdRedis = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(97, 218, 251))
    $corCmdMongo = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 214, 102))
    $corPasso    = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(152, 255, 152))
    $corSecao    = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 160, 122))
    $corTexto    = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(220, 220, 220))

    $y = 34 + $margem
    foreach ($l in $texto) {
        $brush = $corTexto
        if ($l.StartsWith("redis>"))   { $brush = $corCmdRedis }
        elseif ($l.StartsWith("mongosh>")) { $brush = $corCmdMongo }
        elseif ($l.StartsWith("###"))  { $brush = $corPasso }
        elseif ($l.StartsWith("====") -or $l -match '^ \d+(\.\d+)? ') { $brush = $corSecao }
        $g.DrawString($l, $fonte, $brush, $margem, $y)
        $y += $altura
    }
    $g.Dispose()
    $bmp.Save((Join-Path $ev $saida), [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    Write-Host "gerado: $saida ($($texto.Count) linhas)"
}

# ---- MongoDB ---------------------------------------------------------
Renderizar "mongosh - 01_dados.js (carga inicial)" (Trecho "log_01_dados.txt" "" "") "mongo_01_carga.png" 80
Renderizar "mongosh - inserção de cliente e pedido" (Trecho "log_02_operacoes.txt" "1. INSERÇÃO" "2.1 Eventos") "mongo_02_insercao.png" 90
Renderizar "mongosh - consultas com filtros e operadores (2.1 a 2.3)" (Trecho "log_02_operacoes.txt" "2.1 Eventos" "2.4 Clientes") "mongo_03_consultas_a.png" 90
Renderizar "mongosh - consultas com filtros e operadores (2.4 a 2.6)" (Trecho "log_02_operacoes.txt" "2.4 Clientes" "3.1 Atualização") "mongo_04_consultas_b.png" 90
Renderizar "mongosh - atualizações (3.1 a 3.3)" (Trecho "log_02_operacoes.txt" "3.1 Atualização" "4.1 Desativação") "mongo_05_atualizacao.png" 90
Renderizar "mongosh - desativação lógica e exclusão (4.1 a 4.3)" (Trecho "log_02_operacoes.txt" "4.1 Desativação" "5.1 Aggregation") "mongo_06_desativacao_exclusao.png" 90
Renderizar "mongosh - Aggregation Pipeline 5.1 (faturamento por evento)" (Trecho "log_02_operacoes.txt" "5.1 Aggregation" "5.2 Aggregation") "mongo_07_agregacao_faturamento.png" 90
Renderizar "mongosh - Aggregation Pipeline 5.2 e 5.3" (Trecho "log_02_operacoes.txt" "5.2 Aggregation" "6.1 Índice") "mongo_08_agregacao_clientes_ocupacao.png" 90
Renderizar "mongosh - índices e explain() (IXSCAN)" (Trecho "log_02_operacoes.txt" "6.1 Índice" "FIM DAS") "mongo_09_indice_explain.png" 90

# ---- Redis -----------------------------------------------------------
Renderizar "redis-cli - string com TTL e hash" (Trecho "log_redis_comandos.txt" "redis> FLUSHDB" "redis> ZADD") "redis_01_string_ttl_hash.png" 100
Renderizar "redis-cli - sorted set (rankings)" (Trecho "log_redis_comandos.txt" "redis> ZADD" "redis> LPUSH fila:pedidos:pagamento `"pedido:7`"") "redis_02_sorted_set.png" 100
Renderizar "redis-cli - list (fila e histórico) e set (online, favoritos)" (Trecho "log_redis_comandos.txt" "redis> LPUSH fila:pedidos:pagamento `"pedido:7`"" "redis> INCR contador") "redis_03_list_set.png" 100
Renderizar "redis-cli - contador e visão geral das chaves" ((Trecho "log_redis_comandos.txt" "redis> INCR contador" "redis> GET cache:evento:8") + (Trecho "log_redis_comandos.txt" "redis> KEYS" "")) "redis_04_contador_chaves.png" 100

# ---- Fluxos ----------------------------------------------------------
Renderizar "Fluxo 1 - cache: miss -> MongoDB -> SETEX -> hit -> TTL" (Trecho "log_fluxo_cache.txt" "" "") "fluxo_cache.png" 110
Renderizar "Fluxo 2 - pedido: reserva -> MongoDB -> fila -> pagamento -> ranking -> invalidação" (Trecho "log_fluxo_pedido.txt" "" "") "fluxo_pedido.png" 110
