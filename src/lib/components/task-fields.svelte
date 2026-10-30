<script lang="ts">
	import { Input } from '#lib/components/ui/input/index.js';
	import { Label } from '#lib/components/ui/label/index.js';
	import { Textarea } from '#lib/components/ui/textarea/index.js';
	import NativeSelect from '#lib/components/native-select.svelte';
	import { PRIORITIES, STATUSES } from '#lib/constants.js';

	type TaskValues = {
		title?: string;
		projectId?: number;
		assigneeId?: number | null;
		priority?: string;
		status?: string;
		startDate?: string | null;
		dueDate?: string | null;
		estHours?: number;
		actualHours?: number;
		progress?: number;
		note?: string | null;
	};

	let {
		task = {},
		users,
		projects,
		full = true
	}: {
		task?: TaskValues;
		users: { id: number; name: string }[];
		projects?: { id: number; name: string }[];
		/** false = member view: only status, progress, actual hours and note. */
		full?: boolean;
	} = $props();
</script>

<div class="grid gap-4 sm:grid-cols-2">
	{#if full}
		<div class="grid gap-1.5 sm:col-span-2">
			<Label for="title">ชื่องาน</Label>
			<Input id="title" name="title" value={task.title ?? ''} required />
		</div>
		{#if projects}
			<div class="grid gap-1.5">
				<Label for="projectId">โปรเจกต์</Label>
				<NativeSelect id="projectId" name="projectId" value={String(task.projectId ?? '')}>
					{#each projects as p (p.id)}<option value={String(p.id)}>{p.name}</option>{/each}
				</NativeSelect>
			</div>
		{/if}
		<div class="grid gap-1.5">
			<Label for="assigneeId">ผู้รับผิดชอบ</Label>
			<NativeSelect id="assigneeId" name="assigneeId" value={String(task.assigneeId ?? '')}>
				<option value="">— ไม่ระบุ —</option>
				{#each users as u (u.id)}<option value={String(u.id)}>{u.name}</option>{/each}
			</NativeSelect>
		</div>
		<div class="grid gap-1.5">
			<Label for="priority">ความสำคัญ</Label>
			<NativeSelect id="priority" name="priority" value={task.priority ?? 'medium'}>
				{#each PRIORITIES as p (p.key)}<option value={p.key}>{p.th}</option>{/each}
			</NativeSelect>
		</div>
		<div class="grid gap-1.5">
			<Label for="startDate">วันเริ่ม</Label>
			<Input id="startDate" name="startDate" type="date" value={task.startDate ?? ''} />
		</div>
		<div class="grid gap-1.5">
			<Label for="dueDate">กำหนดส่ง</Label>
			<Input id="dueDate" name="dueDate" type="date" value={task.dueDate ?? ''} />
		</div>
		<div class="grid gap-1.5">
			<Label for="estHours">ชั่วโมงประเมิน</Label>
			<Input id="estHours" name="estHours" type="number" min="0" step="0.5" value={task.estHours ?? 0} />
		</div>
	{/if}
	<div class="grid gap-1.5">
		<Label for="status">สถานะ</Label>
		<NativeSelect id="status" name="status" value={task.status ?? 'todo'}>
			{#each STATUSES as s (s.key)}<option value={s.key}>{s.label} · {s.th}</option>{/each}
		</NativeSelect>
	</div>
	<div class="grid gap-1.5">
		<Label for="progress">% ความคืบหน้า</Label>
		<Input id="progress" name="progress" type="number" min="0" max="100" value={task.progress ?? 0} />
	</div>
	<div class="grid gap-1.5">
		<Label for="actualHours">ชั่วโมงจริง</Label>
		<Input id="actualHours" name="actualHours" type="number" min="0" step="0.5" value={task.actualHours ?? 0} />
	</div>
	<div class="grid gap-1.5 sm:col-span-2">
		<Label for="note">หมายเหตุ</Label>
		<Textarea id="note" name="note" rows={2} value={task.note ?? ''} />
	</div>
</div>
