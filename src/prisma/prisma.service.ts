import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// import { PrismaClient } from '@/generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit
{
  constructor(configService: ConfigService) {
    const adapter = new PrismaPg({
      connectionString: configService.get<string>('databaseURL'),
    });
    super({ adapter });
  }

  async onModuleInit() {
    await this.$connect();
  }

  cleanDb(){
    return this.$transaction([
      this.otp.deleteMany(),
      this.oAuthAccounts.deleteMany(),
      this.user.deleteMany(),
    ])
  }

}