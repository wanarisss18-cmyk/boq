import { fail } from '@sveltejs/kit';
import { asc, eq } from 'drizzle-orm';
import { db } from '#lib/server/db/index.js';
import { users } from '#lib/server/db/schema.js';
import { taskRows } from '#lib/server/queries.js';
import { hashPassword } from '#lib/server/password.js';
import { logActivity } from '#lib/server/activity.js';
import { requireAdmin } from '#lib/server/guards.js';
import { MIN_PASSWORD, parseEmployeeForm } from '#lib/server/employees.js';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	requireAdmin(locals);
	const [list, rows] = await Promise.all([
		db
			.select({
				id: users.id,
				name: users.name,
				email: users.email,
				role: users.role,
				position: users.position,
				level: users.level,
				active: users.active
			})
			.from(users)
			.orderBy(asc(users.id)),
		taskRows()
	]);
	return {
		employees: list.map((u) => ({
			...u,
			openTasks: rows.filter((t) => t.assigneeId === u.id && t.status !== 'done').length
		}))
	};
};

export const actions: Actions = {
	create: async ({ request, locals }) => {
		const admin = requireAdmin(locals);
		const form = await request.formData();
		const input = parseEmployeeForm(form);
		if ('error' in input) return fail(400, { message: input.error });
		const password = String(form.get('password') ?? '');
		if (password.length < MIN_PASSWORD) return fail(400, { message: `รหัสผ่านต้องมีอย่างน้อย ${MIN_PASSWORD} ตัวอักษร` });
		if (await db.query.users.findFirst({ where: eq(users.email, input.email) })) {
			return fail(400, { message: 'อีเมลนี้มีในระบบแล้ว' });
		}
		const [u] = await db
			.insert(users)
			.values({ ...input, passwordHash: await hashPassword(password) })
			.returning();
		await logActivity({
			userId: admin.id,
			entityType: 'user',
			entityId: u.id,
			action: 'create',
			summary: `เพิ่มพนักงาน ${u.name} (${u.email})`
		});
		return { message: `เพิ่ม ${u.name} แล้ว` };
	}
};
