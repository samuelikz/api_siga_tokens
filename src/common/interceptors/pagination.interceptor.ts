import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable, map } from 'rxjs';
import { makeMeta } from '../pagination';

@Injectable()
export class PaginationInterceptor implements NestInterceptor {
  intercept(_: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((value: any) => {
        if (value?.meta && value?.data) return value;
        if (value && 'data' in value && 'total' in value && 'page' in value && 'pageSize' in value) {
          const { data, total, page, pageSize } = value;
          return { data, meta: makeMeta(total, page, pageSize) };
        }
        return value;
      }),
    );
  }
}
