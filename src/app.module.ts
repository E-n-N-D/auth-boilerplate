import { Module } from '@nestjs/common';
import {AuthModule} from "@features/auth/auth.module";
import { UsersModule } from '@features/users/users.module';
import { PrismaModule } from '@/prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import configuration from '@/config/env.config';

@Module({
  imports: [ConfigModule.forRoot({
      isGlobal: true,

      envFilePath:['.env'],
      load: [configuration]
    }),AuthModule, UsersModule, PrismaModule],
  providers: [],
})
export class AppModule {}
