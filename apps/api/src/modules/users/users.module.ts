import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersManagementService } from './users-management.service';
import { PrismaService } from '../../database/prisma.service';

@Module({
  controllers: [UsersController],
  providers: [PrismaService, UsersManagementService],
})
export class UsersModule {}
