export enum Role {
  ADMIN = 'ADMIN',
  USER = 'USER',
}

export type PublicUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
  isActive: boolean; 
  createdAt: Date;
};
