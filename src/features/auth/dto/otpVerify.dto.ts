import { IsNotEmpty } from "class-validator";

export class OtpVerifyDTO {

    @IsNotEmpty()
    purpose!: string;

    @IsNotEmpty()
    submitted!: string;

}
