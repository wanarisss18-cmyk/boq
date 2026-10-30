/**
 * Import the sample Excel (data/project_tracking_sample.xlsx) as initial data.
 * Usage: npm run db:seed [-- path/to/file.xlsx]
 *
 * Wipes all tables first, so only run it on a fresh/dev database.
 */
import XLSX from 'xlsx';
import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from '../src/lib/server/db/schema';
import { hashPassword } from '../src/lib/server/password';

// Test credentials for local development only (see README).
const ADMIN = { name: 'Admin', email: 'admin@example.com', password: 'admin1234' };
const DEFAULT_PASSWORD = 'password1234';
// The team lead in the sheet gets admin rights so they can manage the team.
const LEAD_POSITION = 'หัวหน้าทีม';

const STATUS_MAP: Record<string, { status: 'todo' | 'doing' | 'done'; tag?: string }> = {
	ยังไม่เริ่ม: { status: 'todo' },
	กำลังดำเนินการ: { status: 'doing' },
	รอตรวจ: { status: 'doing', tag: 'รอตรวจ' },
	ระงับ: { status: 'doing', tag: 'ระงับ' },
	เสร็จแล้ว: { status: 'done' }
};
const PRIORITY_MAP: Record<string, 'high' | 'medium' | 'low'> = {
	สูง: 'high',
	กลาง: 'medium',
	ต่ำ: 'low'
};

type Row = (string | undefined)[];

/** Rows below the header row whose first cell equals `firstHeader`. */
function tableRows(wb: XLSX.WorkBook, sheet: string, firstHeader: string) {
	const ws = wb.Sheets[sheet];
	if (!ws) throw new Error(`Sheet "${sheet}" not found`);
	const rows = XLSX.utils.sheet_to_json<Row>(ws, { header: 1, raw: false, defval: undefined });
	const h = rows.findIndex((r) => r?.[0]?.trim() === firstHeader);
	if (h < 0) throw new Error(`Header "${firstHeader}" not found in "${sheet}"`);
	const header = rows[h].map((c) => c?.trim() ?? '');
	return rows
		.slice(h + 1)
		.filter((r) => r?.[0]?.trim())
		.map((r) => Object.fromEntries(header.map((k, i) => [k, r[i]?.toString().trim() ?? ''])));
}

/** "dd/mm/yyyy" -> "yyyy-mm-dd" */
function toISO(d: string) {
	const m = d.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
	return m ? `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}` : null;
}

async function main() {
	const file = process.argv[2] ?? 'data/project_tracking_sample.xlsx';
	const wb = XLSX.readFile(file);
	const team = tableRows(wb, 'ทีมงาน', 'ลำดับ');
	const taskRows = tableRows(wb, 'งานทั้งหมด', 'รหัสงาน');

	const client = createClient({ url: process.env.DATABASE_URL ?? 'file:local.db' });
	const db = drizzle(client, { schema });
	const { users, projects, tasks, activityLogs, sessions } = schema;

	await db.delete(activityLogs);
	await db.delete(sessions);
	await db.delete(tasks);
	await db.delete(projects);
	await db.delete(users);

	const [admin] = await db
		.insert(users)
		.values({ name: ADMIN.name, email: ADMIN.email, role: 'admin', position: 'System Admin', passwordHash: await hashPassword(ADMIN.password) })
		.returning();

	const memberHash = await hashPassword(DEFAULT_PASSWORD);
	const userIdByName = new Map<string, number>();
	for (const r of team) {
		const [u] = await db
			.insert(users)
			.values({
				name: r['ชื่อ'],
				email: r['อีเมล'].toLowerCase(),
				role: r['ตำแหน่ง'].includes(LEAD_POSITION) ? 'admin' : 'member',
				position: r['ตำแหน่ง'] || null,
				duty: r['หน้าที่หลัก'] || null,
				level: r['ระดับ'] || null,
				startDate: toISO(r['วันเริ่มงาน']),
				passwordHash: memberHash
			})
			.returning();
		userIdByName.set(u.name, u.id);
	}

	const projectIdByName = new Map<string, number>();
	for (const name of new Set(taskRows.map((r) => r['ลูกค้า / โครงการ']))) {
		const [p] = await db.insert(projects).values({ name }).returning();
		projectIdByName.set(name, p.id);
	}

	for (const r of taskRows) {
		const mapped = STATUS_MAP[r['สถานะ']] ?? { status: 'todo' };
		const assignee = r['ผู้รับผิดชอบ'];
		if (assignee && !userIdByName.has(assignee)) console.warn(`! ${r['รหัสงาน']}: unknown assignee "${assignee}"`);
		// Excel had extra states (รอตรวจ/ระงับ); keep them visible in the note.
		const note = [mapped.tag && `[${mapped.tag}]`, r['หมายเหตุ']].filter(Boolean).join(' ') || null;
		await db.insert(tasks).values({
			code: r['รหัสงาน'],
			projectId: projectIdByName.get(r['ลูกค้า / โครงการ'])!,
			title: r['ชื่องาน'],
			assigneeId: userIdByName.get(assignee) ?? null,
			priority: PRIORITY_MAP[r['ความสำคัญ']] ?? 'medium',
			status: mapped.status,
			startDate: toISO(r['วันเริ่ม']),
			dueDate: toISO(r['กำหนดเสร็จ']),
			estHours: Number(r['ชั่วโมงประเมิน']) || 0,
			actualHours: Number(r['ชั่วโมงจริง']) || 0,
			progress: parseInt(r['% ความคืบหน้า']) || 0,
			note
		});
	}

	await db.insert(activityLogs).values({
		userId: admin.id,
		entityType: 'project',
		action: 'create',
		summary: `นำเข้าข้อมูลเริ่มต้นจาก Excel: พนักงาน ${team.length} คน, โปรเจกต์ ${projectIdByName.size} รายการ, งาน ${taskRows.length} งาน`
	});

	console.log(`Seeded ${team.length + 1} users, ${projectIdByName.size} projects, ${taskRows.length} tasks from ${file}`);
	client.close();
}

main().catch((e) => {
	console.error(e);
	process.exit(1);
});
