// Minimal typing for the Workers runtime module (provided in dev by adapter-cloudflare).
declare module 'cloudflare:workers' {
	export const env: Cloudflare.Env;
}
