import { ApiProperty } from '@nestjs/swagger'
import { IsNumber, Min } from 'class-validator'

export class RefundPaymentDto {
  @ApiProperty({ example: 100.5 })
  @IsNumber()
  @Min(0.01)
  amount: number
}
