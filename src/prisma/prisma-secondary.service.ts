import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import path from 'node:path';
const secondaryDir = path.join(process.cwd(), 'node_modules', '.prisma', 'secondary');
const { PrismaClient } = require(secondaryDir);

@Injectable()
export class PrismaSecondaryService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super({ log: ['error', 'warn', 'query'] }); // <- LIGA LOGS
  }
  async onModuleInit() { await this.$connect(); }
  async onModuleDestroy() { await this.$disconnect(); }
}