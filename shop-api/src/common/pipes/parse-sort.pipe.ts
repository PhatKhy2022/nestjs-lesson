import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';

export type Sort = { field: string; direction: 'asc' | 'desc' };

// A custom pipe: "?sort=-createdAt" → { field: 'createdAt', direction: 'desc' }.
// Only whitelisted fields are allowed, so users can't sort by columns you didn't plan for.
@Injectable()
export class ParseSortPipe implements PipeTransform<
  string | undefined,
  Sort | undefined
> {
  constructor(private readonly allowed: string[]) {}

  transform(
    value: string | undefined,
    _metadata: ArgumentMetadata,
  ): Sort | undefined {
    if (!value) return undefined;
    const direction = value.startsWith('-') ? 'desc' : 'asc';
    const field = value.replace(/^-/, '');
    if (!this.allowed.includes(field)) {
      throw new BadRequestException(`Cannot sort by "${field}"`);
    }
    return { field, direction };
  }
}
