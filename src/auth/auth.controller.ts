import { Body, Controller, Post, Res } from '@nestjs/common';
import type { Response } from 'express'; 
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('login')
  async login(@Body() body: LoginDto, @Res({ passthrough: true }) res: Response) { // <- passthrough
    const user  = await this.auth.validate(body.email, body.password);
    const token = this.auth.sign({ id: user.id, role: user.role });

    res.cookie(process.env.AUTH_COOKIE_NAME || 'accessToken', token, {
      httpOnly: true, sameSite: 'lax'
    });

    return { success: true, token, me: { id: user.id, email: user.email, role: user.role } };
  }
}
