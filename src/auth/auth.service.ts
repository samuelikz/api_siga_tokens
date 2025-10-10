import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaPrimaryService } from '../prisma/prisma-primary.service';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaPrimaryService, private jwt: JwtService) {}

  async validate(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new UnauthorizedException('Credenciais inválidas');
    if (!(await bcrypt.compare(password, user.password))) {
      throw new UnauthorizedException('Credenciais inválidas');
    }
    return user;
  }

  sign(user: { id: string; role: string }) {
    // Se quiser permitir configurar via env, aceite apenas número em segundos
    const envExpires = process.env.JWT_EXPIRES_IN;
    const expiresIn =
      envExpires && /^\d+$/.test(envExpires) ? Number(envExpires) : 60 * 60 * 24; // 1 dia

    return this.jwt.sign(
      { sub: user.id, role: user.role },
      {
        secret: process.env.JWT_SECRET ?? 'change-me',
        expiresIn, // number (segundos) evita o erro de tipagem
      },
    );
  }
}
