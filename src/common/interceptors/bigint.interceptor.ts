import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';

type Mode = 'string' | 'number';

function convertBigInt(value: any, mode: Mode): any {
  if (typeof value === 'bigint') {
    return mode === 'number' ? Number(value) : value.toString();
  }
  if (Array.isArray(value)) {
    return value.map((v) => convertBigInt(v, mode));
  }
  if (value && typeof value === 'object') {
    const out: any = {};
    for (const k of Object.keys(value)) out[k] = convertBigInt(value[k], mode);
    return out;
  }
  return value;
}

@Injectable()
export class BigIntInterceptor implements NestInterceptor {
  constructor(private readonly mode: Mode = 'string') {}
  intercept(_ctx: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(map((data) => convertBigInt(data, this.mode)));
  }
}
