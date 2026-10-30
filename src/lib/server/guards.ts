import { error, redirect } from '@sveltejs/kit';
import type { SessionUser } from './auth';

export function requireUser(locals: App.Locals): SessionUser {
	if (!locals.user) redirect(303, '/login');
	return locals.user;
}

export function requireAdmin(locals: App.Locals): SessionUser {
	const user = requireUser(locals);
	if (user.role !== 'admin') error(403, 'เฉพาะ Admin เท่านั้น');
	return user;
}
