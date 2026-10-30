import { fail } from '@sveltejs/kit';
import { and, eq, type SQL } from 'drizzle-orm';
import { tasks } from '#lib/server/db/schema.js';
import { activeUsers, allProjects, taskRows } from '#lib/server/queries.js';
import { canEditTask, updateTask } from '#lib/server/tasks.js';
import { requireUser } from '#lib/server/guards.js';
import { STATUSES, type Status } from '#lib/constants.js';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	const user = requireUser(locals);
	const project = url.searchParams.get('project') ?? '';
	const assignee = url.searchParams.get('assignee') ?? '';

	const filters: SQL[] = [];
	if (project) filters.push(eq(tasks.projectId, Number(project)));
	if (assignee) filters.push(eq(tasks.assigneeId, assignee === 'me' ? user.id : Number(assignee)));

	const [rows, users, projects] = await Promise.all([taskRows(and(...filters)), activeUsers(), allProjects()]);
	return {
		tasks: rows.map((t) => ({ ...t, canEdit: canEditTask(user, t) })),
		users,
		projects,
		filter: { project, assignee }
	};
};

export const actions: Actions = {
	move: async ({ request, locals }) => {
		const user = requireUser(locals);
		const form = await request.formData();
		const id = Number(form.get('taskId'));
		const status = String(form.get('status')) as Status;
		if (!id || !STATUSES.some((s) => s.key === status)) return fail(400, { message: 'ข้อมูลไม่ถูกต้อง' });
		await updateTask(user, id, { status });
		return { ok: true };
	}
};
