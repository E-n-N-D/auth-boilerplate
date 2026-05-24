import { IsNotEmpty, IsString, ValidateIf } from "class-validator";

export class UpdateUserDto {

    @ValidateIf(o => !o.lastName)
    @IsNotEmpty({ message: 'Either firstName or lastName must be provided' })
    @IsString()
    firstName?: string;
    
    @ValidateIf(o => !o.firstName)
    @IsNotEmpty({ message: 'Either firstName or lastName must be provided' })
    @IsString()
    lastName?: string;

}
