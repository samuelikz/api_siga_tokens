// src/common/types/enums.ts
export const RoleEnum = { ADMIN: 'ADMIN', USER: 'USER' } as const;
export type Role = keyof typeof RoleEnum; // 'ADMIN' | 'USER'

export const TokenScopeEnum = { READ: 'READ', WRITE: 'WRITE', READ_WRITE: 'READ_WRITE' } as const;
export type TokenScope = keyof typeof TokenScopeEnum; // 'READ' | 'WRITE' | 'READ_WRITE'
