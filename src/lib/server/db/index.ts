import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from './schema';

// Local dev uses a SQLite file through libsql. When moving to Cloudflare D1,
// replace this with `drizzle(platform.env.DB, { schema })` from 'drizzle-orm/d1';
// the schema and every query stay the same.
const client = createClient({ url: process.env.DATABASE_URL || 'file:local.db' });

export const db = drizzle(client, { schema });
export { schema };
