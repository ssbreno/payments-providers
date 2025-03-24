import { ApiProperty } from '@nestjs/swagger'
import { PaymentEntity } from '../../domain/entites/payment.entity'
import { PaymentMethod } from '../../domain/enums/payment-method.enum'
import { PaymentStatus } from '../../domain/enums/payment-status.enum'

export class PaymentResponseDto {
  @ApiProperty()
  id: string

  @ApiProperty()
  amount: number

  @ApiProperty()
  currency: string

  @ApiProperty()
  description: string

  @ApiProperty({ enum: PaymentStatus })
  status: PaymentStatus

  @ApiProperty({ enum: PaymentMethod })
  paymentMethod: PaymentMethod

  @ApiProperty()
  createdAt: Date

  @ApiProperty()
  updatedAt: Date

  @ApiProperty({ required: false })
  currentAmount?: number

  @ApiProperty({ required: false })
  originalAmount?: number

  constructor(payment: PaymentEntity) {
    this.id = payment.id
    this.amount = payment.amount
    this.currency = payment.currency
    this.description = payment.description
    this.status = payment.status
    this.paymentMethod = payment.paymentMethod
    this.createdAt = payment.createdAt
    this.updatedAt = payment.updatedAt
    this.currentAmount = payment.currentAmount
    this.originalAmount = payment.originalAmount
  }
}
