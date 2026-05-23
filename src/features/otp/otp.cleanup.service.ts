import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class OtpCleanupService {
  constructor(private prismaService: PrismaService) {}

  @Cron(CronExpression.EVERY_HOUR)
  async markExpiredOtps() {
    await this.prismaService.otp.updateMany({
      where: {
        used: false,
        expiresAt: { lt: new Date() },
      },
      data: { used: true },
    });
  }

  @Cron(CronExpression.EVERY_DAY_AT_11PM)
  async deleteOldExpiredOtps() {
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

  await this.prismaService.otp.deleteMany({
      where: {
        used: true,
        expiresAt: { lt: oneMonthAgo },
      },
    });
  }

}