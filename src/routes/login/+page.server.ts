import { fail, redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { db } from '#lib/server/db/index.js';
import { users } from '#lib/server/db/schema.js';
import { verifyPassword } from '#lib/server/password.js';
import { createSession, setSessionCookie } from '#lib/server/auth.js';
import { logActivity } from '#lib/server/activity.js';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = ({ locals }) => {
	if (locals.user) redirect(303, '/dashboard');
};

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const form = await request.formData();
		const email = String(form.get('email') ?? '').trim().toLowerCase();
		const password = String(form.get('password') ?? '');
		if (!email || !password) return fail(400, { email, message: 'กรุณากรอกอีเมลและรหัสผ่าน' });

		const user = await db.query.users.findFirst({ where: eq(users.email, email) });
		if (!user || !(await verifyPassword(password, user.passwordHash))) {
			return fail(400, { email, message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });
		}
		if (!user.active) return fail(403, { email, message: 'บัญชีนี้ถูกปิดการใช้งาน กรุณาติดต่อ Admin' });

		const { token, expiresAt } = await createSession(user.id);
		setSessionCookie(cookies, token, expiresAt);
		await logActivity({
			userId: user.id,
			entityType: 'auth',
			entityId: user.id,
			action: 'login',
			summary: `${user.name} เข้าสู่ระบบ`
		});
		redirect(303, '/dashboard');
	}
};
