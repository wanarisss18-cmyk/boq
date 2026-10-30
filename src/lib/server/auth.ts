import { eq } from 'drizzle-orm';
import type { Cookies } from '@sveltejs/kit';
import { db } from './db';
import { sessions, users } from './db/schema';

const DAY = 24 * 60 * 60 * 1000;
const SESSION_DAYS = 30;
export const SESSION_COOKIE = 'session';

export type SessionUser = { id: number; name: string; email: string; role: 'admin' | 'member' };

async function sha256Hex(input: string) {
	const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
	return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function randomToken() {
	const bytes = crypto.getRandomValues(new Uint8Array(32));
	return [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
}

// Only the SHA-256 of the token is stored, so a leaked DB can't be replayed as cookies.
export async function createSession(userId: number) {
	const token = randomToken();
	const expiresAt = new Date(Date.now() + SESSION_DAYS * DAY);
	await db.insert(sessions).values({ id: await sha256Hex(token), userId, expiresAt });
	return { token, expiresAt };
}

export async function validateSession(token: string) {
	const id = await sha256Hex(token);
	const [row] = await db
		.select({
			expiresAt: sessions.expiresAt,
			id: users.id,
			name: users.name,
			email: users.email,
			role: users.role,
			active: users.active
		})
		.from(sessions)
		.innerJoin(users, eq(sessions.userId, users.id))
		.where(eq(sessions.id, id));
	if (!row) return null;
	if (row.expiresAt.getTime() < Date.now() || !row.active) {
		await db.delete(sessions).where(eq(sessions.id, id));
		return null;
	}
	// Sliding expiry: renew once less than half the lifetime remains.
	let expiresAt = row.expiresAt;
	if (expiresAt.getTime() - Date.now() < (SESSION_DAYS / 2) * DAY) {
		expiresAt = new Date(Date.now() + SESSION_DAYS * DAY);
		await db.update(sessions).set({ expiresAt }).where(eq(sessions.id, id));
	}
	const user: SessionUser = { id: row.id, name: row.name, email: row.email, role: row.role };
	return { expiresAt, user };
}

export async function invalidateSession(token: string) {
	await db.delete(sessions).where(eq(sessions.id, await sha256Hex(token)));
}

export async function invalidateUserSessions(userId: number) {
	await db.delete(sessions).where(eq(sessions.userId, userId));
}

export function setSessionCookie(cookies: Cookies, token: string, expiresAt: Date) {
	cookies.set(SESSION_COOKIE, token, { path: '/', httpOnly: true, sameSite: 'lax', expires: expiresAt });
}

export function clearSessionCookie(cookies: Cookies) {
	cookies.delete(SESSION_COOKIE, { path: '/' });
}
