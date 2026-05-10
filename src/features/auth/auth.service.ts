import { BadRequestException, Injectable } from "@nestjs/common";
import { LoginDto, SignUpDto } from "./dto";
import * as argon from 'argon2';
import { UsersService } from "@/features/users/users.service";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class AuthService {
    constructor(
        private userService: UsersService,
        private jwtService: JwtService,
        private config: ConfigService,
    ){}
    
    async signUp(dto: SignUpDto){
        const passwordHash = await argon.hash(dto.password);

        const user = await this.userService.createUser({email: dto.email, passwordHash:passwordHash,firstName: dto.firstName, lastName:dto.lastName})
        if(user) {
            
            const {accessToken, refreshToken} = await this.signTokens(user.id, user.email);
            this.updateRefreshTokens(user.id, refreshToken);

            return {
                success: true,
                message: "Signed in successfully",
                accessToken: accessToken
            }
        }
    }

    async login(dto: LoginDto){
        const user = await this.userService.findByEmail(dto.email);
        if(!user.passwordHash) throw new BadRequestException('Password not created for this account. Log In using providers!')

        const isMatching = argon.verify(user.passwordHash, dto.password);
        if(!isMatching) throw new BadRequestException('Incorrect Password!')
        
        const {accessToken, refreshToken} = await this.signTokens(user.id, user.email);
        this.updateRefreshTokens(user.id, refreshToken);

        return {
            success: true,
            message: "Logged in successfully",
            accessToken: accessToken
        }
    }

    async signTokens(userId: string, email: string){
        const payload = {
            sub: userId,
            email
        }

        const accessSecret = this.config.get('ACCESS_SECRET');
        const refreshSecret = this.config.get('REFRESH_SECRET');

        const accessToken = await this.jwtService.signAsync(payload,{
            expiresIn: '15m',
            secret: accessSecret
        });

        const refreshToken = await this.jwtService.signAsync(payload,{
            expiresIn: '30d',
            secret: refreshSecret
        });

        return {
            accessToken,
            refreshToken
        }
    }

    async updateRefreshTokens(userId: string, refreshToken: string){
        const refreshHashToken = await argon.hash(refreshToken)
        this.userService.updateRefreshToken(userId, refreshHashToken)
    }
}
