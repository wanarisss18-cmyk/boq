import { fail, redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { db } from '#lib/server/db/index.js';
import { projects } from '#lib/server/db/schema.js';
import { allProjects, taskRows } from '#lib/server/queries.js';
import { logActivity } from '#lib/server/activity.js';
import { requireAdmin } from '#lib/server/guards.js';
import { isOverdue } from '#lib/constants.js';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const [list, rows] = await Promise.all([allProjects(), taskRows()]);
	return {
		projects: list.map((p) => {
			const ts = rows.filter((t) => t.projectId === p.id);
			return {
				...p,
				total: ts.length,
				done: ts.filter((t) => t.status === 'done').length,
				overdue: ts.filter((t) => isOverdue(t)).length,
				avgProgress: ts.length ? Math.round(ts.reduce((s, t) => s + t.progress, 0) / ts.length) : 0,
				members: [...new Set(ts.map((t) => t.assigneeName).filter(Boolean))]
			};
		})
	};
};

export const actions: Actions = {
	create: async ({ request, locals }) => {
		const user = requireAdmin(locals);
		const form = await request.formData();
		const name = String(form.get('name') ?? '').trim();
		const description = String(form.get('description') ?? '').trim() || null;
		if (!name) return fail(400, { message: 'กรุณากรอกชื่อโปรเจกต์' });
		if (await db.query.projects.findFirst({ where: eq(projects.name, name) })) {
			return fail(400, { message: 'มีโปรเจกต์ชื่อนี้แล้ว' });
		}
		const [p] = await db.insert(projects).values({ name, description }).returning();
		await logActivity({
			userId: user.id,
			entityType: 'project',
			entityId: p.id,
			action: 'create',
			summary: `สร้างโปรเจกต์ "${name}"`
		});
		redirect(303, `/projects/${p.id}`);
	}
};
