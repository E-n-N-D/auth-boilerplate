import { Body, Controller, Get, HttpCode, HttpStatus, Post, UseGuards } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { LoginDto, SafeUser, SignUpDto } from "./dto";
import { GoogleGuard, RefreshTokenGuard } from "./guard";
import { GetUser } from "./decorator";
import type  { User } from "@/generated/prisma/client";

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

    @HttpCode(HttpStatus.OK)
    @Post('login')
    async login(@Body() dto:LoginDto){
        return this.authService.login(dto);
    }

    @HttpCode(HttpStatus.OK)
    @UseGuards(RefreshTokenGuard)
    @Get('refresh')
    async refreshTokens(@GetUser() user: SafeUser){
        return this.authService.refreshTokens(user)
    }

    @HttpCode(HttpStatus.OK)
    @Get('logout')
    async logout(){

    }
}