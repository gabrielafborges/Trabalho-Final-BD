// =====================================================================
//  Trabalho Prático BD2 - MongoDB e Redis
//  Cenário: Plataforma de venda de ingressos para eventos
//  Arquivo 1/2: criação e carga inicial das coleções
//
//  Execução:  mongosh mongodb/01_dados.js
// =====================================================================

db = db.getSiblingDB("ingressos_bd2");

// Ambiente limpo para a demonstração poder ser repetida
db.eventos.drop();
db.clientes.drop();
db.pedidos.drop();

// ---------------------------------------------------------------------
// Coleção EVENTOS
// - "local" e "setores" são DOCUMENTOS EMBUTIDOS: pertencem ao evento,
//   são lidos sempre junto com ele e não fazem sentido isoladamente.
// ---------------------------------------------------------------------
db.eventos.insertMany([
  {
    _id: 1,
    titulo: "Festival Som da Serra",
    categoria: "Show",
    data: ISODate("2026-09-12T20:00:00Z"),
    cidade: "Ouro Preto",
    local: { nome: "Parque Metalúrgico", capacidade: 1700 },
    setores: [
      { nome: "Pista",    preco: 120, capacidade: 1500, vendidos: 834 },
      { nome: "Camarote", preco: 280, capacidade: 200,  vendidos: 143 }
    ],
    tags: ["musica", "festival", "ao ar livre"],
    status: "ativo"
  },
  {
    _id: 2,
    titulo: "O Auto da Compadecida",
    categoria: "Teatro",
    data: ISODate("2026-08-30T19:30:00Z"),
    cidade: "Belo Horizonte",
    local: { nome: "Teatro Municipal", capacidade: 600 },
    setores: [
      { nome: "Plateia",  preco: 90,  capacidade: 450, vendidos: 398 },
      { nome: "Balcão",   preco: 60,  capacidade: 150, vendidos: 150 }
    ],
    tags: ["teatro", "comedia", "classico"],
    status: "ativo"
  },
  {
    _id: 3,
    titulo: "Stand-up: Comédia das Minas",
    categoria: "Humor",
    data: ISODate("2026-09-05T21:00:00Z"),
    cidade: "Mariana",
    local: { nome: "Centro de Convenções", capacidade: 400 },
    setores: [
      { nome: "Único", preco: 50, capacidade: 400, vendidos: 212 }
    ],
    tags: ["humor", "stand-up"],
    status: "ativo"
  },
  {
    _id: 4,
    titulo: "Congresso de Tecnologia IFMG",
    categoria: "Tecnologia",
    data: ISODate("2026-10-20T08:00:00Z"),
    cidade: "Ouro Preto",
    local: { nome: "Auditório do Campus", capacidade: 300 },
    setores: [
      { nome: "Inteira", preco: 80, capacidade: 200, vendidos: 95 },
      { nome: "Meia",    preco: 40, capacidade: 100, vendidos: 88 }
    ],
    tags: ["tecnologia", "academico", "palestras"],
    status: "ativo"
  },
  {
    _id: 5,
    titulo: "Atlético x Cruzeiro - Campeonato Mineiro",
    categoria: "Esporte",
    data: ISODate("2026-09-20T16:00:00Z"),
    cidade: "Belo Horizonte",
    local: { nome: "Arena MRV", capacidade: 46000 },
    setores: [
      { nome: "Arquibancada", preco: 90,  capacidade: 40000, vendidos: 31250 },
      { nome: "Cadeira",      preco: 180, capacidade: 6000,  vendidos: 4120 }
    ],
    tags: ["futebol", "classico", "esporte"],
    status: "ativo"
  },
  {
    _id: 6,
    titulo: "Orquestra Sinfônica - Noite Clássica",
    categoria: "Música Clássica",
    data: ISODate("2026-11-07T20:00:00Z"),
    cidade: "Ouro Preto",
    local: { nome: "Igreja de São Francisco", capacidade: 350 },
    setores: [
      { nome: "Nave",  preco: 150, capacidade: 250, vendidos: 61 },
      { nome: "Coro",  preco: 220, capacidade: 100, vendidos: 17 }
    ],
    tags: ["musica", "classica", "orquestra"],
    status: "ativo"
  },
  {
    _id: 7,
    titulo: "Festa Junina do Campus",
    categoria: "Festa",
    data: ISODate("2026-06-20T18:00:00Z"),
    cidade: "Ouro Preto",
    local: { nome: "Quadra do Campus", capacidade: 800 },
    setores: [
      { nome: "Único", preco: 20, capacidade: 800, vendidos: 800 }
    ],
    tags: ["festa", "junina", "comunidade"],
    status: "encerrado"
  },
  {
    _id: 8,
    titulo: "Rock in Minas 2026",
    categoria: "Show",
    data: ISODate("2026-12-05T18:00:00Z"),
    cidade: "Belo Horizonte",
    local: { nome: "Mineirão", capacidade: 60000 },
    setores: [
      { nome: "Pista",         preco: 200, capacidade: 40000, vendidos: 18760 },
      { nome: "Pista Premium", preco: 350, capacidade: 15000, vendidos: 9020 },
      { nome: "Camarote",      preco: 600, capacidade: 5000,  vendidos: 1480 }
    ],
    tags: ["musica", "rock", "festival"],
    status: "ativo"
  }
]);

// ---------------------------------------------------------------------
// Coleção CLIENTES
// - "endereco" é DOCUMENTO EMBUTIDO (1 para 1, sempre lido junto).
// - "preferencias" é um array simples usado em consultas de recomendação.
// ---------------------------------------------------------------------
db.clientes.insertMany([
  { _id: 1, nome: "Ana Souza",        email: "ana.souza@email.com",       telefone: "(31) 99999-0001",
    endereco: { cidade: "Ouro Preto", uf: "MG" },      preferencias: ["Show", "Teatro"],
    dataCadastro: ISODate("2025-03-10T10:00:00Z"), ativo: true },
  { _id: 2, nome: "Bruno Lima",       email: "bruno.lima@email.com",      telefone: "(31) 99999-0002",
    endereco: { cidade: "Belo Horizonte", uf: "MG" },  preferencias: ["Esporte"],
    dataCadastro: ISODate("2025-05-22T14:30:00Z"), ativo: true },
  { _id: 3, nome: "Carla Mendes",     email: "carla.mendes@email.com",    telefone: "(31) 99999-0003",
    endereco: { cidade: "Mariana", uf: "MG" },         preferencias: ["Humor", "Show", "Festa"],
    dataCadastro: ISODate("2025-07-01T09:15:00Z"), ativo: true },
  { _id: 4, nome: "Diego Ferreira",   email: "diego.ferreira@email.com",  telefone: "(31) 99999-0004",
    endereco: { cidade: "Ouro Preto", uf: "MG" },      preferencias: ["Tecnologia", "Música Clássica"],
    dataCadastro: ISODate("2025-08-14T16:45:00Z"), ativo: true },
  { _id: 5, nome: "Eduarda Castro",   email: "eduarda.castro@email.com",  telefone: "(31) 99999-0005",
    endereco: { cidade: "Belo Horizonte", uf: "MG" },  preferencias: ["Teatro", "Música Clássica"],
    dataCadastro: ISODate("2025-10-02T11:00:00Z"), ativo: true },
  { _id: 6, nome: "Felipe Rocha",     email: "felipe.rocha@email.com",    telefone: "(31) 99999-0006",
    endereco: { cidade: "Itabirito", uf: "MG" },       preferencias: ["Show", "Esporte"],
    dataCadastro: ISODate("2026-01-18T19:20:00Z"), ativo: true },
  { _id: 7, nome: "Gabriela Nunes",   email: "gabriela.nunes@email.com",  telefone: "(31) 99999-0007",
    endereco: { cidade: "Ouro Preto", uf: "MG" },      preferencias: ["Festa", "Humor"],
    dataCadastro: ISODate("2026-02-25T08:40:00Z"), ativo: true },
  { _id: 8, nome: "Henrique Alves",   email: "henrique.alves@email.com",  telefone: "(31) 99999-0008",
    endereco: { cidade: "Belo Horizonte", uf: "MG" },  preferencias: ["Show"],
    dataCadastro: ISODate("2026-04-05T13:10:00Z"), ativo: false }
]);

// ---------------------------------------------------------------------
// Coleção PEDIDOS
// - "clienteId" e "eventoId" são REFERÊNCIAS (evita duplicar cliente e
//   evento em cada pedido e permite atualizá-los em um único lugar).
// - "itens" é EMBUTIDO: os ingressos do pedido só existem dentro dele.
//   O valorUnitario é copiado no momento da compra (preço histórico).
// ---------------------------------------------------------------------
db.pedidos.insertMany([
  { _id: 1,  clienteId: 1, eventoId: 1, dataPedido: ISODate("2026-07-02T10:12:00Z"), status: "pago",
    formaPagamento: "pix",    itens: [ { setor: "Pista", quantidade: 2, valorUnitario: 120 } ], valorTotal: 240 },
  { _id: 2,  clienteId: 2, eventoId: 5, dataPedido: ISODate("2026-07-03T18:40:00Z"), status: "pago",
    formaPagamento: "cartao", itens: [ { setor: "Cadeira", quantidade: 2, valorUnitario: 180 } ], valorTotal: 360 },
  { _id: 3,  clienteId: 3, eventoId: 3, dataPedido: ISODate("2026-07-05T09:05:00Z"), status: "pago",
    formaPagamento: "pix",    itens: [ { setor: "Único", quantidade: 4, valorUnitario: 50 } ], valorTotal: 200 },
  { _id: 4,  clienteId: 4, eventoId: 4, dataPedido: ISODate("2026-07-06T15:30:00Z"), status: "pago",
    formaPagamento: "boleto", itens: [ { setor: "Inteira", quantidade: 1, valorUnitario: 80 },
                                       { setor: "Meia",    quantidade: 1, valorUnitario: 40 } ], valorTotal: 120 },
  { _id: 5,  clienteId: 5, eventoId: 2, dataPedido: ISODate("2026-07-08T11:00:00Z"), status: "pago",
    formaPagamento: "cartao", itens: [ { setor: "Plateia", quantidade: 2, valorUnitario: 90 } ], valorTotal: 180 },
  { _id: 6,  clienteId: 6, eventoId: 8, dataPedido: ISODate("2026-07-10T20:15:00Z"), status: "pago",
    formaPagamento: "cartao", itens: [ { setor: "Pista Premium", quantidade: 2, valorUnitario: 350 } ], valorTotal: 700 },
  { _id: 7,  clienteId: 1, eventoId: 8, dataPedido: ISODate("2026-07-11T08:50:00Z"), status: "pendente",
    formaPagamento: "boleto", itens: [ { setor: "Pista", quantidade: 3, valorUnitario: 200 } ], valorTotal: 600 },
  { _id: 8,  clienteId: 7, eventoId: 7, dataPedido: ISODate("2026-06-10T12:00:00Z"), status: "pago",
    formaPagamento: "pix",    itens: [ { setor: "Único", quantidade: 5, valorUnitario: 20 } ], valorTotal: 100 },
  { _id: 9,  clienteId: 2, eventoId: 1, dataPedido: ISODate("2026-07-12T17:25:00Z"), status: "cancelado",
    formaPagamento: "cartao", itens: [ { setor: "Camarote", quantidade: 1, valorUnitario: 280 } ], valorTotal: 280 },
  { _id: 10, clienteId: 5, eventoId: 6, dataPedido: ISODate("2026-07-14T10:10:00Z"), status: "pago",
    formaPagamento: "pix",    itens: [ { setor: "Nave", quantidade: 2, valorUnitario: 150 } ], valorTotal: 300 },
  { _id: 11, clienteId: 6, eventoId: 5, dataPedido: ISODate("2026-07-15T21:45:00Z"), status: "pago",
    formaPagamento: "pix",    itens: [ { setor: "Arquibancada", quantidade: 4, valorUnitario: 90 } ], valorTotal: 360 },
  { _id: 12, clienteId: 8, eventoId: 8, dataPedido: ISODate("2026-07-16T13:30:00Z"), status: "pago",
    formaPagamento: "cartao", itens: [ { setor: "Camarote", quantidade: 1, valorUnitario: 600 },
                                       { setor: "Pista",    quantidade: 1, valorUnitario: 200 } ], valorTotal: 800 }
]);

// ---------------------------------------------------------------------
// Conferência da carga
// ---------------------------------------------------------------------
print("Banco   :", db.getName());
print("eventos :", db.eventos.countDocuments());
print("clientes:", db.clientes.countDocuments());
print("pedidos :", db.pedidos.countDocuments());
print("TOTAL   :", db.eventos.countDocuments() + db.clientes.countDocuments() + db.pedidos.countDocuments(), "documentos");
