import { HttpException, HttpStatus } from '@nestjs/common';

// A business error with its own machine-readable code, so a frontend can show "only 3 left".
export class InsufficientStockException extends HttpException {
  constructor(productId: number, available: number) {
    super(
      {
        code: 'INSUFFICIENT_STOCK',
        message: `Only ${available} left`,
        productId,
      },
      HttpStatus.CONFLICT, // 409
    );
  }
}
