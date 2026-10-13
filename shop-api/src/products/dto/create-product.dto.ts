import {
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Length,
  Min,
} from 'class-validator';

export class CreateProductDto {
  @IsString()
  @Length(1, 32)
  sku!: string;

  @IsString()
  @Length(2, 200)
  name!: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  price!: number;

  // No `= 0` default here: PartialType copies defaults into UpdateProductDto, so
  // PATCH { price } would silently reset stock to 0. The database default (0) applies instead.
  @IsOptional()
  @IsInt()
  @Min(0)
  stock?: number;
}
