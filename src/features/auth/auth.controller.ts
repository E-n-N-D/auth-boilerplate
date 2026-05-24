import { BadRequestException, Body, Controller, Get, HttpCode, HttpStatus, Post, UseGuards } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { LoginDto, OtpVerifyDTO, SafeUser, SignUpDto, UpdatePasswordDto } from "./dto";
import { AccessTokenGuard, GoogleGuard, RefreshTokenGuard } from "./guard";
import { GetUser } from "./decorator";

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService){}

    @Post('signup')
    async signup(@Body() dto:SignUpDto){
        return this.authService.signUp(dto);
    }

    @Get('google/callback')
    @UseGuards(GoogleGuard)
    async googleSignin(@GetUser() user: SafeUser){
        return this.authService.googleLogin({email: user.email, userId: user.id})
    }

    @Post('login')
    @HttpCode(HttpStatus.OK)
    async login(@Body() dto:LoginDto){
        return this.authService.login(dto);
    }

    @Get('refresh')
    @HttpCode(HttpStatus.OK)
    @UseGuards(RefreshTokenGuard)
    async refreshTokens(@GetUser() user: SafeUser){
        return this.authService.refreshTokens(user)
    }

    @Post('updatePassword')
    @HttpCode(HttpStatus.OK)
    @UseGuards(RefreshTokenGuard)
    async updatePassword(@GetUser() user: SafeUser, @Body() updatedPassword: UpdatePasswordDto){
        return this.authService.updatePassword(user, updatedPassword);
    }

    @Get('logout')
    @HttpCode(HttpStatus.OK)
    @UseGuards(AccessTokenGuard)
    async logout(@GetUser() user: SafeUser){
        return this.authService.logout(user.id)
    }

    @Get('emailVerification')
    @HttpCode(HttpStatus.OK)
    @UseGuards(AccessTokenGuard)
    async emailVerification(@GetUser() user: SafeUser){
        return this.authService.sendEmailVerification(user);
    }
    
    @Post('verifyEmail')
    @HttpCode(HttpStatus.OK)
    @UseGuards(AccessTokenGuard)
    async verifyEmail(@GetUser() user: SafeUser, @Body('otp') otp: string){
        return this.authService.verifyEmail(user, otp);
    }

    @Get('resetPassword')
    @HttpCode(HttpStatus.OK)
    @UseGuards(AccessTokenGuard)
    async resetPassword(@GetUser() user: SafeUser){
        return this.authService.sendEmailVerification(user);
    }

    @Get('twoFactor')
    @HttpCode(HttpStatus.OK)
    @UseGuards(AccessTokenGuard)
    async twoFactor(@GetUser() user: SafeUser){
        return this.authService.sendTwoFactorVerification(user);
    }

    @Post('verifyOTP')
    @HttpCode(HttpStatus.OK)
    @UseGuards(AccessTokenGuard)
    async verifyOTP(@GetUser() user: SafeUser, @Body() otp: OtpVerifyDTO){
        return this.authService.verifyOTP(user, otp);
    }

}