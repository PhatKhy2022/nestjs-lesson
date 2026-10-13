import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { OrderStatus } from '../../generated/prisma/client.js';

export class ListOrdersQueryDto {
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @Type(() => Number) // query strings are always text: "2" → 2
  @IsInt()
  @Min(1)
  page: number = 1;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 20;

  // Listed so the ValidationPipe allows it; ParseSortPipe in the controller does the real parsing.
  @IsOptional()
  @IsString()
  sort?: string;
}
