// src/tokens/token-expiry.job.ts
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaPrimaryService } from 'src/prisma/prisma-primary.service';

@Injectable()
export class TokenExpiryJob {
  private readonly logger = new Logger(TokenExpiryJob.name);

  constructor(private readonly prisma: PrismaPrimaryService) {}

  /**
   * Roda a cada minuto e marca como inativos os tokens vencidos (não revogados).
   * Mantém revokedAt = null para diferenciar "revogado" de "expirado".
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async deactivateExpiredTokens() {
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
  }
}
