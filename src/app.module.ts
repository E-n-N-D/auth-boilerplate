import { Module } from '@nestjs/common';
import {AuthModule} from "@features/auth/auth.module";
import { UsersModule } from '@features/users/users.module';
import { PrismaModule } from '@/prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { OtpModule } from './features/otp/otp.module';
import { ScheduleModule } from '@nestjs/schedule';
import configuration from '@/config/env.config';

@Module({
  imports: [ConfigModule.forRoot({
      isGlobal: true,

      envFilePath:process.env.NODE_ENV === 'test' ? '.env.test' : '.env',
      load: [configuration]
    }),
    ScheduleModule.forRoot(),
    AuthModule, UsersModule, PrismaModule, OtpModule],
  providers: [],
})
export class AppModule {}
