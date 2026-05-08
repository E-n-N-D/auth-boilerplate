import { Controller, Get, Post } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { LoginDto, SignUpDto } from "./dto";

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService){}

    @Post('signup')
    async signup(dto:SignUpDto){
        this.authService.signUp(dto);
    }

    @Get('google/callback')
    async googleSignin(){

    }

    @Post('login')
    async login(dto:LoginDto){
        this.authService.login(dto);
    }

    @Get('logout')
    async logout(){

    }
}