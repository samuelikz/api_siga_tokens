import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export type Pagination = { page: number; pageSize: number; offset: number; limit: number };

const resolvePage = (raw: unknown, fallback: number) => {
  const n = Number(raw);
  return Number.isFinite(n) && n >= 1 ? Math.floor(n) : fallback;
};
const resolvePageSize = (raw: unknown, fallback: number, max: number) => {
  const n = Number(raw);
  const size = Number.isFinite(n) && n >= 1 ? Math.floor(n) : fallback;
  return Math.min(size, max);
};

// Decorator de parâmetro
export const Pagination = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): Pagination => {
    const req = ctx.switchToHttp().getRequest();
    // ConfigService global
    const config: ConfigService = req.app?.get?.(ConfigService) ?? new ConfigService();
    const defPage = Number(config.get('pagination.defaultPage') ?? 1);
    const defSize = Number(config.get('pagination.defaultPageSize') ?? 20);
    const maxSize = Number(config.get('pagination.maxPageSize') ?? 200);

    const page = resolvePage(req.query.page, defPage);
    const pageSize = resolvePageSize(req.query.pageSize, defSize, maxSize);
    const offset = (page - 1) * pageSize;
    return { page, pageSize, offset, limit: pageSize };
  }
);

// usado pelo interceptor
export const makeMeta = (total: number, page: number, pageSize: number) => ({
  total: Number(total || 0),
  page,
  pageSize,
  totalPages: total ? Math.ceil(Number(total) / pageSize) : 0,
});
