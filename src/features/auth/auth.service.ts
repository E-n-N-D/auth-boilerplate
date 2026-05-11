import { BadRequestException, Injectable } from "@nestjs/common";
import { JwtPayload, LoginDto, SignUpDto } from "./dto";
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
            
            const payload : JwtPayload = {
                userId: user.id,
                email: user.email
            } 

            const accessToken = await this.signAccessToken(payload);
            const refreshToken = await this.signRefreshToken(payload);

            await this.updateRefreshTokens(user.id, refreshToken);

            return {
                success: true,
                message: "Signed in successfully",
                user,
                accessToken,
                refreshToken
            }
        }
    }

    async login(dto: LoginDto){
        const user = await this.userService.findByEmail(dto.email);
        if(!user.passwordHash) throw new BadRequestException('Password not created for this account. Log In using providers!')

        const isMatching = await argon.verify(user.passwordHash, dto.password);
        if(!isMatching) throw new BadRequestException('Incorrect Password!')
        
        const payload : JwtPayload = {
            userId: user.id,
            email: user.email
        } 

        const accessToken = await this.signAccessToken(payload);
        const refreshToken = await this.signRefreshToken(payload);
        await this.updateRefreshTokens(user.id, refreshToken);

        const {passwordHash, refreshHashToken, ...safeUser} = user;

        return {
            success: true,
            message: "Logged in successfully",
            user: safeUser,
            accessToken,
            refreshToken
        }
    }

    async signAccessToken(payload: JwtPayload){
        const accessSecret = this.config.get('ACCESS_SECRET');
        return await this.jwtService.signAsync(payload,{
            expiresIn: '15m',
            secret: accessSecret
        });
    }

    async signRefreshToken(payload: JwtPayload){
        const refreshSecret = this.config.get('REFRESH_SECRET');

        return await this.jwtService.signAsync(payload,{
            expiresIn: '30d',
            secret: refreshSecret
        });
    }

    async updateRefreshTokens(userId: string, refreshToken: string){
        const refreshHashToken = await argon.hash(refreshToken)
        await this.userService.updateRefreshToken(userId, refreshHashToken)
    }

    async refreshTokens(payload: JwtPayload){
        const user = await this.userService.findByEmail(payload.email)
        const accessToken = await this.signAccessToken(payload)
        const {passwordHash, refreshHashToken, ...safeUser} = user;
        return {
            success: true,
            message: "Token refreshed successfully",
            user: safeUser,
            accessToken
        }
    }
}
