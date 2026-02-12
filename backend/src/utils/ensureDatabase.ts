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
}
