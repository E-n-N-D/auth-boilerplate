import { BadRequestException, Injectable } from "@nestjs/common";
import { LoginDto, SignUpDto } from "./dto";
import * as argon from 'argon2';
import { UsersService } from "@/features/users/users.service";

@Injectable()
export class AuthService {
    constructor(
        private userService: UsersService
    ){}
    
    async signUp(dto: SignUpDto){
        // generate hash password
        const passwordHash = await argon.hash(dto.password);

        const user = await this.userService.createUser({email: dto.email, passwordHash:passwordHash,firstName: dto.firstName, lastName:dto.lastName})
        return user;
    }

    async login(dto: LoginDto){
        const user = await this.userService.findByEmail(dto.email);
        if(!user.passwordHash) throw new BadRequestException('Password not created for this account. Log In using providers!')

        const isMatching = argon.verify(user.passwordHash, dto.password);
        if(!isMatching) throw new BadRequestException('Incorrect Password!')
        
        const { passwordHash, ...safeUser } = user;
        return safeUser;
    }

}