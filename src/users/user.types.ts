// src/users/user.types.ts
export enum Role {
  ADMIN = 'ADMIN',
  USER = 'USER',
}

export type PublicUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
  createdAt: Date;
};
