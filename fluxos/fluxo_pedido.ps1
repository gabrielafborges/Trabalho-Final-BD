# =====================================================================
#  FLUXO 2: compra de ingresso
#  reserva temporária (Redis) -> pedido permanente (MongoDB) -> fila de
#  pagamento (Redis) -> confirmação (MongoDB) -> ranking/resumo atualizados
#  e cache invalidado (Redis)
#
#  Uso:  powershell -ExecutionPolicy Bypass -File fluxos/fluxo_pedido.ps1
#  Pré-requisito: mongosh mongodb/01_dados.js já executado.
# =====================================================================
. (Join-Path $PSScriptRoot "_comum.ps1")

Passo "0. Estado inicial (apenas para repetir a demonstração): limpa e recria cache, ranking e resumo do evento 1"
Redis "DEL fila:pedidos:pagamento ranking:eventos:vendas resumo:evento:1 cache:evento:1 reserva:evento:1:cliente:3"
Redis 'SETEX cache:evento:1 300 "{\"titulo\":\"Festival Som da Serra\",\"ingressosVendidos\":977}"'
Redis 'ZADD ranking:eventos:vendas 35370 "evento:5" 29260 "evento:8" 977 "evento:1" 800 "evento:7" 548 "evento:2"'
Redis 'HSET resumo:evento:1 titulo "Festival Som da Serra" ingressosVendidos 977'
Mongo "db.pedidos.deleteOne({ _id: 14 })"

Passo "1. Cliente 3 escolhe 2 ingressos de Pista do evento 1: reserva temporária de 10 minutos no Redis"
Redis 'SETEX reserva:evento:1:cliente:3 600 "Pista|2"'
Redis "TTL reserva:evento:1:cliente:3"

Passo "2. O pedido é gravado de forma permanente no MongoDB (status pendente)"
Mongo "printjson(db.pedidos.insertOne({ _id: 14, clienteId: 3, eventoId: 1, dataPedido: new Date(), status: 'pendente', formaPagamento: 'pix', itens: [ { setor: 'Pista', quantidade: 2, valorUnitario: 120 } ], valorTotal: 240 }))"

Passo "3. O pedido entra na fila de pagamento do Redis (LPUSH)"
Redis 'LPUSH fila:pedidos:pagamento "pedido:14"'
Redis "LRANGE fila:pedidos:pagamento 0 -1"

Passo "4. O processador de pagamentos retira o pedido mais antigo da fila (RPOP)"
Redis "RPOP fila:pedidos:pagamento"

Passo "5. Pagamento confirmado: o MongoDB recebe a atualização definitiva"
Mongo "printjson(db.pedidos.updateOne({ _id: 14 }, { `$set: { status: 'pago', dataPagamento: new Date() } }))"
Mongo "printjson(db.eventos.updateOne({ _id: 1 }, { `$inc: { 'setores.`$[s].vendidos': 2 } }, { arrayFilters: [ { 's.nome': 'Pista' } ] }))"
Mongo "printjson(db.pedidos.findOne({ _id: 14 }, { status: 1, valorTotal: 1 }))"
Mongo "printjson(db.eventos.findOne({ _id: 1 }, { _id: 0, 'setores.nome': 1, 'setores.vendidos': 1 }))"

Passo "6. O Redis reflete a venda: ranking (+2) e resumo rápido (+2)"
Redis 'ZINCRBY ranking:eventos:vendas 2 "evento:1"'
Redis 'HINCRBY resumo:evento:1 ingressosVendidos 2'
Redis "ZREVRANGE ranking:eventos:vendas 0 2 WITHSCORES"
Redis "HGETALL resumo:evento:1"

Passo "7. A reserva deixa de ser necessária e o cache do evento 1 é invalidado (dado mudou no MongoDB)"
Redis "DEL reserva:evento:1:cliente:3"
Redis "DEL cache:evento:1"
Redis "EXISTS cache:evento:1"

Passo "Fim do fluxo de pedido"
