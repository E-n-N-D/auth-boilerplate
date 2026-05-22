import { IsNotEmpty, MinLength } from "class-validator";

export class UpdatePasswordDto {

    @MinLength(8,{
        message: "Password must be of minimum 8 characters!"
    })
    @IsNotEmpty()
    password!: string;

}