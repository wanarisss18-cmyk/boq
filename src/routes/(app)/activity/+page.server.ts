import { and, count, eq, type SQL } from 'drizzle-orm';
import { db } from '#lib/server/db/index.js';
import { activityLogs } from '#lib/server/db/schema.js';
import { activeUsers } from '#lib/server/queries.js';
import { loadLogs } from '#lib/server/present.js';
import { requireUser } from '#lib/server/guards.js';
import { revertLog } from '#lib/server/tasks.js';
import type { Actions, PageServerLoad } from './$types';

const PAGE_SIZE = 50;
const TYPES = ['task', 'project', 'user', 'auth'] as const;

export const load: PageServerLoad = async ({ locals, url }) => {
	const user = requireUser(locals);
	const who = url.searchParams.get('user') ?? '';
	const type = url.searchParams.get('type') ?? '';
	const pageNo = Math.max(1, Number(url.searchParams.get('page')) || 1);

	const filters: SQL[] = [];
	if (who) filters.push(eq(activityLogs.userId, Number(who)));
	if ((TYPES as readonly string[]).includes(type)) filters.push(eq(activityLogs.entityType, type as (typeof TYPES)[number]));
	const where = and(...filters);

	const [logs, [{ total }], users] = await Promise.all([
		loadLogs(user, where, PAGE_SIZE, (pageNo - 1) * PAGE_SIZE),
		db.select({ total: count() }).from(activityLogs).where(where),
		activeUsers()
	]);
	return { logs, users, filter: { user: who, type }, page: pageNo, pages: Math.max(1, Math.ceil(total / PAGE_SIZE)), total };
};

export const actions: Actions = {
	revert: async ({ request, locals }) => {
		const user = requireUser(locals);
		const logId = Number((await request.formData()).get('logId'));
		await revertLog(user, logId);
		return { message: `ย้อนกลับการแก้ไข #${logId} แล้ว` };
	}
};
