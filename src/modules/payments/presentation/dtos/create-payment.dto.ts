import { ApiProperty } from '@nestjs/swagger'
import {
  IsNotEmpty,
  IsNumber,
  IsString,
  ValidateNested,
  Min,
  MaxLength,
  Length,
  IsIn,
} from 'class-validator'
import { Type } from 'class-transformer'

export class CardDto {
  @ApiProperty({ example: '4111111111111111' })
  @IsNotEmpty()
  @IsString()
  number: string

  @ApiProperty({ example: 'John Doe' })
  @IsNotEmpty()
  @IsString()
  holder: string

  @ApiProperty({ example: '123' })
  @IsNotEmpty()
  @IsString()
  @Length(3, 4)
  cvv: string

  @ApiProperty({ example: '12/25' })
  @IsNotEmpty()
  @IsString()
  expiration: string

  @ApiProperty({ example: 1 })
  @IsNumber()
  @Min(1)
  installments: number
}

export class CreatePaymentDto {
  @ApiProperty({ example: 100.5 })
  @IsNumber()
  @Min(0.01)
  amount: number

  @ApiProperty({ example: 'USD', description: 'Currency code in ISO 4217 format' })
  @IsString()
  @Length(3)
  currency: string

  @ApiProperty({ example: 'Order #12345' })
  @IsString()
  @MaxLength(255)
  description: string

  @ApiProperty()
  @ValidateNested()
  @Type(() => CardDto)
  card: CardDto
}
