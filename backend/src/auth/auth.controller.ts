import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto } from './dto/auth.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('send-otp')
  async sendOtp(@Body() body: { email: string }) {
    return this.authService.sendPasswordResetOtp(body.email);
  }

  @Post('verify-otp')
  async verifyOtp(@Body() body: { email: string; otp: string }) {
    return this.authService.verifyPasswordResetOtp(body.email, body.otp);
  }

  @Post('complete-reset')
  async completeReset(@Body() body: { email: string; otp: string; newPassword: string }) {
    return this.authService.completePasswordReset(body);
  }

  @Post('forgot-password')
  async forgotPassword(@Body() body: { email: string; newPassword: string }) {
    return this.authService.resetPassword(body);
  }

  @Post('reset-password')
  async resetPassword(@Body() body: { email: string; newPassword: string }) {
    return this.authService.resetPassword(body);
  }

  @Get('profile/:email')
  async getProfile(@Param('email') email: string) {
    return this.authService.getProfile(email);
  }

  @Get('users')
  async getAllUsers() {
    return this.authService.getAllUsers();
  }

  @Patch('users/:id')
  async updateUser(@Param('id') id: string, @Body() updateDto: any) {
    return this.authService.updateUser(id, updateDto);
  }

  @Delete('users/:id')
  async deleteUser(@Param('id') id: string) {
    return this.authService.deleteUser(id);
  }
}
