import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { Consumer, Kafka } from 'kafkajs'
import { ConfigService } from '@nestjs/config'
import { KAFKA_TOPICS } from '@src/config/kafka.config'

@Injectable()
export class KafkaConsumerUseCase implements OnModuleInit {
  private readonly logger = new Logger(KafkaConsumerUseCase.name)
  private readonly consumers: Map<string, Consumer> = new Map()
  private readonly kafka: Kafka

  constructor(private readonly configService: ConfigService) {
    const brokers = this.configService.get<string>('KAFKA_BROKERS', 'localhost:9092').split(',')

    this.kafka = new Kafka({
      clientId: 'payment-gateway-consumer',
      brokers,
    })
  }

  async onModuleInit() {
    await this.createConsumer(KAFKA_TOPICS.PAYMENT_FAILURE)
    await this.createConsumer(KAFKA_TOPICS.PROVIDER_STATUS)
    await this.createConsumer(KAFKA_TOPICS.CIRCUIT_CONTROL)

    this.logger.log('Kafka consumers initialized')
  }

  async createConsumer(topic: string, groupId?: string): Promise<Consumer> {
    const consumerGroupId = groupId || `payment-gateway-${topic}-group`

    const consumer = this.kafka.consumer({
      groupId: consumerGroupId,
      allowAutoTopicCreation: true,
    })

    await consumer.connect()
    await consumer.subscribe({ topic, fromBeginning: false })

    this.consumers.set(topic, consumer)
    this.logger.log(`Kafka consumer connected to topic: ${topic}`)

    return consumer
  }

  async consume(
    topic: string,
    handler: (message: any) => Promise<void>,
    groupId?: string,
  ): Promise<void> {
    let consumer = this.consumers.get(topic)

    if (!consumer) {
      consumer = await this.createConsumer(topic, groupId)
    }

    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          const messageValue = message.value ? message.value.toString() : ''
          let parsedMessage

          try {
            parsedMessage = JSON.parse(messageValue)
          } catch (error) {
            parsedMessage = messageValue
          }

          this.logger.debug(`Received message from topic ${topic}: ${messageValue}`)

          await handler(parsedMessage)
        } catch (error) {
          this.logger.error(
            `Error processing message from topic ${topic}: ${error.message}`,
            error.stack,
          )
        }
      },
    })

    this.logger.log(`Kafka consumer for topic ${topic} is running`)
  }

  async onModuleDestroy() {
    for (const [topic, consumer] of this.consumers.entries()) {
      try {
        await consumer.disconnect()
        this.logger.log(`Kafka consumer for topic ${topic} disconnected`)
      } catch (error) {
        this.logger.error(`Error disconnecting consumer for topic ${topic}: ${error.message}`)
      }
    }
  }
}
