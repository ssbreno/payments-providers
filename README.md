# Sistema de Gateway de Pagamentos

Este projeto implementa uma solução robusta de gateway de pagamentos para e-commerce, atuando como intermediário entre a aplicação e provedores de pagamento externos (simulados neste projeto através de serviços mock). O sistema utiliza uma arquitetura resiliente com circuit breakers para gerenciar falhas nos provedores.

## Características

- **Processamento de Pagamentos**: Recebe informações de pedidos e processa pagamentos com provedores externos
- **Resiliência**: Alterna automaticamente entre provedores em caso de falha
- **Circuit Breaker**: Utiliza Opossum para detectar falhas e evitar cascata de erros
- **Mensageria**: Integração com Kafka para comunicação assíncrona e recuperação de falhas
- **Estorno de Pagamentos**: Suporte para estorno total ou parcial
- **Webhooks**: Comunicação assíncrona entre provedores e API principal
- **Consultas de Transações**: Obtenção de informações detalhadas sobre pagamentos
- **Monitoramento**: Status em tempo real dos provedores e circuit breakers

## Arquitetura

O sistema utiliza uma arquitetura de microserviços combinando:

- **Clean Architecture**: Separação clara entre domínio, aplicação e infraestrutura
- **Circuit Breaker Pattern**: Gerencia falhas dos provedores de pagamento usando Opossum
- **Event-Driven Architecture**: Usa Kafka para comunicação assíncrona
- **Padrão Repository**: Abstração para acesso a dados
- **Dependency Injection**: Inversão de controle para melhor testabilidade
- **Webhook Communication**: Para notificações assíncronas entre provedores e API

### Fluxo de Processamento de Pagamentos

1. A API recebe uma requisição de pagamento
2. O sistema verifica os provedores disponíveis usando circuit breakers
3. O processamento é tentado no provedor primário
4. Em caso de falha, o sistema alterna automaticamente para o provedor de backup
5. Os provedores notificam a API sobre mudanças de status através de webhooks
6. Eventos são publicados no Kafka durante todo o processo
7. Os consumidores do Kafka monitoram e controlam o estado dos circuit breakers

## Tecnologias Utilizadas

- **Backend**: NestJS + TypeScript
- **ORM**: Prisma
- **Banco de Dados**: PostgreSQL
- **Mensageria**: Kafka + KafkaJS
- **Circuit Breaker**: Opossum
- **HTTP Client**: Axios
- **Mocks**: Express (para simulação dos provedores de pagamento)
- **Containerização**: Docker + Docker Compose
- **Documentação API**: Swagger/OpenAPI

## Pré-requisitos

- Docker e Docker Compose
- Node.js 18+ (para desenvolvimento local)
- NPM ou Yarn
- Git

## Configuração

### Clonando o Repositório

```bash
git clone https://github.com/seu-usuario/payments-providers.git
cd payments-providers
```

### Variáveis de Ambiente

Configure as variáveis de ambiente:

```bash
cp .env.example .env
```

Edite o arquivo `.env` conforme necessário:

```
# API configuration
PORT=3000
API_PREFIX="/api/v1"
API_VERSION="1"
HOST="0.0.0.0"

# Environment
NODE_ENV=development

# Database
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/nestjs_db

# Kafka
KAFKA_BROKERS=kafka:9092

# Provedores de Pagamento
PROVIDER1_BASE_URL=http://provider1:3001
PROVIDER2_BASE_URL=http://provider2:3003

# Webhook da API (para receber notificações dos provedores)
API_WEBHOOK_URL=http://api:3000/api/v1/payments/webhook
```

> **Nota**: Observe que o Provedor 2 usa a porta 3003 para evitar conflitos de porta.

### Iniciando com Docker

Para iniciar todos os serviços:

```bash
# Construir as imagens
docker-compose build

# Iniciar os contêineres
docker-compose up -d
```

Isso iniciará:

- API de Pagamentos na porta 3000
- PostgreSQL na porta 5432
- Kafka na porta 9092
- Zookeeper na porta 2181
- Kafka UI na porta 8080
- Provedor 1 (mock) na porta 3001
- Provedor 2 (mock) na porta 3002

### Migrações do Banco de Dados

Para configurar o banco de dados:

```bash
# Executar dentro do contêiner da API
docker-compose exec api npx prisma migrate dev
```

## Executando o Projeto

Após iniciar todos os serviços, você pode acessar:

- **API de Pagamentos**: http://localhost:3000/api/v1
- **Documentação Swagger**: http://localhost:3000/docs
- **Kafka UI**: http://localhost:8080

## Testando os Provedores e Webhooks

### Verificar Saúde dos Provedores

```bash
# Verificar saúde do Provedor 1
curl http://localhost:3001/health

# Verificar saúde do Provedor 2
curl http://localhost:3003/health
```

### Registrar Webhooks nos Provedores

Os provedores precisam ser configurados com o endpoint de webhook da API para enviar notificações:

```bash
# Registrar webhook no Provedor 1
curl -X POST http://localhost:3001/webhooks \
  -H "Content-Type: application/json" \
  -d '{"url":"http://api:3000/api/v1/payments/webhook"}'

# Registrar webhook no Provedor 2
curl -X POST http://localhost:3003/webhooks \
  -H "Content-Type: application/json" \
  -d '{"url":"http://api:3000/api/v1/payments/webhook"}'
```

## Endpoints Principais

### API de Pagamentos

- **POST /api/v1/payments** - Criar um novo pagamento
- **GET /api/v1/payments/:id** - Buscar detalhes de um pagamento
- **POST /api/v1/payments/:id/refund** - Solicitar estorno de um pagamento
- **GET /api/v1/providers/health** - Verificar saúde dos provedores

### Exemplo de Criação de Pagamento

```bash
curl -X POST http://localhost:3000/api/v1/payments \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 100.00,
    "currency": "BRL",
    "description": "Compra de teste",
    "paymentMethod": {
      "type": "CREDIT_CARD",
      "card": {
        "number": "4111111111111111",
        "expMonth": 12,
        "expYear": 2025,
        "cvc": "123"
      }
    }
  }'
```

![image](https://github.com/user-attachments/assets/bd19580b-b313-4399-b514-979afc6ff5e2)

