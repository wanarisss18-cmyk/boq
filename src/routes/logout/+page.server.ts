import { redirect } from '@sveltejs/kit';
import { SESSION_COOKIE, clearSessionCookie, invalidateSession } from '#lib/server/auth.js';
import { logActivity } from '#lib/server/activity.js';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = () => {
	redirect(303, '/');
};

export const actions: Actions = {
	default: async ({ cookies, locals }) => {
		const token = cookies.get(SESSION_COOKIE);
		if (token) await invalidateSession(token);
		clearSessionCookie(cookies);
		if (locals.user) {
			await logActivity({
				userId: locals.user.id,
				entityType: 'auth',
				entityId: locals.user.id,
				action: 'logout',
				summary: `${locals.user.name} ออกจากระบบ`
			});
		}
		redirect(303, '/login');
	}
};
