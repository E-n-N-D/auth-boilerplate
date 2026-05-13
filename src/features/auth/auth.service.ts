import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { JwtPayload, LoginDto, SafeUser, SignUpDto } from "./dto";
import * as argon from 'argon2';
import { UsersService } from "@/features/users/users.service";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "@/prisma/prisma.service";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/client";
import { User } from "@/generated/prisma/client";

@Injectable()
export class AuthService {
    constructor(
        private userService: UsersService,
        private prismaService: PrismaService,
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

            const {accessToken, refreshToken, safeUser} = await this.updateRefreshTokens(payload);

            return {
                success: true,
                message: "Signed in successfully",
                user: safeUser,
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

        const {accessToken, refreshToken, safeUser} = await this.updateRefreshTokens(payload);

        // const {passwordHash, refreshHashToken, ...safeUser} = user;

        return {
            success: true,
            message: "Logged in successfully",
            user: safeUser,
            accessToken,
            refreshToken
        }
    }

    async googleLogin(payload: JwtPayload){
        const {accessToken, refreshToken, safeUser} = await this.updateRefreshTokens(payload);

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

    async updateRefreshTokens(payload: JwtPayload){

        const accessToken = await this.signAccessToken(payload);
        const refreshToken = await this.signAccessToken(payload);

        const refreshHash = await argon.hash(refreshToken)
        try {
            const user = await this.prismaService.user.update({
                where: {
                    id: payload.userId
                },
                data: {
                    refreshHashToken: refreshHash
                }
            });

            const {passwordHash, refreshHashToken, ...safeUser} = user

            return {accessToken, refreshToken, safeUser}

        } catch (error) {
            if(error instanceof PrismaClientKnownRequestError) {
                if (error.code === 'P2025') {
                    throw new NotFoundException('User not found');
                }
            }
            throw error;
        }
    }

    async refreshTokens(user: SafeUser){
        const payload: JwtPayload = {
            userId: user.id,
            email: user.email
        }
        const accessToken = await this.signAccessToken(payload)
        return {
            success: true,
            message: "Token refreshed successfully",
            user,
            accessToken
        }
    }

    async verifyRefreshToken(userId: string, refreshToken: string){
        const user = await this.prismaService.user.findUnique({
            where:{
                id: userId
            }
        })
        if(!user || !user.refreshHashToken) throw new BadRequestException('Invalid refreshToken');

        const isMatching = await argon.verify(user.refreshHashToken, refreshToken);
        const safeUser = user as SafeUser

        if (!isMatching) throw new UnauthorizedException('User not authorized!')
        return safeUser;
    }
}
