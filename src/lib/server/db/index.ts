import { env } from 'cloudflare:workers';
import { drizzle, type DrizzleD1Database } from 'drizzle-orm/d1';
import * as schema from './schema';

type DB = DrizzleD1Database<typeof schema>;

let instance: DB | undefined;

// D1 everywhere: on Cloudflare via the real binding, in `npm run dev` via the
// adapter's local emulation (state in .wrangler/). Created lazily because the
// binding is only reachable while handling a request, not at build time.
export const db = new Proxy({} as DB, {
	get(_, prop) {
		instance ??= drizzle(env.DB, { schema });
		return Reflect.get(instance, prop, instance);
	}
});

export { schema };
