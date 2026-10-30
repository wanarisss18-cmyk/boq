// Client-safe labels and helpers shared by server and UI.

export const STATUSES = [
	{ key: 'todo', label: 'To do', th: 'ยังไม่เริ่ม' },
	{ key: 'doing', label: 'Doing', th: 'กำลังทำ' },
	{ key: 'done', label: 'Done', th: 'เสร็จแล้ว' }
] as const;
export type Status = (typeof STATUSES)[number]['key'];

export const PRIORITIES = [
	{ key: 'high', th: 'สูง' },
	{ key: 'medium', th: 'กลาง' },
	{ key: 'low', th: 'ต่ำ' }
] as const;
export type Priority = (typeof PRIORITIES)[number]['key'];

export const statusLabel = (s: string) => STATUSES.find((x) => x.key === s)?.label ?? s;
export const priorityLabel = (p: string) => PRIORITIES.find((x) => x.key === p)?.th ?? p;

export const FIELD_LABELS: Record<string, string> = {
	code: 'รหัสงาน',
	title: 'ชื่องาน',
	projectId: 'โปรเจกต์',
	assigneeId: 'ผู้รับผิดชอบ',
	priority: 'ความสำคัญ',
	status: 'สถานะ',
	startDate: 'วันเริ่ม',
	dueDate: 'กำหนดส่ง',
	estHours: 'ชั่วโมงประเมิน',
	actualHours: 'ชั่วโมงจริง',
	progress: '% ความคืบหน้า',
	note: 'หมายเหตุ',
	name: 'ชื่อ',
	description: 'รายละเอียด',
	email: 'อีเมล',
	role: 'สิทธิ์',
	position: 'ตำแหน่ง',
	duty: 'หน้าที่หลัก',
	level: 'ระดับ',
	active: 'สถานะบัญชี',
	password: 'รหัสผ่าน'
};

/** Today's date as YYYY-MM-DD in Bangkok time. */
export function todayISO() {
	return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok' }).format(new Date());
}

/** Whole days from `today` until `due` (negative = late). */
export function daysUntil(due: string, today = todayISO()) {
	return Math.round((Date.parse(due) - Date.parse(today)) / 86_400_000);
}

export function isOverdue(t: { status: string; dueDate: string | null }, today = todayISO()) {
	return t.status !== 'done' && !!t.dueDate && t.dueDate < today;
}

export function isDueSoon(t: { status: string; dueDate: string | null }, today = todayISO()) {
	if (t.status === 'done' || !t.dueDate) return false;
	const d = daysUntil(t.dueDate, today);
	return d >= 0 && d <= 3;
}

export function formatDate(iso: string | null | undefined) {
	if (!iso) return '-';
	const [y, m, d] = iso.split('-');
	return `${d}/${m}/${y}`;
}

export function formatDateTime(value: Date | string | number) {
	return new Intl.DateTimeFormat('th-TH', {
		dateStyle: 'medium',
		timeStyle: 'short',
		timeZone: 'Asia/Bangkok'
	}).format(new Date(value));
}

/**
 * Accent colours handed out by id so each person/project keeps the same colour everywhere.
 * Class names are written out in full so Tailwind can see them.
 */
export const PALETTE = [
	{ solid: 'bg-blue-500', soft: 'bg-blue-50', text: 'text-blue-700', border: 'border-l-blue-500', band: 'from-blue-500 to-sky-400' },
	{ solid: 'bg-violet-500', soft: 'bg-violet-50', text: 'text-violet-700', border: 'border-l-violet-500', band: 'from-violet-500 to-fuchsia-400' },
	{ solid: 'bg-emerald-500', soft: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-l-emerald-500', band: 'from-emerald-500 to-teal-400' },
	{ solid: 'bg-amber-500', soft: 'bg-amber-50', text: 'text-amber-700', border: 'border-l-amber-500', band: 'from-amber-500 to-yellow-400' },
	{ solid: 'bg-pink-500', soft: 'bg-pink-50', text: 'text-pink-700', border: 'border-l-pink-500', band: 'from-pink-500 to-rose-400' },
	{ solid: 'bg-cyan-500', soft: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-l-cyan-500', band: 'from-cyan-500 to-sky-400' },
	{ solid: 'bg-orange-500', soft: 'bg-orange-50', text: 'text-orange-700', border: 'border-l-orange-500', band: 'from-orange-500 to-amber-400' },
	{ solid: 'bg-indigo-500', soft: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-l-indigo-500', band: 'from-indigo-500 to-blue-400' },
	{ solid: 'bg-teal-500', soft: 'bg-teal-50', text: 'text-teal-700', border: 'border-l-teal-500', band: 'from-teal-500 to-emerald-400' },
	{ solid: 'bg-rose-500', soft: 'bg-rose-50', text: 'text-rose-700', border: 'border-l-rose-500', band: 'from-rose-500 to-pink-400' },
	{ solid: 'bg-lime-600', soft: 'bg-lime-50', text: 'text-lime-700', border: 'border-l-lime-600', band: 'from-lime-600 to-green-400' },
	{ solid: 'bg-purple-500', soft: 'bg-purple-50', text: 'text-purple-700', border: 'border-l-purple-500', band: 'from-purple-500 to-violet-400' }
] as const;

export const colorFor = (id: number | null | undefined) => PALETTE[Math.abs(id ?? 0) % PALETTE.length];
