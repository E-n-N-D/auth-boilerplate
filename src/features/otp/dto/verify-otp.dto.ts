import { OtpPurpose } from "@prisma/client";

export class VerifyOtpDto {
    userId!: string;
    purpose!: OtpPurpose;
    submitted!: string;
}
