import { asc } from 'drizzle-orm';
import { db } from '#lib/server/db/index.js';
import { projects, users } from '#lib/server/db/schema.js';
import { taskRows, type TaskRow } from '#lib/server/queries.js';
import { loadLogs } from '#lib/server/present.js';
import { daysUntil, isDueSoon, isOverdue, todayISO } from '#lib/constants.js';
import type { PageServerLoad } from './$types';

function summarize(list: TaskRow[], today: string) {
	const done = list.filter((t) => t.status === 'done').length;
	return {
		total: list.length,
		todo: list.filter((t) => t.status === 'todo').length,
		doing: list.filter((t) => t.status === 'doing').length,
		done,
		overdue: list.filter((t) => isOverdue(t, today)).length,
		dueSoon: list.filter((t) => isDueSoon(t, today)).length,
		estHours: list.reduce((s, t) => s + t.estHours, 0),
		actualHours: list.reduce((s, t) => s + t.actualHours, 0),
		donePct: list.length ? Math.round((done / list.length) * 100) : 0,
		avgProgress: list.length ? Math.round(list.reduce((s, t) => s + t.progress, 0) / list.length) : 0
	};
}

export const load: PageServerLoad = async ({ locals }) => {
	const today = todayISO();
	const [all, people, projectList, recent] = await Promise.all([
		taskRows(),
		db.select().from(users).orderBy(asc(users.id)),
		db.select().from(projects).orderBy(asc(projects.id)),
		loadLogs(locals.user!, undefined, 8)
	]);

	const byPerson = people
		.map((u) => ({
			id: u.id,
			name: u.name,
			position: u.position,
			active: u.active,
			...summarize(all.filter((t) => t.assigneeId === u.id), today)
		}))
		.filter((p) => p.total > 0 || p.active);

	const byProject = projectList.map((p) => ({
		id: p.id,
		name: p.name,
		...summarize(all.filter((t) => t.projectId === p.id), today)
	}));

	const overdue = all
		.filter((t) => isOverdue(t, today))
		.map((t) => ({ ...t, daysLate: -daysUntil(t.dueDate!, today) }))
		.sort((a, b) => b.daysLate - a.daysLate);
	const dueSoon = all.filter((t) => isDueSoon(t, today)).sort((a, b) => a.dueDate!.localeCompare(b.dueDate!));

	const mine = all.filter((t) => t.assigneeId === locals.user!.id && t.status !== 'done');

	return { today, totals: summarize(all, today), byPerson, byProject, overdue, dueSoon, mine, recent };
};
