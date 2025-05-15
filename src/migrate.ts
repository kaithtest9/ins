import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';
import appConfig from './config'; // For DATABASE_URL

// Note: We are no longer importing from '../drizzle.config.ts' to avoid rootDir issues.
// The migrationsFolder path must be kept in sync with the 'out' property in drizzle.config.ts.
const MIGRATIONS_OUTPUT_DIR = './drizzle_migrations';

async function runMigrations() {
  if (!appConfig.DATABASE_URL) {
    console.error("ERROR: DATABASE_URL is not defined in .env for migrations.");
    process.exit(1);
  }

  console.log("Connecting to database for migrations...");
  const migrationPool = new Pool({ connectionString: appConfig.DATABASE_URL, max: 1 });
  const dbClient = drizzle(migrationPool);

  console.log(`Running migrations from '${MIGRATIONS_OUTPUT_DIR}' folder...`);

  try {
    await migrate(dbClient, { migrationsFolder: MIGRATIONS_OUTPUT_DIR });
    console.log("Migrations applied successfully.");
  } catch (error) {
    console.error("Error applying migrations:", error);
    await migrationPool.end();
    process.exit(1);
  }

  await migrationPool.end();
  console.log("Migration pool closed.");
  process.exit(0);
}

runMigrations().catch((err) => {
  console.error("FATAL: Unhandled error during migration process:", err);
  process.exit(1);
});