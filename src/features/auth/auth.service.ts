import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { JwtPayload, LoginDto, OtpVerifyDTO, SafeUser, SignUpDto, UpdatePasswordDto } from "./dto";
import * as argon from 'argon2';
import { UsersService } from "@/features/users/users.service";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "@/prisma/prisma.service";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/client";
import { OtpService } from "@/features/otp/otp.service";
import { MailService } from "@/features/mail/mail.service";
import { OtpPurpose } from "@prisma/client";
import { VerifyOtpDto } from "../otp/dto";

@Injectable()
export class AuthService {
    constructor(
        private userService: UsersService,
        private prismaService: PrismaService,
        private jwtService: JwtService,
        private config: ConfigService,
        private otpService: OtpService,
        private mailService: MailService
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
        if(!user || !user.passwordHash) throw new BadRequestException('Try again or log in using providers!')

        const isMatching = await argon.verify(user.passwordHash, dto.password);
        if(!isMatching) throw new BadRequestException('Incorrect Password!')
        
        const payload : JwtPayload = {
            userId: user.id,
            email: user.email
        } 

        const {accessToken, refreshToken, safeUser} = await this.updateRefreshTokens(payload);

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

    async sendEmailVerification(user: SafeUser){
        const otp = await this.otpService.createOtp(user.id, OtpPurpose.EMAIL_VERIFICATION)
        this.mailService.sendEmailVerificationOtp(user.email, otp)
        return {
            success: true,
            message: "Email Verification code sent!"
        }
    }

    async verifyEmail(user: SafeUser, otp: string){
        if(user.isVerified){
            return {
                success: true,
                message: "Email already verified!"
            }      
        }
        const verifyOtp: VerifyOtpDto = {
            userId: user.id,
            submitted: otp,
            purpose: OtpPurpose.EMAIL_VERIFICATION
        }
        await this.otpService.verifyOtp(verifyOtp)
        await this.userService.verifyUser(user.id);

        return {
            success: true,
            message: "Email verified successfully!"
        }
    }

    async sendPasswordResetVerification(user: SafeUser){
        if (!user.isVerified) throw new BadRequestException("Email not verified yet!")
        const otp = await this.otpService.createOtp(user.id, OtpPurpose.PASSWORD_RESET)
        this.mailService.sendPasswordResetOtp(user.email, otp)
        return {
            success: true,
            message: "Password reset verification code sent!"
        }
    }

    async sendTwoFactorVerification(user: SafeUser){
        if (!user.isVerified) throw new BadRequestException("Email not verified yet!")

        const otp = await this.otpService.createOtp(user.id, OtpPurpose.TWO_FACTOR)
        this.mailService.sendTwoFactorOtp(user.email, otp)
        return {
            success: true,
            message: "Two Factor verification code sent!"
        }
    }

    async verifyOTP(user: SafeUser, otp: OtpVerifyDTO){
        const otp_purpose = otp.purpose == "password-reset" ? OtpPurpose.PASSWORD_RESET: OtpPurpose.TWO_FACTOR
        
        const verifyOtp: VerifyOtpDto = {
            userId: user.id,
            submitted: otp.submitted,
            purpose: otp_purpose
        }
        await this.otpService.verifyOtp(verifyOtp)

        return {
            success: true,
            message: "Otp Verification successful"
        }
    }

    async signAccessToken(payload: JwtPayload){
        const accessSecret = this.config.get('accessSecret');
        return await this.jwtService.signAsync(payload,{
            expiresIn: '15m',
            secret: accessSecret
        });
    }

    async signRefreshToken(payload: JwtPayload){
        const refreshSecret = this.config.get('refreshSecret');

        return await this.jwtService.signAsync(payload,{
            expiresIn: '30d',
            secret: refreshSecret
        });
    }

    async updateRefreshTokens(payload: JwtPayload){

        const accessToken = await this.signAccessToken(payload);
        const refreshToken = await this.signRefreshToken(payload);

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

            const safeUser = SafeUser.from(user);

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

        const safeUser = SafeUser.from(user);

        const accessToken = await this.signAccessToken(payload)
        return {
            success: true,
            message: "Token refreshed successfully",
            user: safeUser,
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
        if (!isMatching) throw new UnauthorizedException('User not authorized!')
            
        const safeUser = user as SafeUser
        return safeUser;
    }

    async updatePassword(user: SafeUser, updatedPassword: UpdatePasswordDto){
        const passwordHash = await argon.hash(updatedPassword.password);

        await this.userService.updatePassword(user.id, passwordHash)

        const payload: JwtPayload = {
            userId: user.id,
            email: user.email
        }

        const {accessToken, refreshToken, safeUser} = await this.updateRefreshTokens(payload);

        return {
            success: true,
            message: "Password updated successfully",
            accessToken,
            refreshToken
        }
    }

    async logout(userId: string){
        await this.userService.invalidateRefreshToken(userId);

        return {
            success: true,
            message: "Logged out successfully",
        }
    }
}
