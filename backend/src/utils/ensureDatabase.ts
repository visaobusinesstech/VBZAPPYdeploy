import { execSync } from "child_process";
import sequelize from "../database";

export async function ensureDatabase(): Promise<void> {
  try {
    await sequelize.query('SELECT 1 FROM "Companies" LIMIT 1');
  } catch {
    try {
      execSync('node node_modules/sequelize-cli/lib/sequelize db:migrate', {
        stdio: "inherit",
        env: process.env
      });
      await sequelize.query('SELECT 1 FROM "Companies" LIMIT 1');
      return;
    } catch {
      try {
        await sequelize.query('DROP TABLE IF EXISTS "SequelizeMeta"');
        execSync('node node_modules/sequelize-cli/lib/sequelize db:migrate', {
          stdio: "inherit",
          env: process.env
        });
      } catch {}
    }
  }
  try {
    await sequelize.query('SELECT 1 FROM "Inventories" LIMIT 1');
  } catch {
    try {
      execSync('node node_modules/sequelize-cli/lib/sequelize db:migrate', {
        stdio: "inherit",
        env: process.env
      });
    } catch {}
  }
  try {
    await sequelize.query('ALTER TABLE "Inventories" ADD COLUMN IF NOT EXISTS "currency" VARCHAR(10) DEFAULT \'BRL\'');
    await sequelize.query('ALTER TABLE "Inventories" ADD COLUMN IF NOT EXISTS "image" TEXT');
    await sequelize.query('ALTER TABLE "Inventories" ADD COLUMN IF NOT EXISTS "sku" VARCHAR(255)');
    await sequelize.query('ALTER TABLE "Inventories" ADD COLUMN IF NOT EXISTS "category" VARCHAR(255)');
    await sequelize.query('ALTER TABLE "Inventories" ADD COLUMN IF NOT EXISTS "brand" VARCHAR(255)');
    await sequelize.query('ALTER TABLE "Inventories" ADD COLUMN IF NOT EXISTS "description" TEXT');
  } catch {}
}
