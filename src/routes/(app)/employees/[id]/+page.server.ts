import { error, fail, redirect } from '@sveltejs/kit';
import { and, eq, ne } from 'drizzle-orm';
import { db } from '#lib/server/db/index.js';
import { tasks, users } from '#lib/server/db/schema.js';
import { hashPassword } from '#lib/server/password.js';
import { diff, logActivity } from '#lib/server/activity.js';
import { invalidateUserSessions } from '#lib/server/auth.js';
import { requireAdmin } from '#lib/server/guards.js';
import { MIN_PASSWORD, parseEmployeeForm } from '#lib/server/employees.js';
import type { Actions, PageServerLoad } from './$types';

async function getUser(id: number) {
	const user = await db.query.users.findFirst({ where: eq(users.id, id) });
	if (!user) error(404, 'ไม่พบพนักงาน');
	return user;
}

async function otherActiveAdmins(id: number) {
	return (
		await db
			.select({ id: users.id })
			.from(users)
			.where(and(eq(users.role, 'admin'), eq(users.active, true), ne(users.id, id)))
	).length;
}

export const load: PageServerLoad = async ({ params, locals }) => {
	requireAdmin(locals);
	const { passwordHash: _, ...employee } = await getUser(Number(params.id));
	const taskCount = (await db.select({ id: tasks.id }).from(tasks).where(eq(tasks.assigneeId, employee.id))).length;
	return { employee, taskCount };
};

export const actions: Actions = {
	update: async ({ request, params, locals }) => {
		const admin = requireAdmin(locals);
		const user = await getUser(Number(params.id));
		const input = parseEmployeeForm(await request.formData());
		if ('error' in input) return fail(400, { message: input.error });
		const dup = await db.query.users.findFirst({ where: and(eq(users.email, input.email), ne(users.id, user.id)) });
		if (dup) return fail(400, { message: 'อีเมลนี้มีในระบบแล้ว' });
		if (user.role === 'admin' && input.role !== 'admin' && (await otherActiveAdmins(user.id)) === 0) {
			return fail(400, { message: 'ต้องมี Admin อย่างน้อย 1 คน' });
		}
		const changes = diff(user, input);
		if (Object.keys(changes).length) {
			await db.update(users).set(input).where(eq(users.id, user.id));
			await logActivity({
				userId: admin.id,
				entityType: 'user',
				entityId: user.id,
				action: 'update',
				summary: `แก้ไขข้อมูลพนักงาน ${input.name}`,
				changes
			});
		}
		return { message: 'บันทึกแล้ว' };
	},

	resetPassword: async ({ request, params, locals }) => {
		const admin = requireAdmin(locals);
		const user = await getUser(Number(params.id));
		const password = String((await request.formData()).get('password') ?? '');
		if (password.length < MIN_PASSWORD) return fail(400, { message: `รหัสผ่านต้องมีอย่างน้อย ${MIN_PASSWORD} ตัวอักษร` });
		await db.update(users).set({ passwordHash: await hashPassword(password) }).where(eq(users.id, user.id));
		await invalidateUserSessions(user.id);
		await logActivity({
			userId: admin.id,
			entityType: 'user',
			entityId: user.id,
			action: 'update',
			summary: `รีเซ็ตรหัสผ่านของ ${user.name}`
		});
		return { message: 'รีเซ็ตรหัสผ่านแล้ว' };
	},

	toggleActive: async ({ params, locals }) => {
		const admin = requireAdmin(locals);
		const user = await getUser(Number(params.id));
		if (user.id === admin.id) return fail(400, { message: 'ปิดการใช้งานบัญชีตัวเองไม่ได้' });
		const active = !user.active;
		await db.update(users).set({ active }).where(eq(users.id, user.id));
		if (!active) await invalidateUserSessions(user.id);
		await logActivity({
			userId: admin.id,
			entityType: 'user',
			entityId: user.id,
			action: 'update',
			summary: `${active ? 'เปิด' : 'ปิด'}การใช้งานบัญชี ${user.name}`,
			changes: { active: { from: user.active, to: active } }
		});
		return { message: active ? 'เปิดการใช้งานแล้ว' : 'ปิดการใช้งานแล้ว (ข้อมูลและประวัติยังอยู่ครบ)' };
	},

	delete: async ({ params, locals }) => {
		const admin = requireAdmin(locals);
		const user = await getUser(Number(params.id));
		if (user.id === admin.id) return fail(400, { message: 'ลบบัญชีตัวเองไม่ได้' });
		const assigned = (await db.select({ id: tasks.id }).from(tasks).where(eq(tasks.assigneeId, user.id))).length;
		if (assigned) return fail(400, { message: `ยังมีงานที่รับผิดชอบ ${assigned} งาน — โอนงานก่อน หรือใช้ "ปิดการใช้งาน" แทน` });
		await db.delete(users).where(eq(users.id, user.id));
		await logActivity({
			userId: admin.id,
			entityType: 'user',
			entityId: user.id,
			action: 'delete',
			summary: `ลบพนักงาน ${user.name} (${user.email})`
		});
		redirect(303, '/employees');
	}
};
