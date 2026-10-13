import { SetMetadata } from '@nestjs/common';

// Every route needs a badge (JWT) by default. @Public() puts a route in the lobby: no badge needed.
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
