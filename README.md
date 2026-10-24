# Trabalho Prático BD2 - MongoDB e Redis

**Instituto Federal de Minas Gerais - Campus Ouro Preto**
Disciplina: Banco de Dados 2 - Curso: Análise e Desenvolvimento de Sistemas
Aluno: Gabriel Augusto Ferreira Borges 

**Cenário escolhido: plataforma de venda de ingressos para eventos.**

A plataforma cadastra eventos (shows, teatro, esporte, congressos), seus setores de ingresso
(com preço e capacidade), os clientes e os pedidos de compra. O recorte do trabalho é:
**catálogo de eventos, pedidos de ingressos e a experiência de compra em tempo real**
(sessão, reserva temporária de ingresso, fila de pagamento, ranking de eventos mais vendidos).

| Necessidade | Banco | Por quê 
|---|---|---|
| Eventos, setores, clientes e pedidos (histórico permanente) | **MongoDB** | documentos ricos, embutidos e referências, consultas e agregações, índices |
| Sessão de login, reserva de ingresso com prazo, cache da página do evento | **Redis (string + TTL)** | dado temporário que precisa expirar sozinho |
| Resumo rápido do evento / do cliente | **Redis (hash)** | leitura em memória, sem ir ao MongoDB |
| Eventos mais vendidos e mais acessados | **Redis (sorted set)** | ranking ordenado por pontuação, atualizado a cada venda |
| Fila de pedidos aguardando pagamento, histórico recente | **Redis (list)** | FIFO e lista limitada |
| Clientes online, favoritos | **Redis (set)** | conjunto sem repetição |

## 2. Ferramentas utilizadas

| Ferramenta | Versão usada | Uso |
|---|---|---|
| MongoDB Community Server | 8.3 | banco de documentos |
| mongosh | 2.x | execução dos scripts `.js` e demonstração |
| Redis (Memurai for Redis no Windows / redis-server no Linux) | compatível com Redis 7+ | estruturas em memória |
| redis-cli / memurai-cli | - | execução dos comandos do Redis |
| MongoDB Compass e RedisInsight (opcional) | - | inspeção visual durante a apresentação |
| PowerShell 5.1+ | - | scripts que automatizam os fluxos conjuntos |

Nenhum arquivo contém senhas, tokens ou endereços privados. Os bancos são acessados em
`localhost` com as portas padrão (MongoDB 27017, Redis 6379).

## 3. Estrutura da entrega

```
trabalho_bd2_ingressos/
|-- README.md                     <- este arquivo
|-- relatorio.pdf                 <- relatório curto
|-- slides.pdf                    <- slides da apresentação
|-- mongodb/
|   |-- 01_dados.js               <- cria e popula as coleções (28 documentos)
|   |-- 02_operacoes.js           <- CRUD, consultas, aggregation e índices
|-- redis/
|   |-- comandos_redis.txt        <- comandos do Redis na ordem da demonstração
|   |-- executar_redis.ps1        <- executa o .txt no redis-cli mostrando comando e resposta
|-- fluxos/
|   |-- _comum.ps1                <- funções auxiliares (localiza mongosh e redis-cli)
|   |-- fluxo_cache.ps1           <- fluxo 1: cache miss -> MongoDB -> SETEX -> hit -> TTL
|   |-- fluxo_pedido.ps1          <- fluxo 2: reserva -> pedido -> fila -> pagamento -> ranking
|-- evidencias/
|   |-- log_*.txt                 <- saídas reais do mongosh e do redis-cli
|   |-- mongo_*.png               <- capturas das operações do MongoDB
|   |-- redis_*.png               <- capturas das estruturas do Redis
|   |-- fluxo_cache.png           <- captura do fluxo de cache
|   |-- fluxo_pedido.png          <- captura do segundo fluxo
|-- fontes/
    |-- relatorio.html, slides.html   <- fontes dos PDFs
    |-- gerar_evidencias.ps1          <- gera as imagens a partir dos logs
    |-- gerar_pdfs.ps1                <- gera relatorio.pdf e slides.pdf
```

## 4. Nomes do banco, coleções e padrão das chaves

**Banco MongoDB:** `ingressos_bd2`

| Coleção | Documentos | Conteúdo | Estratégia |
|---|---|---|---|
| `eventos` | 8 | título, categoria, data, cidade, `local` (embutido), `setores[]` (embutido: nome, preço, capacidade, vendidos), tags, status | documentos embutidos |
| `clientes` | 8 (+1 inserido na demo) | nome, e-mail, telefone, `endereco` (embutido), `preferencias[]`, ativo | documento embutido |
| `pedidos` | 12 (+2 inseridos na demo) | `clienteId` e `eventoId` (**referências**), data, status, forma de pagamento, `itens[]` (embutido), valorTotal | referências + embutidos |

**Padrão das chaves do Redis:** `<tipo>:<entidade>:<id>[:<detalhe>]`

| Chave | Estrutura | Significado |
|---|---|---|
| `sessao:cliente:<id>` | string + TTL 1800 s | sessão de login do cliente |
| `reserva:evento:<id>:cliente:<id>` | string + TTL 600 s | ingressos segurados no checkout |
| `codigo:confirmacao:cliente:<id>` | string + TTL 120 s | código temporário enviado por e-mail |
| `cache:evento:<id>` | string + TTL 300 s | cache da página do evento (fluxo 1) |
| `resumo:evento:<id>`, `resumo:cliente:<id>` | hash | resumo rápido da entidade |
| `ranking:eventos:vendas` | sorted set | eventos ordenados por ingressos vendidos |
| `ranking:eventos:acessos` | sorted set | eventos ordenados por visualizações |
| `fila:pedidos:pagamento` | list | fila FIFO de pedidos aguardando pagamento (fluxo 2) |
| `historico:cliente:<id>` | list (LTRIM 0 4) | últimos 5 eventos visitados |
| `online:clientes` | set | clientes conectados agora |
| `favoritos:cliente:<id>` | set | eventos favoritados |
| `contador:acessos:evento:<id>` | string numérica (INCR) | visualizações da página |

## 5. Ordem de execução

Pré-requisitos: MongoDB e Redis (ou Memurai) em execução em `localhost`, `mongosh` e
`redis-cli`/`memurai-cli` acessíveis no PATH. Execute os comandos **a partir da pasta raiz** da entrega.

```bash
# 1) Carga do MongoDB (cria o banco ingressos_bd2 e as 3 coleções - pode ser repetido)
mongosh mongodb/01_dados.js
```

```bash
# 2) Operações do MongoDB: inserção, consultas, atualização, desativação/exclusão, aggregation e índices
mongosh mongodb/02_operacoes.js
```

```bash
# 3) Estruturas do Redis (string com TTL, hash, sorted set, list, set, contador)
powershell -ExecutionPolicy Bypass -File redis/executar_redis.ps1
```

```bash
# 4) Fluxo 1 - cache: miss -> consulta no MongoDB -> SETEX com TTL -> hit -> TTL
powershell -ExecutionPolicy Bypass -File fluxos/fluxo_cache.ps1
```

```bash
# 5) Fluxo 2 - pedido: reserva temporária -> pedido no MongoDB -> fila -> pagamento -> ranking -> invalidação do cache
powershell -ExecutionPolicy Bypass -File fluxos/fluxo_pedido.ps1
```

Sem PowerShell (Linux/macOS), abra `redis-cli` e digite os comandos de `redis/comandos_redis.txt`
na ordem em que aparecem; as linhas iniciadas por `#` indicam o que executar no `mongosh`.

## 6. Como reproduzir a demonstração na apresentação

1. Abrir dois terminais: um com `mongosh ingressos_bd2` e outro com `redis-cli` (ou `memurai-cli`).
2. Restaurar o ambiente rapidamente: `mongosh mongodb/01_dados.js` e, no redis-cli, `FLUSHDB`.
3. **MongoDB** (arquivo `02_operacoes.js`, copiar os blocos desejados):
   - consulta com operador: bloco 2.2 (`$elemMatch` + `$lte`) ou 2.3 (`$in` + `$gte`);
   - Aggregation Pipeline: bloco 5.1 (faturamento por evento, 7 estágios);
   - inserção/atualização/desativação: blocos 1, 3.1, 4.1;
   - índice e consulta relacionada: bloco 6 (`createIndex` + `explain()` mostrando `IXSCAN`).
4. **Redis** (arquivo `comandos_redis.txt`): seções 1 (string com TTL), 2 (hash), 3 (sorted set), 4 (list), 5 (set).
5. **Fluxo de cache**: seção 7 do `comandos_redis.txt` alternando com o `mongosh`, ou `fluxos/fluxo_cache.ps1`.
6. **Segundo fluxo**: seção 8 do `comandos_redis.txt` alternando com o `mongosh`, ou `fluxos/fluxo_pedido.ps1`.
7. Mostrar no MongoDB Compass o documento `pedidos/_id: 14` e no RedisInsight a chave `ranking:eventos:vendas`.

Para regenerar as evidências e os PDFs após alterações:

```bash
powershell -ExecutionPolicy Bypass -File fontes/gerar_evidencias.ps1
```

```bash
powershell -ExecutionPolicy Bypass -File fontes/gerar_pdfs.ps1
```

## 7. Desafio opcional em PHP

Não realizado nesta entrega (o projeto-base em PHP não foi utilizado).

## 8. Ferramentas de apoio

Documentação oficial do MongoDB e do Redis, mongosh, Memurai e um assistente de IA (Claude)
para revisão do texto e organização dos arquivos. Todos os comandos foram executados e
revisados pelo grupo; as evidências em `evidencias/` são as saídas reais dessas execuções.
