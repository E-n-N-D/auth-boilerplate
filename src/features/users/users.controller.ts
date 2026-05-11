import { Body, Controller, Get, Post, Put, UseGuards } from '@nestjs/common';
import { AccessTokenGuard } from '@/features/auth/guard';

@UseGuards(AccessTokenGuard)
@Controller('users')
export class UsersController {

    @Get('me')
    async getUser(){

    }

    @Put()
    async updateUser(){}

}
