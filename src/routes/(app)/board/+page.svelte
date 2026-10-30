<script lang="ts">
	import { deserialize } from '$app/forms';
	import { goto, invalidateAll } from '$app/navigation';
	import ChevronLeft from '@lucide/svelte/icons/chevron-left';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import NativeSelect from '#lib/components/native-select.svelte';
	import DueBadge from '#lib/components/due-badge.svelte';
	import Avatar from '#lib/components/avatar.svelte';
	import { STATUSES, colorFor, isOverdue, priorityLabel, type Status } from '#lib/constants.js';
	import { cn } from '#lib/utils.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	// Overridden optimistically while a move is in flight, then re-synced from the server.
	let items = $derived(data.tasks);
	let dragId = $state<number | null>(null);
	let overCol = $state<Status | null>(null);
	let errorMsg = $state('');

	const columnStyle: Record<Status, { col: string; head: string }> = {
		todo: { col: 'bg-sky-50 border-sky-200', head: 'bg-gradient-to-r from-sky-600 to-sky-400' },
		doing: { col: 'bg-violet-50 border-violet-200', head: 'bg-gradient-to-r from-violet-500 to-fuchsia-400' },
		done: { col: 'bg-emerald-50 border-emerald-200', head: 'bg-gradient-to-r from-emerald-500 to-teal-400' }
	};
	const priorityStyle: Record<string, string> = {
		high: 'bg-red-50 text-red-700',
		medium: 'bg-amber-50 text-amber-700',
		low: 'bg-slate-100 text-slate-600'
	};

	function applyFilter(key: 'project' | 'assignee', value: string) {
		const params = new URLSearchParams({ ...data.filter, [key]: value });
		for (const [k, v] of [...params]) if (!v) params.delete(k);
		goto(`?${params}`, { replace: true });
	}

	async function move(id: number, status: Status) {
		const task = items.find((t) => t.id === id);
		if (!task || task.status === status || !task.canEdit) return;
		errorMsg = '';
		items = items.map((t) => (t.id === id ? { ...t, status, progress: status === 'done' ? 100 : t.progress } : t));

		const body = new FormData();
		body.set('taskId', String(id));
		body.set('status', status);
		const res = await fetch('?/move', { method: 'POST', body, headers: { 'x-sveltekit-action': 'true' } });
		const result = deserialize(await res.text());
		if (result.type === 'failure' || result.type === 'error') {
			errorMsg = result.type === 'error' ? (result.error?.message ?? 'อัปเดตไม่สำเร็จ') : 'อัปเดตไม่สำเร็จ';
		}
		await invalidateAll();
	}

	function shift(id: number, current: Status, dir: -1 | 1) {
		const i = STATUSES.findIndex((s) => s.key === current) + dir;
		if (i >= 0 && i < STATUSES.length) move(id, STATUSES[i].key);
	}
</script>

<svelte:head><title>Kanban Board · Project Tracker</title></svelte:head>

<div class="space-y-4">
	<div class="flex flex-wrap items-end justify-between gap-3">
		<div>
			<h1 class="text-2xl font-semibold">Kanban Board</h1>
			<p class="text-sm text-muted-foreground">ลากการ์ดไปคอลัมน์อื่นเพื่อเปลี่ยนสถานะ (แก้ได้เฉพาะงานของตัวเอง ยกเว้น Admin)</p>
		</div>
		<div class="flex flex-wrap gap-2">
			<NativeSelect class="w-48" value={data.filter.project} onchange={(e) => applyFilter('project', e.currentTarget.value)}>
				<option value="">ทุกโปรเจกต์</option>
				{#each data.projects as p (p.id)}<option value={String(p.id)}>{p.name}</option>{/each}
			</NativeSelect>
			<NativeSelect class="w-44" value={data.filter.assignee} onchange={(e) => applyFilter('assignee', e.currentTarget.value)}>
				<option value="">ทุกคน</option>
				<option value="me">งานของฉัน</option>
				{#each data.users as u (u.id)}<option value={String(u.id)}>{u.name}</option>{/each}
			</NativeSelect>
		</div>
	</div>

	{#if errorMsg}<p class="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{errorMsg}</p>{/if}

	<div class="grid gap-4 lg:grid-cols-3">
		{#each STATUSES as col (col.key)}
			{@const colItems = items.filter((t) => t.status === col.key)}
			<section
				aria-label={col.label}
				class={cn(
					'flex min-h-64 flex-col overflow-hidden rounded-xl border transition-shadow',
					columnStyle[col.key].col,
					overCol === col.key && 'ring-2 ring-primary/50'
				)}
				ondragover={(e) => {
					e.preventDefault();
					overCol = col.key;
				}}
				ondragleave={() => (overCol = null)}
				ondrop={(e) => {
					e.preventDefault();
					overCol = null;
					if (dragId !== null) move(dragId, col.key);
					dragId = null;
				}}
			>
				<header class="flex items-center justify-between px-3 py-2.5 text-white {columnStyle[col.key].head}">
					<h2 class="font-semibold">{col.label} <span class="text-sm font-normal text-white/80">· {col.th}</span></h2>
					<span class="rounded-full bg-white/25 px-2 text-xs font-semibold">{colItems.length}</span>
				</header>
				<div class="flex flex-1 flex-col gap-2 p-2">
					{#each colItems as t (t.id)}
						<article
							draggable={t.canEdit}
							ondragstart={() => (dragId = t.id)}
							ondragend={() => (dragId = null)}
							class={cn(
								'rounded-lg border border-l-4 bg-card p-3 shadow-sm transition-shadow hover:shadow-md',
								colorFor(t.projectId).border,
								t.canEdit ? 'cursor-grab active:cursor-grabbing' : 'opacity-80',
								isOverdue(t) && 'bg-red-50/60 ring-1 ring-red-300',
								dragId === t.id && 'opacity-50'
							)}
						>
							<div class="flex items-start justify-between gap-2">
								<span class="text-xs text-muted-foreground">{t.code} · <span class="font-medium {colorFor(t.projectId).text}">{t.projectName}</span></span>
								<span class="rounded px-1.5 text-xs {priorityStyle[t.priority]}">{priorityLabel(t.priority)}</span>
							</div>
							<a href="/tasks/{t.id}" class="mt-1 block text-sm font-medium hover:underline">{t.title}</a>
							{#if t.note}<p class="mt-1 line-clamp-2 text-xs text-muted-foreground">{t.note}</p>{/if}
							<div class="mt-2 h-1.5 rounded-full bg-muted"><div class="h-1.5 rounded-full {colorFor(t.projectId).solid}" style="width:{t.progress}%"></div></div>
							<div class="mt-2 flex items-center justify-between gap-2">
								<span class="flex min-w-0 items-center gap-1.5 text-xs">
									<Avatar id={t.assigneeId} name={t.assigneeName} />
									<span class="truncate">{t.assigneeName ?? 'ไม่มีผู้รับผิดชอบ'}</span>
								</span>
								<DueBadge task={t} />
							</div>
							{#if t.canEdit}
								<div class="mt-2 flex justify-between">
									<button
										class="rounded p-0.5 text-muted-foreground hover:bg-muted disabled:invisible"
										disabled={col.key === 'todo'}
										aria-label="ย้ายไปซ้าย"
										onclick={() => shift(t.id, col.key, -1)}><ChevronLeft class="size-4" /></button
									>
									<button
										class="rounded p-0.5 text-muted-foreground hover:bg-muted disabled:invisible"
										disabled={col.key === 'done'}
										aria-label="ย้ายไปขวา"
										onclick={() => shift(t.id, col.key, 1)}><ChevronRight class="size-4" /></button
									>
								</div>
							{/if}
						</article>
					{/each}
				</div>
			</section>
		{/each}
	</div>
</div>
