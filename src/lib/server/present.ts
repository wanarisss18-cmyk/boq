import { desc, eq, and, type SQL } from 'drizzle-orm';
import { db } from './db';
import { activityLogs, projects, tasks, users } from './db/schema';
import { FIELD_LABELS, formatDate, priorityLabel, statusLabel } from '#lib/constants.js';
import { MEMBER_FIELDS } from './tasks';
import type { SessionUser } from './auth';

export type LogView = {
	id: number;
	createdAt: Date;
	userName: string;
	action: string;
	entityType: string;
	entityId: number | null;
	summary: string;
	details: string[];
	revertable: boolean;
};

/** Load activity logs with display-ready change details and revert permission. */
export async function loadLogs(viewer: SessionUser, where?: SQL, limit = 50, offset = 0) {
	const rows = await db
		.select({ log: activityLogs, userName: users.name, taskId: tasks.id, assigneeId: tasks.assigneeId })
		.from(activityLogs)
		.leftJoin(users, eq(activityLogs.userId, users.id))
		.leftJoin(tasks, and(eq(activityLogs.entityType, 'task'), eq(activityLogs.entityId, tasks.id)))
		.where(where)
		.orderBy(desc(activityLogs.createdAt), desc(activityLogs.id))
		.limit(limit)
		.offset(offset);

	const [userList, projectList] = await Promise.all([
		db.select({ id: users.id, name: users.name }).from(users),
		db.select({ id: projects.id, name: projects.name }).from(projects)
	]);
	const userName = new Map(userList.map((u) => [u.id, u.name]));
	const projectName = new Map(projectList.map((p) => [p.id, p.name]));

	const show = (field: string, v: unknown): string => {
		if (v === null || v === undefined || v === '') return '—';
		switch (field) {
			case 'status':
				return statusLabel(String(v));
			case 'priority':
				return priorityLabel(String(v));
			case 'assigneeId':
				return userName.get(Number(v)) ?? `#${v}`;
			case 'projectId':
				return projectName.get(Number(v)) ?? `#${v}`;
			case 'startDate':
			case 'dueDate':
				return formatDate(String(v));
			case 'progress':
				return `${v}%`;
			case 'active':
				return v ? 'ใช้งาน' : 'ปิดใช้งาน';
			default:
				return String(v);
		}
	};

	return rows.map(({ log, userName: name, taskId, assigneeId }): LogView => {
		const fields = Object.keys(log.changes ?? {});
		const taskExists = taskId !== null;
		const revertable =
			log.entityType === 'task' &&
			(log.action === 'update' || log.action === 'revert') &&
			fields.length > 0 &&
			taskExists &&
			(viewer.role === 'admin' ||
				(assigneeId === viewer.id && fields.every((f) => (MEMBER_FIELDS as readonly string[]).includes(f))));
		return {
			id: log.id,
			createdAt: log.createdAt,
			userName: name ?? 'ระบบ',
			action: log.action,
			entityType: log.entityType,
			entityId: log.entityId,
			summary: log.summary,
			details: Object.entries(log.changes ?? {}).map(
				([k, c]) => `${FIELD_LABELS[k] ?? k}: ${show(k, c.from)} → ${show(k, c.to)}`
			),
			revertable
		};
	});
}
