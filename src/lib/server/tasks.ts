import { error } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { db } from './db';
import { activityLogs, tasks, type Task } from './db/schema';
import { diff, logActivity } from './activity';
import { FIELD_LABELS, statusLabel, type Priority, type Status } from '#lib/constants.js';
import type { SessionUser } from './auth';

export type TaskPatch = Partial<
	Pick<
		Task,
		| 'title'
		| 'projectId'
		| 'assigneeId'
		| 'priority'
		| 'status'
		| 'startDate'
		| 'dueDate'
		| 'estHours'
		| 'actualHours'
		| 'progress'
		| 'note'
	>
>;

/** Fields a regular member may change on a task assigned to them. */
export const MEMBER_FIELDS = ['status', 'progress', 'actualHours', 'note'] as const;

export function canEditTask(user: SessionUser, task: Pick<Task, 'assigneeId'>) {
	return user.role === 'admin' || task.assigneeId === user.id;
}

const STATUS_KEYS = ['todo', 'doing', 'done'];
const PRIORITY_KEYS = ['high', 'medium', 'low'];

/** Parse a task form into a patch; only fields present in the form are included. */
export function parseTaskForm(form: FormData): TaskPatch {
	const patch: TaskPatch = {};
	const str = (k: string) => {
		const v = form.get(k);
		return v === null ? undefined : String(v).trim();
	};
	const num = (k: string) => {
		const v = str(k);
		if (v === undefined) return undefined;
		const n = Number(v || 0);
		return Number.isFinite(n) ? n : 0;
	};
	if (str('title') !== undefined) patch.title = str('title');
	if (str('projectId') !== undefined) patch.projectId = num('projectId');
	if (str('assigneeId') !== undefined) patch.assigneeId = str('assigneeId') ? num('assigneeId')! : null;
	const priority = str('priority');
	if (priority && PRIORITY_KEYS.includes(priority)) patch.priority = priority as Priority;
	const status = str('status');
	if (status && STATUS_KEYS.includes(status)) patch.status = status as Status;
	if (str('startDate') !== undefined) patch.startDate = str('startDate') || null;
	if (str('dueDate') !== undefined) patch.dueDate = str('dueDate') || null;
	if (str('estHours') !== undefined) patch.estHours = Math.max(0, num('estHours')!);
	if (str('actualHours') !== undefined) patch.actualHours = Math.max(0, num('actualHours')!);
	if (str('progress') !== undefined)
		patch.progress = Math.min(100, Math.max(0, Math.round(num('progress')!)));
	if (str('note') !== undefined) patch.note = str('note') || null;
	return patch;
}

function describe(code: string, changes: Record<string, { from: unknown; to: unknown }>) {
	const parts = Object.entries(changes).map(([k, c]) =>
		k === 'status'
			? `สถานะ ${statusLabel(String(c.from))} → ${statusLabel(String(c.to))}`
			: FIELD_LABELS[k] ?? k
	);
	return `แก้ไขงาน ${code}: ${parts.join(', ')}`;
}

export async function updateTask(
	user: SessionUser,
	taskId: number,
	patch: TaskPatch,
	opts: { action?: 'update' | 'revert'; summary?: string } = {}
) {
	const task = await db.query.tasks.findFirst({ where: eq(tasks.id, taskId) });
	if (!task) error(404, 'ไม่พบงาน');
	if (!canEditTask(user, task)) error(403, 'คุณแก้ไขได้เฉพาะงานของตัวเอง');

	if (user.role !== 'admin') {
		for (const key of Object.keys(patch)) {
			if (!(MEMBER_FIELDS as readonly string[]).includes(key)) delete patch[key as keyof TaskPatch];
		}
	}
	// Moving to Done implies the work is complete.
	if (patch.status === 'done' && task.status !== 'done' && patch.progress === undefined && task.progress < 100) {
		patch.progress = 100;
	}

	const changes = diff(task, patch);
	if (Object.keys(changes).length === 0) return task;

	const [updated] = await db
		.update(tasks)
		.set({ ...patch, updatedAt: new Date() })
		.where(eq(tasks.id, taskId))
		.returning();
	await logActivity({
		userId: user.id,
		entityType: 'task',
		entityId: taskId,
		action: opts.action ?? 'update',
		summary: opts.summary ?? describe(task.code, changes),
		changes
	});
	return updated;
}

/** Undo a logged task edit by restoring each field's previous value. */
export async function revertLog(user: SessionUser, logId: number) {
	const log = await db.query.activityLogs.findFirst({ where: eq(activityLogs.id, logId) });
	if (!log || log.entityType !== 'task' || !log.entityId || !log.changes) {
		error(400, 'รายการนี้ย้อนกลับไม่ได้');
	}
	if (log.action !== 'update' && log.action !== 'revert') error(400, 'รายการนี้ย้อนกลับไม่ได้');

	const patch = Object.fromEntries(
		Object.entries(log.changes).map(([k, c]) => [k, c.from])
	) as TaskPatch;
	if (user.role !== 'admin' && Object.keys(patch).some((k) => !(MEMBER_FIELDS as readonly string[]).includes(k))) {
		error(403, 'การแก้ไขนี้มีฟิลด์ที่เฉพาะ Admin ย้อนกลับได้');
	}
	return updateTask(user, log.entityId, patch, {
		action: 'revert',
		summary: `ย้อนกลับการแก้ไข #${log.id} (${log.summary})`
	});
}
