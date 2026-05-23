import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { JwtPayload, SafeUser } from "../dto";
import { UsersService } from "@/features/users/users.service";

@Injectable()
export class AccessTokenStrategy extends PassportStrategy(Strategy, 'jwt') {
    constructor(
        config: ConfigService,
        private userService: UsersService
    ){
        const secret = config.get('accessSecret');

        if (!secret) throw new Error('accessSecret not defined!')
            
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: secret,
        });
    }

    async validate(payload: JwtPayload):Promise<SafeUser>{
        
        const user = await this.userService.findByEmail(payload.email);

        const {passwordHash, refreshHashToken, ...safeUser} = user;

        return safeUser;
    }
}