import { KafkaOptions, Transport } from '@nestjs/microservices'
import { ConfigService } from '@nestjs/config'

export const KAFKA_TOPICS = {
  PAYMENT_PROCESSING: 'payment.processing',
  PAYMENT_SUCCESS: 'payment.success',
  PAYMENT_FAILURE: 'payment.failure',
  PAYMENT_RETRY: 'payment.retry',
  PAYMENT_RECOVERY: 'payment.recovery',
  PROVIDER_STATUS: 'provider.status',
  CIRCUIT_CONTROL: 'circuit.control',
}

export const kafkaConfig = (configService: ConfigService): KafkaOptions => {
  const brokers = configService.get<string>('KAFKA_BROKERS', 'localhost:9092').split(',')

  return {
    transport: Transport.KAFKA,
    options: {
      client: {
        clientId: 'payment-gateway',
        brokers,
      },
      consumer: {
        groupId: 'payment-gateway-consumer',
        allowAutoTopicCreation: true,
      },
      producer: {
        allowAutoTopicCreation: true,
      },
    },
  }
}
