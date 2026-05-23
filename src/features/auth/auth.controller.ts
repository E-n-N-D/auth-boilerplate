import { BadRequestException, Body, Controller, Get, HttpCode, HttpStatus, Post, UseGuards } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { LoginDto, SafeUser, SignUpDto, UpdatePasswordDto } from "./dto";
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

}