import { db } from './db';
import { activityLogs, type ActivityLog, type FieldChange } from './db/schema';

type LogInput = Omit<typeof activityLogs.$inferInsert, 'id' | 'createdAt'>;

export async function logActivity(entry: LogInput) {
	await db.insert(activityLogs).values(entry);
}

/** Field-by-field diff of `next` against `prev`, limited to keys present in `next`. */
export function diff<T extends Record<string, unknown>>(prev: T, next: Partial<T>) {
	const changes: Record<string, FieldChange> = {};
	for (const key of Object.keys(next)) {
		const from = prev[key] ?? null;
		const to = next[key] ?? null;
		if (from !== to) changes[key] = { from, to };
	}
	return changes;
}

export type { ActivityLog };
