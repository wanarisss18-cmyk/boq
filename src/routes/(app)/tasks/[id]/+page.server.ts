import { error, redirect } from '@sveltejs/kit';
import { and, eq } from 'drizzle-orm';
import { db } from '#lib/server/db/index.js';
import { activityLogs, tasks } from '#lib/server/db/schema.js';
import { activeUsers, allProjects, taskRows } from '#lib/server/queries.js';
import { logActivity } from '#lib/server/activity.js';
import { loadLogs } from '#lib/server/present.js';
import { requireAdmin, requireUser } from '#lib/server/guards.js';
import { canEditTask, parseTaskForm, updateTask } from '#lib/server/tasks.js';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
	const user = requireUser(locals);
	const id = Number(params.id);
	const [task] = await taskRows(eq(tasks.id, id));
	if (!task) error(404, 'ไม่พบงาน');
	const [users, projects, history] = await Promise.all([
		activeUsers(),
		allProjects(),
		loadLogs(user, and(eq(activityLogs.entityType, 'task'), eq(activityLogs.entityId, id)), 200)
	]);
	return { task, users, projects, history, canEdit: canEditTask(user, task) };
};

export const actions: Actions = {
	update: async ({ request, params, locals }) => {
		const user = requireUser(locals);
		await updateTask(user, Number(params.id), parseTaskForm(await request.formData()));
		return { message: 'บันทึกแล้ว' };
	},

	delete: async ({ params, locals }) => {
		const user = requireAdmin(locals);
		const task = await db.query.tasks.findFirst({ where: eq(tasks.id, Number(params.id)) });
		if (!task) error(404, 'ไม่พบงาน');
		await db.delete(tasks).where(eq(tasks.id, task.id));
		await logActivity({
			userId: user.id,
			entityType: 'task',
			entityId: task.id,
			action: 'delete',
			summary: `ลบงาน ${task.code} "${task.title}"`
		});
		redirect(303, `/projects/${task.projectId}`);
	}
};
