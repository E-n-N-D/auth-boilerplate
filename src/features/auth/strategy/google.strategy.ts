import { UsersService } from "@/features/users/users.service";
import { BadRequestException, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { Profile, Strategy, VerifyCallback } from "passport-google-oauth20";
import { SafeUser } from "../dto";

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google'){
    constructor(
        config: ConfigService,
        private userService: UsersService
    ) {
        super({
            clientID: config.getOrThrow('google.clientId'),
            clientSecret: config.getOrThrow('google.clientSecret'),
            callbackURL: config.getOrThrow('google.callbackURL'),
            scope:['email', 'profile']
        })
    }

    async validate(
        // accessToken: string,
        // refreshToken: string,
        profile: Profile,
        done: VerifyCallback,
    ) {
        const { name, emails, id } = profile;

        if(!name || !emails) throw new BadRequestException("Invalid Login")

        const googleUser = {
            email: emails[0].value,
            firstName: name.givenName,
            lastName: name.familyName,
            provider_user_id: id,
        };

        // find or create the user in your DB
        const user:SafeUser = await this.userService.findOrCreateGoogleUser(googleUser);

        done(null, user);
    }
}