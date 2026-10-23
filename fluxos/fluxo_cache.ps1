# =====================================================================
#  FLUXO 1 (obrigatório): cache da página do evento
#  miss no Redis -> consulta no MongoDB -> SETEX com TTL -> hit -> TTL
#
#  Uso:  powershell -ExecutionPolicy Bypass -File fluxos/fluxo_cache.ps1
#  Pré-requisito: mongosh mongodb/01_dados.js já executado.
# =====================================================================
. (Join-Path $PSScriptRoot "_comum.ps1")

$chave = "cache:evento:8"

Passo "0. Garante que a chave não existe (só para repetir a demonstração)"
Redis "DEL $chave"

Passo "1. Usuário abre a página do evento 8: consulta o cache no Redis"
Redis "GET $chave"
Passo "2. Resposta (nil) = CACHE MISS. A informação ainda não está no Redis."

Passo "3. Busca o documento permanente no MongoDB"
Mongo "printjson(db.eventos.findOne({ _id: 8 }, { titulo: 1, cidade: 1, data: 1, 'setores.nome': 1, 'setores.preco': 1 }))"

# Monta o resumo (JSON pequeno) a partir do documento do MongoDB
$json = MongoValor "const e = db.eventos.findOne({ _id: 8 }); print(JSON.stringify({ titulo: e.titulo, cidade: e.cidade, data: e.data.toISOString().slice(0,10), precoMinimo: Math.min(...e.setores.map(s => s.preco)) }))"
$jsonEscapado = $json -replace '"', '\"'

Passo "4. Guarda o resumo no Redis por 300 segundos (5 minutos)"
Redis "SETEX $chave 300 `"$jsonEscapado`""

Passo "5. Consulta novamente a chave: CACHE HIT (a página é servida pelo Redis, sem ir ao MongoDB)"
Redis "GET $chave"

Passo "6. Tempo restante até a expiração"
Redis "TTL $chave"

Passo "Fim do fluxo de cache"
