import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { DatabaseModule } from 'src/database/database.module';
import { JwtAuthService } from '../auth/jwtService';

@Module({
  imports: [DatabaseModule],
  controllers: [UsersController],
  providers: [UsersService, JwtAuthService],
  exports: [UsersService, JwtAuthService],
})
export class UsersModule { }

