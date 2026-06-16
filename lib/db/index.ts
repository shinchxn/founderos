import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from './schema';

let sql: postgres.Sql | null = null;
let dbInstance: ReturnType<typeof drizzle<typeof schema>> | null = null;

export function getInstance() {
  if (!dbInstance) {
    const urlString = process.env.DATABASE_URL;
    if (!urlString) {
      throw new Error("DATABASE_URL not configured");
    }
    sql = postgres(urlString, { ssl: 'require' });
    dbInstance = drizzle(sql, { schema });
  }
  return dbInstance;
}

type AppDatabase = ReturnType<typeof drizzle<typeof schema>>;

export const db = new Proxy({} as AppDatabase, {
  get(_, prop: string) {
    const instance = getInstance() as any;
    const value = instance[prop];
    if (typeof value === "function") {
      return value.bind(instance);
    }
    return value;
  }
});
