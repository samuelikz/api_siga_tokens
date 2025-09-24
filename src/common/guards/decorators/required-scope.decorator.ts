import { SetMetadata } from '@nestjs/common';
export const REQUIRED_SCOPE_KEY = 'required_scope';
export const RequiredScope = (scope: 'READ'|'WRITE'|'ADMIN' = 'READ') => SetMetadata(REQUIRED_SCOPE_KEY, scope);
// usage: @RequiredScope('ADMIN') em controllers ou métodos que exigem escopo ADMIN
// default é 'READ' se não especificado