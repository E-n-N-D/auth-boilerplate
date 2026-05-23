import { OtpPurpose } from "@prisma/client";
import { IsNotEmpty, IsString } from "class-validator";

export class CreateOtpDto {
   
    @IsNotEmpty()
    @IsString()
    userId!: string;

    @IsNotEmpty()
    purpose!: OtpPurpose;

}