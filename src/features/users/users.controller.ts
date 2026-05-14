import { Body, Controller, Get, HttpCode, HttpStatus, Post, Put, UseGuards } from '@nestjs/common';
import { AccessTokenGuard } from '@/features/auth/guard';
import { GetUser } from '../auth/decorator';
import { SafeUser } from '../auth/dto';

@UseGuards(AccessTokenGuard)
@Controller('users')
export class UsersController {

    @HttpCode(HttpStatus.OK)
    @Get('me')
    async getUser(@GetUser() user: SafeUser){
        return {
            success: true,
            message:"User retrieved successfully",
            user
        }
    }

    @Put()
    async updateUser(){}

}
