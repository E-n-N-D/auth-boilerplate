import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '@/prisma/prisma.service';
import { PrismaClientKnownRequestError } from "@/generated/prisma/internal/prismaNamespace";
import { CreateUserDto } from './dto';


@Injectable()
export class UsersService {
    constructor(private prismaService:PrismaService){}

    async createUser(dto: CreateUserDto){
        try {
            const user = await this.prismaService.user.create({
                data: dto,
                omit:{
                    passwordHash:true
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
            }
        })
        if(!user) throw new BadRequestException('No user found with this email!');
        return user;
    }

    async updateRefreshToken(userId: string, refreshHashToken: string|null){
        try {
            await this.prismaService.user.update({
                where: {
                    id: userId
                },
                data: {
                    refreshHashToken
                }
            });

        } catch (error) {
            if(error instanceof PrismaClientKnownRequestError) {
                if (error.code === 'P2025') {
                    throw new NotFoundException('User not found');
                }
            }
            throw error;
        }
    }
}
