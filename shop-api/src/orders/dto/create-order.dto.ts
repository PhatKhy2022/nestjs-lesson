import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  Max,
  MaxLength,
  ValidateNested,
} from 'class-validator';

export class OrderItemDto {
  @IsInt()
  @IsPositive()
  productId!: number;

  @IsInt()
  @IsPositive()
  @Max(100)
  quantity!: number;
}

export class CreateOrderDto {
  @ValidateNested({ each: true }) // validate each nested object…
  @Type(() => OrderItemDto) // …after turning plain objects into OrderItemDto instances
  @ArrayMinSize(1)
  items!: OrderItemDto[];

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
