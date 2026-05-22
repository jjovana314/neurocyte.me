import {
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { User } from 'src/auth/entites/user.entity';
import { Roles } from 'src/patients/decorators/roles.decorator';
import { RolesGuard } from 'src/patients/decorators/roles.guard';
import { UserService } from './user.service';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  async remove(@Param('id', ParseIntPipe) id: number): Promise<User> {
    return this.userService.remove(id);
  }

  @Post(':id/request-deactivation')
  @UseGuards(AuthGuard('jwt'))
  async requestDeactivation(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<void> {
    return this.userService.requestDeactivation(id);
  }

  @Get('deactivate/:token')
  async deactivateByToken(@Param('token') token: string): Promise<User> {
    return this.userService.removeByToken(token);
  }
}
