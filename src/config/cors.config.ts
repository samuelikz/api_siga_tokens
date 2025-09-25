import type { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';

function parseOrigins(raw?: string): (string | RegExp)[] | boolean {
  if (!raw) return true; // libera tudo em dev; ajuste se quiser
  const parts = raw.split(',').map(s => s.trim()).filter(Boolean);
  if (parts.length === 0) return true;
  return parts.map((o) => {
    if (o.startsWith('/') && o.endsWith('/')) {
      // suporta regex: ex /.*\.meudominio\.com$/
      const body = o.slice(1, -1);
      return new RegExp(body);
    }
    return o;
  });
}

export function buildCorsOptionsFromEnv(): CorsOptions {
  return {
    origin: parseOrigins(process.env.CORS_ORIGINS),
    methods: process.env.CORS_METHODS ?? 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: process.env.CORS_ALLOWED_HEADERS ?? 'Content-Type,Authorization,x-api-key',
    exposedHeaders: process.env.CORS_EXPOSED_HEADERS ?? 'Content-Length,Content-Disposition',
    credentials: (process.env.CORS_CREDENTIALS ?? 'true').toLowerCase() === 'true',
    maxAge: Number(process.env.CORS_MAX_AGE ?? 86400),
  };
}