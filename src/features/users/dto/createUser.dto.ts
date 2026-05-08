import { IsBoolean, IsEmail, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateUserDto {

    @IsEmail()
    @IsNotEmpty()
    email!: string;

    @IsOptional()
    passwordHash?: string;

    @IsNotEmpty()
    @IsString()
    firstName!: string;
    
    @IsNotEmpty()
    @IsString()
    lastName!: string;

    @IsOptional()
    @IsBoolean()
    isVerified?: boolean;
}
