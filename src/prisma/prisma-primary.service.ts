import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import path from 'node:path';

const primaryDir = path.join(process.cwd(), 'node_modules', '.prisma', 'primary');
const { PrismaClient } = require(primaryDir);

@Injectable()
export class PrismaPrimaryService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() { await this.$connect(); }
  async onModuleDestroy() { await this.$disconnect(); }
}
