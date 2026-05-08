import { IsEmail, IsNotEmpty, MinLength } from "class-validator";

export class SignUpDto {

    @IsEmail()
    @IsNotEmpty()
    email!: string;

    @IsNotEmpty()
    @MinLength(8,{
        message: "Password must be of minimum 8 characters!"
    })
    password!: string;

    @IsNotEmpty()
    firstName!: string;
    
    @IsNotEmpty()
    lastName!: string;
}
