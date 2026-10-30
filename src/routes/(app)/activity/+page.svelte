<script lang="ts">
	import { goto } from '$app/navigation';
	import * as Card from '#lib/components/ui/card/index.js';
	import { Button } from '#lib/components/ui/button/index.js';
	import NativeSelect from '#lib/components/native-select.svelte';
	import ActivityList from '#lib/components/activity-list.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	function href(patch: Record<string, string | number>) {
		const params = new URLSearchParams({ ...data.filter, page: String(data.page), ...patch } as Record<string, string>);
		for (const [k, v] of [...params]) if (!v || (k === 'page' && v === '1')) params.delete(k);
		return `?${params}`;
	}
</script>

<svelte:head><title>ประวัติการแก้ไข · Project Tracker</title></svelte:head>

<div class="space-y-4">
	<div class="flex flex-wrap items-end justify-between gap-3">
		<div>
			<h1 class="text-2xl font-semibold">ประวัติการแก้ไข (Activity Log)</h1>
			<p class="text-sm text-muted-foreground">บันทึกว่าใครแก้อะไรเมื่อไร ทั้งหมด {data.total} รายการ · ข้อมูลไม่ถูกเขียนทับ ย้อนกลับได้</p>
		</div>
		<div class="flex gap-2">
			<NativeSelect class="w-40" value={data.filter.user} onchange={(e) => goto(href({ user: e.currentTarget.value, page: 1 }))}>
				<option value="">ทุกคน</option>
				{#each data.users as u (u.id)}<option value={String(u.id)}>{u.name}</option>{/each}
			</NativeSelect>
			<NativeSelect class="w-36" value={data.filter.type} onchange={(e) => goto(href({ type: e.currentTarget.value, page: 1 }))}>
				<option value="">ทุกประเภท</option>
				<option value="task">งาน</option>
				<option value="project">โปรเจกต์</option>
				<option value="user">พนักงาน</option>
				<option value="auth">Login/Logout</option>
			</NativeSelect>
		</div>
	</div>

	<Card.Root>
		<Card.Content><ActivityList logs={data.logs} /></Card.Content>
	</Card.Root>

	{#if data.pages > 1}
		<div class="flex items-center justify-center gap-3 text-sm">
			<Button variant="outline" size="sm" href={href({ page: data.page - 1 })} disabled={data.page <= 1}>← ก่อนหน้า</Button>
			<span>หน้า {data.page} / {data.pages}</span>
			<Button variant="outline" size="sm" href={href({ page: data.page + 1 })} disabled={data.page >= data.pages}>ถัดไป →</Button>
		</div>
	{/if}
</div>
