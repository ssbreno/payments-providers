# Sistema de Gateway de Pagamentos

Este projeto implementa uma solução robusta de gateway de pagamentos para e-commerce, atuando como intermediário entre a aplicação e provedores de pagamento externos como Stripe e Braintree (simulados neste projeto).

## 🚀 Características

- **Processamento de Pagamentos**: Recebe informações de pedidos e processa pagamentos com provedores externos
- **Resiliência**: Alterna automaticamente entre provedores em caso de falha
- **Circuit Breaker**: Utiliza Opossum para detectar falhas e evitar cascata de erros
- **Mensageria**: Integração com Kafka para comunicação assíncrona e recuperação de falhas
- **Estorno de Pagamentos**: Suporte para estorno total ou parcial
- **Consultas de Transações**: Obtenção de informações detalhadas sobre pagamentos
- **Monitoramento**: Status em tempo real dos provedores e circuit breakers

## 🏗️ Arquitetura

O sistema utiliza uma arquitetura de microserviços combinando:

- **Clean Architecture**: Separação clara entre domínio, aplicação e infraestrutura
- **Circuit Breaker Pattern**: Gerencia falhas dos provedores de pagamento
- **Event-Driven Architecture**: Usa Kafka para comunicação assíncrona
- **Padrão Repository**: Abstração para acesso a dados
- **Dependency Injection**: Inversão de controle para melhor testabilidade

### Fluxo de Processamento de Pagamentos

1. A API recebe uma requisição de pagamento
2. O sistema verifica os provedores disponíveis
3. O processamento é tentado no provedor primário
4. Em caso de falha, o sistema alterna automaticamente para o provedor de backup
5. Eventos são publicados no Kafka durante todo o processo
6. Os consumidores do Kafka controlam o estado dos circuit breakers

## 🛠️ Tecnologias Utilizadas

- **Backend**: NestJS + TypeScript
- **ORM**: Prisma
- **Banco de Dados**: PostgreSQL
- **Mensageria**: Kafka + KafkaJS
- **Circuit Breaker**: Opossum
- **Containerização**: Docker + Docker Compose
- **Documentação API**: Swagger/OpenAPI

## 📋 Pré-requisitos

- Docker e Docker Compose
- Node.js 18+ (para desenvolvimento local)
- NPM ou Yarn
- Git

## 🔧 Configuração

### Variáveis de Ambiente

Clone o repositório e configure as variáveis de ambiente:

```bash
git clone https://github.com/seu-usuario/payment-gateway.git
cd payment-gateway
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
PROVIDER2_BASE_URL=http://provider2:3002
```

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

## 🚀 Executando o Projeto

Após iniciar todos os serviços, você pode acessar:

- **API de Pagamentos**: http://localhost:3000/api/v1
- **Documentação Swagger**: http://localhost:3000/docs
- **Kafka UI**: http://localhost:8080

flowchart TD
subgraph "Aplicação de E-commerce"
Client[Cliente]
end

    subgraph "API Gateway de Pagamentos"
        API[API NestJS] --> UseCases[Casos de Uso]
        UseCases --> Repositories[Repositórios]
        Repositories --> DB[(PostgreSQL)]
        API --> CircuitBreaker[Circuit Breaker\nOpossum]
        WebhookHandler[Webhook Handler] --> UseCases
    end

    subgraph "Mensageria"
        Kafka[Apache Kafka] <--> CircuitControl[Circuit Control\nService]
        Kafka <--> PaymentEvents[Payment Events\nService]
        CircuitControl <--> CircuitBreaker
    end

    subgraph "Provedores de Pagamento"
        Provider1[Provedor 1\nMock]
        Provider2[Provedor 2\nMock]
    end

    Client --> API
    CircuitBreaker --> Provider1
    CircuitBreaker --> Provider2

    %% Webhook connections
    Provider1 -->|Webhook\nStatus Updates| WebhookHandler
    Provider2 -->|Webhook\nStatus Updates| WebhookHandler

    class Client,API,Kafka,Provider1,Provider2 emphasis
    class CircuitBreaker,CircuitControl accent
    class WebhookHandler,Provider1,Provider2 webhook

    classDef webhook fill:#f96,stroke:#333,stroke-width:2px
