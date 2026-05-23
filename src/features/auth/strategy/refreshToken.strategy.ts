import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy } from "passport-jwt";
import { JwtPayload, SafeUser } from "../dto";
import {Request} from 'express';
import { AuthService } from "../auth.service";

const extractRefreshToken = (req: Request)=>{
    // 1. WEB: cookie-based (HttpOnly)
    if (req.cookies?.refreshToken) {
        return req.cookies.refreshToken;
    }

    // 2. MOBILE: Authorization header
    if (req.headers.authorization) {
        const [type, token] =
        req.headers.authorization.split(' ');

        if (type === 'Bearer') {
            return token;
        }
    }

    return null;
}

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
    constructor(config: ConfigService,
        private authService: AuthService
    ){
        const secret = config.get('refreshSecret');

        if (!secret) throw new Error('refreshSecret not defined!')
            
        super({
            jwtFromRequest: extractRefreshToken,
            ignoreExpiration: false,
            secretOrKey: secret,
            passReqToCallback: true
        });
    }

    async validate(req: Request, payload: JwtPayload): Promise<SafeUser> {
        const refreshToken =
        extractRefreshToken(req);

        if (!refreshToken) {
            throw new UnauthorizedException(
                'Refresh token missing',
            );
        }

        const user = await this.authService.verifyRefreshToken(payload.userId, refreshToken);

        return user;
    }
}