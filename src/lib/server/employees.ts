export type EmployeeInput = {
	name: string;
	email: string;
	role: 'admin' | 'member';
	position: string | null;
	duty: string | null;
	level: string | null;
	startDate: string | null;
};

export function parseEmployeeForm(form: FormData): EmployeeInput | { error: string } {
	const s = (k: string) => String(form.get(k) ?? '').trim();
	const name = s('name');
	const email = s('email').toLowerCase();
	if (!name) return { error: 'กรุณากรอกชื่อ' };
	if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { error: 'อีเมลไม่ถูกต้อง' };
	return {
		name,
		email,
		role: s('role') === 'admin' ? 'admin' : 'member',
		position: s('position') || null,
		duty: s('duty') || null,
		level: s('level') || null,
		startDate: s('startDate') || null
	};
}

export const MIN_PASSWORD = 8;
