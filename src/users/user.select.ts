// src/users/user.select.ts
export const userSelectPublic = {
  id: true,
  email: true,
  name: true,
  role: true,
  createdAt: true,
} as const;
