import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule, type JwtSignOptions } from '@nestjs/jwt';
import { UsersModule } from '../users/users.module.js';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { JwtAuthGuard } from './jwt-auth.guard.js';
import { RolesGuard } from './roles.guard.js';

// The security department's org chart.
@Module({
  imports: [
    UsersModule, // ✅ import HR to borrow its exported UsersService
    JwtModule.registerAsync({
      inject: [ConfigService], // ConfigModule is global, so ConfigService is available here
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: config.get(
            'JWT_EXPIRES_IN',
            '15m',
          ) as JwtSignOptions['expiresIn'],
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    // APP_GUARD makes these guards run for EVERY route in the app, in this order:
    // first "do you have a valid badge?", then "is your role allowed here?".
    // They are registered here, not in AppModule, because JwtAuthGuard needs JwtService,
    // and JwtService only exists inside this module (it comes from JwtModule above).
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AuthModule {}
