import "dotenv/config";
import { defineConfig, env } from "prisma/config";

// Detectamos si el comando que estás corriendo en la terminal es una migración
const isMigrating = process.argv.some(arg => arg.includes('migrate') || arg.includes('db'));

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Si estamos migrando usa el puerto directo 5432, si no, usa el pooler 6543
    url: isMigrating ? env("MIGRATION_URL") : env("DATABASE_URL"),
  },
});
