// See https://svelte.dev/docs/kit/types#app.d.ts
import type { SessionUser } from '#lib/server/auth.js';

declare global {
	namespace App {
		interface Locals {
			user: SessionUser | null;
		}
	}

	// Bindings from wrangler.toml, read via `import { env } from 'cloudflare:workers'`.
	namespace Cloudflare {
		interface Env {
			DB: import('@cloudflare/workers-types').D1Database;
		}
	}
}

export {};
