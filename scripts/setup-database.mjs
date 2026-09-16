import postgres from "postgres";
import { readFile } from "node:fs/promises";
const connection =
  process.env.DATABASE_URL ||
  process.env.SUPABASE_DB_URL ||
  process.env.POSTGRES_URL;
if (!connection) {
  console.error(
    "Database setup needs DATABASE_URL. Run the migration in the Supabase SQL editor instead.",
  );
  process.exit(1);
}
const sql = postgres(connection, {
  ssl: "require",
  max: 1,
  connect_timeout: 15,
});
try {
  await sql.unsafe(
    await readFile(
      new URL(
        "../supabase/migrations/202609160001_directory.sql",
        import.meta.url,
      ),
      "utf8",
    ),
  );
  console.log("Database migration applied.");
} catch (e) {
  console.error("Database setup failed:", e.code || e.name);
  process.exitCode = 1;
} finally {
  await sql.end();
}
