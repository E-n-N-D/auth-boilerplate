import { IsEmail, IsNotEmpty, MinLength } from "class-validator";

export class LoginDto {

    @IsEmail()
    email!: string;

    // @MinLength(8,{
    //     message: "Password must be of minimum 8 characters!"
    // })
    @IsNotEmpty()
    password!: string;

}
