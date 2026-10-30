import { error, fail, redirect } from '@sveltejs/kit';
import { and, eq, like, ne } from 'drizzle-orm';
import { db } from '#lib/server/db/index.js';
import { projects, tasks } from '#lib/server/db/schema.js';
import { activeUsers, taskRows } from '#lib/server/queries.js';
import { diff, logActivity } from '#lib/server/activity.js';
import { requireAdmin, requireUser } from '#lib/server/guards.js';
import { parseTaskForm } from '#lib/server/tasks.js';
import type { Actions, PageServerLoad } from './$types';

async function getProject(id: number) {
	const project = await db.query.projects.findFirst({ where: eq(projects.id, id) });
	if (!project) error(404, 'ไม่พบโปรเจกต์');
	return project;
}

/** Next T-### code after the highest existing one. */
async function nextTaskCode() {
	const rows = await db.select({ code: tasks.code }).from(tasks).where(like(tasks.code, 'T-%'));
	const max = Math.max(0, ...rows.map((r) => parseInt(r.code.slice(2)) || 0));
	return `T-${String(max + 1).padStart(3, '0')}`;
}

export const load: PageServerLoad = async ({ params, locals }) => {
	const user = requireUser(locals);
	const project = await getProject(Number(params.id));
	const [rows, users] = await Promise.all([taskRows(eq(tasks.projectId, project.id)), activeUsers()]);
	return {
		project,
		tasks: rows.map((t) => ({ ...t, canEdit: user.role === 'admin' || t.assigneeId === user.id })),
		users
	};
};

export const actions: Actions = {
	addTask: async ({ request, params, locals }) => {
		const user = requireAdmin(locals);
		const project = await getProject(Number(params.id));
		const patch = parseTaskForm(await request.formData());
		if (!patch.title) return fail(400, { message: 'กรุณากรอกชื่องาน' });
		const code = await nextTaskCode();
		const [t] = await db
			.insert(tasks)
			.values({ ...patch, title: patch.title, code, projectId: project.id })
			.returning();
		await logActivity({
			userId: user.id,
			entityType: 'task',
			entityId: t.id,
			action: 'create',
			summary: `สร้างงาน ${code} "${t.title}" ในโปรเจกต์ ${project.name}`
		});
		return { message: `เพิ่มงาน ${code} แล้ว` };
	},

	update: async ({ request, params, locals }) => {
		const user = requireAdmin(locals);
		const project = await getProject(Number(params.id));
		const form = await request.formData();
		const next = {
			name: String(form.get('name') ?? '').trim(),
			description: String(form.get('description') ?? '').trim() || null
		};
		if (!next.name) return fail(400, { message: 'กรุณากรอกชื่อโปรเจกต์' });
		const dup = await db.query.projects.findFirst({
			where: and(eq(projects.name, next.name), ne(projects.id, project.id))
		});
		if (dup) return fail(400, { message: 'มีโปรเจกต์ชื่อนี้แล้ว' });
		const changes = diff(project, next);
		if (Object.keys(changes).length) {
			await db.update(projects).set(next).where(eq(projects.id, project.id));
			await logActivity({
				userId: user.id,
				entityType: 'project',
				entityId: project.id,
				action: 'update',
				summary: `แก้ไขโปรเจกต์ "${next.name}"`,
				changes
			});
		}
		return { message: 'บันทึกแล้ว' };
	},

	delete: async ({ params, locals }) => {
		const user = requireAdmin(locals);
		const project = await getProject(Number(params.id));
		const count = (await db.select({ id: tasks.id }).from(tasks).where(eq(tasks.projectId, project.id))).length;
		// Explicit rather than relying on FK cascade, which depends on PRAGMA foreign_keys.
		await db.delete(tasks).where(eq(tasks.projectId, project.id));
		await db.delete(projects).where(eq(projects.id, project.id));
		await logActivity({
			userId: user.id,
			entityType: 'project',
			entityId: project.id,
			action: 'delete',
			summary: `ลบโปรเจกต์ "${project.name}" พร้อมงาน ${count} งาน`
		});
		redirect(303, '/projects');
	}
};
