import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { OtpPurpose } from '@prisma/client';
import * as argon2 from 'argon2';
import { randomInt } from 'crypto';

const OTP_LENGTH   = 6;
const OTP_TTL_MS   = 5 * 60 * 1000; // 5 minutes
const MAX_ATTEMPTS = 5;
const COOLDOWN_MS  = 2 * 60 * 1000; // 2 minute re-send cooldown

@Injectable()
export class OtpService {
  constructor(private prisma: PrismaService) {}

  async createOtp(userId: string, purpose: OtpPurpose): Promise<string> {
    const activeOtp = await this.findActive(userId, purpose);

    if (activeOtp) {
      const age = Date.now() - activeOtp.createdAt.getTime();

      if (age < COOLDOWN_MS) {
        throw new BadRequestException(
          'Please wait before requesting a new OTP.',
        );
      }

      // Invalidate the old active OTP before issuing a new one
      await this.markUsed(activeOtp.id);
    }

    const digits = Array.from(
      { length: OTP_LENGTH },
      () => randomInt(0, 10),
    ).join('');

    const hash = await argon2.hash(digits);

    await this.prisma.otp.create({
      data: {
        userId,
        purpose,
        hash,
        expiresAt: new Date(Date.now() + OTP_TTL_MS),
      },
    });

    return digits;
  }

  async verifyOtp(
    userId: string,
    purpose: OtpPurpose,
    submitted: string,
  ): Promise<void> {
    const record = await this.findActive(userId, purpose);

    if (!record) this.fail();

    if (new Date() > record.expiresAt) {
      await this.markUsed(record.id); // expired — invalidate it
      this.fail();
    }

    if (record.attempts >= MAX_ATTEMPTS) {
      await this.markUsed(record.id); // too many attempts — invalidate it
      throw new BadRequestException(
        'Too many failed attempts. Please request a new OTP.',
      );
    }

    // Increment attempts BEFORE verifying
    await this.prisma.otp.update({
      where: { id: record.id },
      data: { attempts: { increment: 1 } },
    });

    const valid = await argon2.verify(record.hash, submitted);

    if (!valid) this.fail();

    // Verified — mark as used
    await this.markUsed(record.id);
  }

  // ─── Private Helpers ────────────────────────────────────────────────────────

  private async findActive(userId: string, purpose: OtpPurpose) {
    return this.prisma.otp.findFirst({
      where: { userId, purpose, used: false },
    });
  }

  private async markUsed(id: string) {
    return this.prisma.otp.update({
      where: { id },
      data: { used: true },
    });
  }

  // Generic Error for security
  private fail(): never {
    throw new BadRequestException('Invalid or expired OTP.');
  }
}