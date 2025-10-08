// prisma.config.ts
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  // sem `schema` aqui para não varrer a pasta inteira
  migrations: {
    // opcional: seeding centralizado
    seed: "tsx prisma/primary/seed.ts",
  },
});
