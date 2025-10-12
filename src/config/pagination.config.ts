import { registerAs } from '@nestjs/config';

export default registerAs('pagination', () => ({
  defaultPage: parseInt(process.env.PAGINATION_DEFAULT_PAGE ?? '1', 10),
  defaultPageSize: parseInt(process.env.PAGINATION_DEFAULT_PAGE_SIZE ?? '20', 10),
  maxPageSize: parseInt(process.env.PAGINATION_MAX_PAGE_SIZE ?? '200', 10),
}));
