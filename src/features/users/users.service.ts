import { BadRequestException, ForbiddenException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';

import { PrismaService } from '@/prisma/prisma.service';
import { PrismaClientKnownRequestError } from "@/generated/prisma/internal/prismaNamespace";
import { CreateUserDto, GoogleUserDto } from './dto';

@Injectable()
export class UsersService {
    constructor(private prismaService:PrismaService){}

    async createUser(dto: CreateUserDto){
        try {
            const user = await this.prismaService.user.create({
                data: dto,
                omit:{
                    passwordHash:true,
                    refreshHashToken:true
                }
            })
            return user;
        } catch (error) {
            if(error instanceof PrismaClientKnownRequestError) {
                // catch duplicate email error
                if(error.code === 'P2002') {
                    throw new ForbiddenException('Email already in use!')
                }
            }
        }
    }

    async findByEmail(email: string){
        const user = await this.prismaService.user.findUnique({
            where:{
                email
            },
        })
        if(!user) throw new BadRequestException('No user found with this email!');
        return user;
    }

    async findOrCreateGoogleUser(googleUser: GoogleUserDto){
        const user = await this.createUser({email: googleUser.email, firstName: googleUser.firstName, lastName: googleUser.lastName, isVerified:true})
        if(!user) throw new Error("Account couldn't be created. Try again!")
        try {
            await this.prismaService.oAuthAccounts.create({
                data:{
                    provider_user_id: googleUser.provider_user_id,
                    userId: user.id,
                    provider: "Google",
                }
            })
            return user;
        } catch (error) {
            await this.prismaService.user.delete({
                where:{
                    id: user.id
                }
            })

            throw new BadRequestException("Couldn\'t create OAuth account. Try another account!")
        }
    }

}
