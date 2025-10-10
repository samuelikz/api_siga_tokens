import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaPrimaryService } from 'src/prisma/prisma-primary.service';

@Injectable()
export class TokenExpiryJob {
  private readonly logger = new Logger(TokenExpiryJob.name);
  private running = false; // evita sobreposição

  constructor(private readonly prisma: PrismaPrimaryService) {}

  /**
   * Roda a cada minuto e marca como inativos os tokens vencidos (não revogados).
   * Mantém revokedAt = null para diferenciar "revogado" de "expirado".
   */
  @Cron(CronExpression.EVERY_12_HOURS, {
    name: 'deactivateExpiredTokens',
    timeZone: process.env.CRON_TZ ?? 'UTC', // opcional
  })
  async deactivateExpiredTokens() {
    if (this.running) return;
    this.running = true;

    try {
      // opcional: ping pra falhar cedo se DB estiver off
      await this.prisma.$queryRaw`SELECT 1`;

      const now = new Date();
      const res = await this.prisma.token.updateMany({
        where: {
          isActive: true,
          revokedAt: null,
          expiresAt: { lte: now },
        },
        data: { isActive: false },
      });

      if (res.count > 0) {
        this.logger.log(`Tokens expirados desativados: ${res.count}`);
      }
    } catch (err: any) {
      if (err?.code === 'P1001') {
        this.logger.warn('DB indisponível para o job de expiração — tenta de novo no próximo ciclo.');
      } else {
        this.logger.error('Falha no job de expiração', err?.stack || err);
      }
    } finally {
      this.running = false;
    }
  }
}
