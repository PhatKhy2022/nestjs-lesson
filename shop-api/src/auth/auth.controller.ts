import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { CreateUserDto } from '../users/dto/create-user.dto.js';
import { AuthService } from './auth.service.js';
import { LoginDto } from './dto/login.dto.js';
import { Public } from './public.decorator.js';

// The security desk's counter: get a badge (register) and show your ID to receive a token (login).
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register') // POST /api/auth/register → 201 Created
  register(@Body() dto: CreateUserDto) {
    return this.authService.register(dto);
  }

  @Public()
  @Post('login') // POST /api/auth/login
  @HttpCode(200) // logging in creates nothing, so 200 instead of POST's default 201
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }
}
