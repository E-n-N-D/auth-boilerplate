import { Body, Controller, Get, HttpCode, HttpStatus, Post, Put, UseGuards } from '@nestjs/common';
import { AccessTokenGuard } from '@/features/auth/guard';
import { GetUser } from '../auth/decorator';
import { SafeUser } from '../auth/dto';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto';

@UseGuards(AccessTokenGuard)
@Controller('users')
export class UsersController {
    constructor(private userService: UsersService){}

    @Get('me')
    @HttpCode(HttpStatus.OK)
    async getUser(@GetUser() user: SafeUser){
        return {
            success: true,
            message:"User retrieved successfully",
            user
        }
    }

    @Put('update')
    @HttpCode(HttpStatus.OK)
    async updateUser(@GetUser() user: SafeUser, dto: UpdateUserDto){
        return this.userService.updateUser(user.id, dto)
    }

}
