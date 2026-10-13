import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Patch,
  Query,
} from '@nestjs/common';
import { AdminOnly } from '../auth/auth.decorator.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { UsersService } from './users.service.js';

// HR's front desk: receives the request, passes it to HR staff (UsersService), hands back the answer.
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // 'me' routes are declared above ':id', otherwise GET /users/me would try to parse "me" as an id.
  @Get('me') // GET /api/users/me
  me(@CurrentUser('sub') userId: number) {
    return this.usersService.findOne(userId);
  }

  @Patch('me') // PATCH /api/users/me
  updateMe(@CurrentUser('sub') userId: number, @Body() dto: UpdateUserDto) {
    return this.usersService.update(userId, dto);
  }

  @AdminOnly()
  @Get() // GET /api/users?page=2
  findAll(@Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number) {
    return this.usersService.findAll(page);
  }

  @AdminOnly()
  @Get(':id') // GET /api/users/42
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findOne(id);
  }

  @AdminOnly()
  @Delete(':id') // DELETE /api/users/42
  @HttpCode(204) // no content
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.remove(id);
  }
}
