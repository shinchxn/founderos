import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { PgDatabase } from 'drizzle-orm/pg-core';
import * as schema from './schema';

let sql: postgres.Sql | null = null;
let dbInstance: any = null;

const FakePgSession = function() {};
Object.defineProperty(FakePgSession, 'name', { value: 'PgSession', configurable: true });

export function getDb() {
  if (!dbInstance) {
    const urlString = process.env.DATABASE_URL;
    if (!urlString) {
      console.warn("[Drizzle] Warning: DATABASE_URL is not set. Using dummy client with PgDatabase prototype for build/initialization phase.");
      const dummy = Object.create(PgDatabase.prototype);
      Object.assign(dummy, {
        dialect: "pg",
        session: {
          constructor: FakePgSession
        },
        query: {},
        select: () => ({ from: () => ({ where: () => ({ limit: () => [] }) }) }),
        update: () => ({ set: () => ({ where: () => [] }) }),
        delete: () => ({ where: () => [] }),
        insert: () => ({ values: () => [] }),
      });
      return dummy;
    }
    sql = postgres(urlString, { ssl: 'require' });
    dbInstance = drizzle(sql, { schema });
  }
  return dbInstance as ReturnType<typeof drizzle<typeof schema>>;
}

type AppDatabase = ReturnType<typeof drizzle<typeof schema>>;

export const db = new Proxy({} as AppDatabase, {
  get: (target, prop) => {
    const realDb = getDb() as any;
    const value = realDb[prop];
    if (prop === 'session' && value) {
      return new Proxy(value, {
        get(sessionTarget, sessionProp) {
          if (sessionProp === 'constructor') {
            return FakePgSession;
          }
          return sessionTarget[sessionProp];
        },
        has(sessionTarget, sessionProp) {
          return sessionProp === 'constructor' || sessionProp in sessionTarget;
        }
      });
    }
    return value;
  },
  has: (target, prop) => {
    const realDb = getDb() as any;
    return prop === 'session' || prop in realDb;
  },
  getPrototypeOf: (target) => {
    return Object.getPrototypeOf(getDb());
  }
}) as AppDatabase;
