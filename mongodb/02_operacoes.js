// =====================================================================
//  Trabalho Prático BD2 - MongoDB e Redis
//  Cenário: Plataforma de venda de ingressos para eventos
//  Arquivo 2/2: operações CRUD, consultas, Aggregation Pipeline e índice
//
//  Execução:  mongosh mongodb/02_operacoes.js   (depois do 01_dados.js)
// =====================================================================

db = db.getSiblingDB("ingressos_bd2");

function secao(titulo) {
  print("\n==================================================================");
  print(" " + titulo);
  print("==================================================================");
}

// ---------------------------------------------------------------------
// 1. INSERÇÃO
//    Necessidade: um novo cliente se cadastra e faz a primeira compra.
// ---------------------------------------------------------------------
secao("1. INSERÇÃO - novo cliente e novo pedido");

db.clientes.insertOne({
  _id: 9,
  nome: "Isabela Martins",
  email: "isabela.martins@email.com",
  telefone: "(31) 99999-0009",
  endereco: { cidade: "Ouro Preto", uf: "MG" },
  preferencias: ["Show", "Festa"],
  dataCadastro: new Date(),
  ativo: true
});

db.pedidos.insertOne({
  _id: 13,
  clienteId: 9,
  eventoId: 1,
  dataPedido: new Date(),
  status: "pago",
  formaPagamento: "pix",
  itens: [ { setor: "Pista", quantidade: 2, valorUnitario: 120 } ],
  valorTotal: 240
});

printjson(db.clientes.findOne({ _id: 9 }));
printjson(db.pedidos.findOne({ _id: 13 }));

// ---------------------------------------------------------------------
// 2. CONSULTAS COM FILTROS E OPERADORES (mínimo quatro)
// ---------------------------------------------------------------------

// 2.1 Eventos ativos em Ouro Preto a partir de setembro de 2026
//     Operadores: igualdade + $gte em campo de data + projeção
secao("2.1 Eventos ativos em Ouro Preto a partir de 01/09/2026  ($gte)");
db.eventos.find(
  { cidade: "Ouro Preto", status: "ativo", data: { $gte: ISODate("2026-09-01T00:00:00Z") } },
  { _id: 1, titulo: 1, data: 1, categoria: 1 }
).sort({ data: 1 }).forEach(printjson);

// 2.2 Eventos que possuem algum setor com ingresso até R$ 60
//     Operadores: $elemMatch (filtra dentro do array embutido "setores") + $lte
secao("2.2 Eventos com algum setor de até R$ 60  ($elemMatch + $lte)");
db.eventos.find(
  { setores: { $elemMatch: { preco: { $lte: 60 } } } },
  { _id: 1, titulo: 1, "setores.nome": 1, "setores.preco": 1 }
).forEach(printjson);

// 2.3 Pedidos pagos ou pendentes com valor total igual ou acima de R$ 300
//     Operadores: $in + $gte + sort decrescente
secao("2.3 Pedidos pagos/pendentes com valorTotal >= 300  ($in + $gte)");
db.pedidos.find(
  { status: { $in: ["pago", "pendente"] }, valorTotal: { $gte: 300 } },
  { _id: 1, clienteId: 1, eventoId: 1, status: 1, valorTotal: 1 }
).sort({ valorTotal: -1 }).forEach(printjson);

// 2.4 Clientes ativos que gostam de "Show" OU "Festa" (para campanha de e-mail)
//     Operadores: $or + igualdade em array + $ne
secao("2.4 Clientes ativos com preferência Show ou Festa  ($or em array)");
db.clientes.find(
  { ativo: true, $or: [ { preferencias: "Show" }, { preferencias: "Festa" } ] },
  { _id: 0, nome: 1, email: 1, preferencias: 1 }
).forEach(printjson);

// 2.5 Eventos com mais de dois setores (configuração complexa de ingressos)
//     Operadores: $expr + $size
secao("2.5 Eventos com mais de 2 setores  ($expr + $size)");
db.eventos.find(
  { $expr: { $gt: [ { $size: "$setores" }, 2 ] } },
  { _id: 1, titulo: 1, setores: 1 }
).forEach(printjson);

// 2.6 Busca textual por título usando expressão regular (campo de busca do site)
//     Operadores: $regex com opção "i" (ignora maiúsculas/minúsculas)
secao("2.6 Busca por título contendo 'minas'  ($regex)");
db.eventos.find(
  { titulo: { $regex: "minas", $options: "i" } },
  { _id: 1, titulo: 1, cidade: 1 }
).forEach(printjson);

// ---------------------------------------------------------------------
// 3. ATUALIZAÇÃO
// ---------------------------------------------------------------------

// 3.1 Pedido 7 (boleto pendente) foi pago: muda status e registra data
secao("3.1 Atualização - pedido 7 passa de pendente para pago  ($set)");
printjson(db.pedidos.updateOne(
  { _id: 7, status: "pendente" },
  { $set: { status: "pago", dataPagamento: new Date() } }
));
printjson(db.pedidos.findOne({ _id: 7 }, { _id: 1, status: 1, dataPagamento: 1 }));

// 3.2 Após o pagamento, incrementa "vendidos" no setor Pista do evento 8
//     (atualização dentro de array embutido com arrayFilters e $inc)
secao("3.2 Atualização - +3 vendidos no setor Pista do evento 8  ($inc + arrayFilters)");
printjson(db.eventos.updateOne(
  { _id: 8 },
  { $inc: { "setores.$[s].vendidos": 3 } },
  { arrayFilters: [ { "s.nome": "Pista" } ] }
));
printjson(db.eventos.findOne({ _id: 8 }, { _id: 1, titulo: 1, setores: 1 }));

// 3.3 Todos os eventos da categoria Show recebem a tag "destaque"
//     (atualização em massa com updateMany e $addToSet, que evita duplicar)
secao("3.3 Atualização em massa - tag 'destaque' nos eventos de Show  ($addToSet)");
printjson(db.eventos.updateMany(
  { categoria: "Show" },
  { $addToSet: { tags: "destaque" } }
));
db.eventos.find({ tags: "destaque" }, { _id: 1, titulo: 1, tags: 1 }).forEach(printjson);

// ---------------------------------------------------------------------
// 4. EXCLUSÃO FÍSICA E DESATIVAÇÃO LÓGICA
// ---------------------------------------------------------------------

// 4.1 Desativação lógica: o cliente 8 pediu encerramento da conta.
//     Não apagamos porque ele possui pedidos (histórico/fiscal).
secao("4.1 Desativação lógica - cliente 8 (ativo: false)");
printjson(db.clientes.updateOne({ _id: 8 }, { $set: { ativo: false, dataDesativacao: new Date() } }));
printjson(db.clientes.findOne({ _id: 8 }, { _id: 1, nome: 1, ativo: 1, dataDesativacao: 1 }));

// 4.2 Desativação lógica de evento: a Festa Junina já aconteceu
//     e não deve mais aparecer na vitrine (status "encerrado" já mostra isso;
//     aqui marcamos também "visivel: false").
secao("4.2 Desativação lógica - evento 7 some da vitrine (visivel: false)");
printjson(db.eventos.updateOne({ _id: 7 }, { $set: { visivel: false } }));

// 4.3 Exclusão física: o pedido 9 foi cancelado antes de qualquer pagamento
//     e o cliente pediu a remoção do registro.
secao("4.3 Exclusão física - pedido 9 (cancelado) é removido  (deleteOne)");
printjson(db.pedidos.deleteOne({ _id: 9, status: "cancelado" }));
print("Pedido 9 ainda existe? ", db.pedidos.findOne({ _id: 9 }) !== null);

// ---------------------------------------------------------------------
// 5. AGGREGATION PIPELINE
// ---------------------------------------------------------------------

// 5.1 Faturamento e ingressos vendidos por evento (apenas pedidos pagos)
//     Estágios: $match -> $unwind -> $group -> $lookup -> $unwind -> $project -> $sort
secao("5.1 Aggregation - faturamento por evento (7 estágios)");
db.pedidos.aggregate([
  { $match: { status: "pago" } },
  { $unwind: "$itens" },
  { $group: {
      _id: "$eventoId",
      ingressosVendidos: { $sum: "$itens.quantidade" },
      faturamento: { $sum: { $multiply: [ "$itens.quantidade", "$itens.valorUnitario" ] } },
      qtdPedidos: { $addToSet: "$_id" }
  } },
  { $lookup: { from: "eventos", localField: "_id", foreignField: "_id", as: "evento" } },
  { $unwind: "$evento" },
  { $project: {
      _id: 0,
      eventoId: "$_id",
      titulo: "$evento.titulo",
      cidade: "$evento.cidade",
      ingressosVendidos: 1,
      faturamento: 1,
      qtdPedidos: { $size: "$qtdPedidos" }
  } },
  { $sort: { faturamento: -1 } }
]).forEach(printjson);

// 5.2 Total gasto por cliente, com nome, apenas clientes ativos
//     Estágios: $match -> $group -> $lookup -> $unwind -> $match -> $project -> $sort -> $limit
secao("5.2 Aggregation - top 5 clientes por valor gasto");
db.pedidos.aggregate([
  { $match: { status: "pago" } },
  { $group: { _id: "$clienteId", totalGasto: { $sum: "$valorTotal" }, pedidos: { $sum: 1 } } },
  { $lookup: { from: "clientes", localField: "_id", foreignField: "_id", as: "cliente" } },
  { $unwind: "$cliente" },
  { $match: { "cliente.ativo": true } },
  { $project: { _id: 0, clienteId: "$_id", nome: "$cliente.nome", cidade: "$cliente.endereco.cidade", totalGasto: 1, pedidos: 1 } },
  { $sort: { totalGasto: -1 } },
  { $limit: 5 }
]).forEach(printjson);

// 5.3 Ocupação (%) de cada evento a partir dos setores embutidos
//     Estágios: $unwind -> $group -> $project -> $sort
secao("5.3 Aggregation - ocupação (%) por evento");
db.eventos.aggregate([
  { $unwind: "$setores" },
  { $group: {
      _id: "$titulo",
      capacidade: { $sum: "$setores.capacidade" },
      vendidos: { $sum: "$setores.vendidos" }
  } },
  { $project: {
      _id: 0, titulo: "$_id", capacidade: 1, vendidos: 1,
      ocupacaoPct: { $round: [ { $multiply: [ { $divide: [ "$vendidos", "$capacidade" ] }, 100 ] }, 1 ] }
  } },
  { $sort: { ocupacaoPct: -1 } }
]).forEach(printjson);

// ---------------------------------------------------------------------
// 6. ÍNDICES
// ---------------------------------------------------------------------

// 6.1 Índice composto em pedidos { eventoId, status }
//     Beneficia: a consulta "pedidos pagos de um evento", usada na página
//     do organizador e no $match inicial da agregação 5.1. Sem índice o
//     MongoDB faz COLLSCAN (lê todos os pedidos); com índice faz IXSCAN.
secao("6.1 Índice composto pedidos { eventoId: 1, status: 1 }");
printjson(db.pedidos.createIndex({ eventoId: 1, status: 1 }, { name: "idx_pedidos_evento_status" }));

// 6.2 Índice composto em eventos { cidade, data }
//     Beneficia: a vitrine "eventos em uma cidade ordenados por data" (consulta 2.1).
secao("6.2 Índice composto eventos { cidade: 1, data: 1 }");
printjson(db.eventos.createIndex({ cidade: 1, data: 1 }, { name: "idx_eventos_cidade_data" }));

secao("6.3 Índices existentes");
printjson(db.pedidos.getIndexes().map(i => i.name));
printjson(db.eventos.getIndexes().map(i => i.name));

// 6.4 Prova de uso do índice com explain(): o plano vencedor deve ser IXSCAN
secao("6.4 explain() - consulta beneficiada pelo índice de pedidos");
const plano = db.pedidos.find({ eventoId: 8, status: "pago" }).explain("executionStats");
printjson({
  consulta: { eventoId: 8, status: "pago" },
  estagioVencedor: plano.queryPlanner.winningPlan.stage,
  estagioInterno: plano.queryPlanner.winningPlan.inputStage ? plano.queryPlanner.winningPlan.inputStage.stage : null,
  indiceUsado: plano.queryPlanner.winningPlan.inputStage ? plano.queryPlanner.winningPlan.inputStage.indexName : null,
  documentosExaminados: plano.executionStats.totalDocsExamined,
  chavesExaminadas: plano.executionStats.totalKeysExamined,
  documentosRetornados: plano.executionStats.nReturned
});

// Consulta que se beneficia do índice (a mesma do explain)
db.pedidos.find({ eventoId: 8, status: "pago" }, { _id: 1, clienteId: 1, valorTotal: 1 }).forEach(printjson);

secao("FIM DAS OPERAÇÕES");
