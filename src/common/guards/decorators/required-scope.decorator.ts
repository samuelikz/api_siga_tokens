// src/common/decorators/required-scope.decorator.ts
import { SetMetadata } from '@nestjs/common';
import { TokenScope } from 'src/common/types/enums';
export const REQUIRED_SCOPE_KEY = 'required_scope';
export const RequiredScope = (scope: TokenScope = 'READ') => SetMetadata(REQUIRED_SCOPE_KEY, scope);
