import { Global, Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { RolesController } from './roles.controller';
import { RolesService } from './roles.service';
import { JwtStrategy } from './jwt.strategy';
import { FirebaseAuthGuard } from './auth.guard';
import { PermissionsService } from './permissions.service';
import { PermissionsGuard } from './permissions.guard';
import { PrismaService } from '../../database/prisma.service';
import { TenantModule } from '../tenant/tenant.module';

@Global()
@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'dev-insecure-secret-change-me',
      signOptions: { expiresIn: '24h' },
    }),
    TenantModule,
  ],
  controllers: [AuthController, RolesController],
  providers: [
    AuthService,
    JwtStrategy,
    FirebaseAuthGuard,
    PermissionsService,
    PermissionsGuard,
    RolesService,
    PrismaService,
  ],
  exports: [AuthService, FirebaseAuthGuard, PermissionsService, PermissionsGuard],
})
export class AuthModule {}
