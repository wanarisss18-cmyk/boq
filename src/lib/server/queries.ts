import { asc, eq, type SQL } from 'drizzle-orm';
import { db } from './db';
import { projects, tasks, users } from './db/schema';

/** All tasks joined with project and assignee names, ordered by code. */
export function taskRows(where?: SQL) {
	return base().where(where).orderBy(asc(tasks.code));
}

function base() {
	return db
		.select({
			id: tasks.id,
			code: tasks.code,
			title: tasks.title,
			status: tasks.status,
			priority: tasks.priority,
			startDate: tasks.startDate,
			dueDate: tasks.dueDate,
			estHours: tasks.estHours,
			actualHours: tasks.actualHours,
			progress: tasks.progress,
			note: tasks.note,
			projectId: tasks.projectId,
			projectName: projects.name,
			assigneeId: tasks.assigneeId,
			assigneeName: users.name
		})
		.from(tasks)
		.innerJoin(projects, eq(tasks.projectId, projects.id))
		.leftJoin(users, eq(tasks.assigneeId, users.id))
		.$dynamic();
}

export type TaskRow = Awaited<ReturnType<typeof taskRows>>[number];

export function activeUsers() {
	return db
		.select({ id: users.id, name: users.name })
		.from(users)
		.where(eq(users.active, true))
		.orderBy(asc(users.id));
}

export function allProjects() {
	return db.select({ id: projects.id, name: projects.name }).from(projects).orderBy(asc(projects.id));
}
