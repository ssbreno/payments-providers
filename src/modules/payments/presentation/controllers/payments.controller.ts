import { Controller, Post, Body, Get, Param, HttpStatus, HttpCode } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger'
import { CreatePaymentUseCase } from '../../application/use-cases/create-payment.use-case'
import { GetPaymentUseCase } from '../../application/use-cases/get-payment.use-case'
import { RefundPaymentUseCase } from '../../application/use-cases/refund-payment.use-case'
import { CreatePaymentDto } from '../dtos/create-payment.dto'
import { RefundPaymentDto } from '../dtos/refund-payment.dto'
import { PaymentResponseDto } from '../dtos/payment-response.dto'

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly createPaymentUseCase: CreatePaymentUseCase,
    private readonly getPaymentUseCase: GetPaymentUseCase,
    private readonly refundPaymentUseCase: RefundPaymentUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Process a new payment' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Payment processed successfully',
    type: PaymentResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid payment data',
  })
  @ApiResponse({
    status: HttpStatus.SERVICE_UNAVAILABLE,
    description: 'Payment processing service unavailable',
  })
  async createPayment(@Body() createPaymentDto: CreatePaymentDto): Promise<PaymentResponseDto> {
    const payment = await this.createPaymentUseCase.execute(createPaymentDto)
    return new PaymentResponseDto(payment)
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get payment details' })
  @ApiParam({ name: 'id', description: 'Payment ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Payment details retrieved successfully',
    type: PaymentResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Payment not found',
  })
  async getPayment(@Param('id') id: string): Promise<PaymentResponseDto> {
    const payment = await this.getPaymentUseCase.execute(id)
    return new PaymentResponseDto(payment)
  }

  @Post(':id/refunds')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refund a payment' })
  @ApiParam({ name: 'id', description: 'Payment ID to refund' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Payment refunded successfully',
    type: PaymentResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Payment not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid refund request or payment cannot be refunded',
  })
  @ApiResponse({
    status: HttpStatus.SERVICE_UNAVAILABLE,
    description: 'Refund processing service unavailable',
  })
  async refundPayment(
    @Param('id') id: string,
    @Body() refundPaymentDto: RefundPaymentDto,
  ): Promise<PaymentResponseDto> {
    const payment = await this.refundPaymentUseCase.execute({
      paymentId: id,
      data: refundPaymentDto,
    })
    return new PaymentResponseDto(payment)
  }
}
