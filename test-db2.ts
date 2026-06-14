import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import fs from 'fs';

async function testConnection() {
  try {
    const envFile = fs.readFileSync('.env.local', 'utf-8');
    const dbUrlMatch = envFile.match(/DATABASE_URL=(.*)/);
    const urlString = dbUrlMatch ? dbUrlMatch[1] : undefined;
    if (!urlString) throw new Error("No URL");
    console.log(urlString);
    const sql = postgres(urlString, { ssl: 'require' });
    const result = await sql`SELECT 1`;
    console.log("Connection successful:", result);
    process.exit(0);
  } catch (err) {
    console.error("Connection failed:", err);
    process.exit(1);
  }
}
testConnection();
