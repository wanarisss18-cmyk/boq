<script lang="ts">
	import { enhance } from '$app/forms';
	import { page } from '$app/state';
	import * as Card from '#lib/components/ui/card/index.js';
	import { Button } from '#lib/components/ui/button/index.js';
	import StatusBadge from '#lib/components/status-badge.svelte';
	import DueBadge from '#lib/components/due-badge.svelte';
	import TaskFields from '#lib/components/task-fields.svelte';
	import ActivityList from '#lib/components/activity-list.svelte';
	import { formatDate, priorityLabel } from '#lib/constants.js';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	const isAdmin = $derived(page.data.user?.role === 'admin');
	const t = $derived(data.task);
</script>

<svelte:head><title>{t.code} · Project Tracker</title></svelte:head>

<div class="space-y-6">
	<div>
		<a href="/projects/{t.projectId}" class="text-sm text-muted-foreground hover:underline">← {t.projectName}</a>
		<h1 class="text-2xl font-semibold"><span class="text-muted-foreground">{t.code}</span> {t.title}</h1>
		<div class="mt-2 flex flex-wrap items-center gap-3 text-sm">
			<StatusBadge status={t.status} />
			<span>ผู้รับผิดชอบ: <b>{t.assigneeName ?? '-'}</b></span>
			<span>ความสำคัญ: {priorityLabel(t.priority)}</span>
			<span>เริ่ม {formatDate(t.startDate)}</span>
			<span>กำหนดส่ง <DueBadge task={t} /></span>
			<span>คืบหน้า {t.progress}%</span>
		</div>
	</div>

	<div class="grid gap-6 xl:grid-cols-[3fr_2fr]">
		<Card.Root>
			<Card.Header>
				<Card.Title>อัปเดตงาน</Card.Title>
				{#if !data.canEdit}
					<Card.Description>คุณดูได้อย่างเดียว — แก้ไขได้เฉพาะผู้รับผิดชอบงานหรือ Admin</Card.Description>
				{:else if !isAdmin}
					<Card.Description>พนักงานอัปเดตได้: สถานะ, % ความคืบหน้า, ชั่วโมงจริง, หมายเหตุ</Card.Description>
				{/if}
			</Card.Header>
			<Card.Content>
				{#if data.canEdit}
					<form method="POST" action="?/update" use:enhance={() => async ({ update }) => update({ reset: false })} class="space-y-4">
						{#key t}
							<TaskFields task={t} users={data.users} projects={data.projects} full={isAdmin} />
						{/key}
						<div class="flex items-center gap-3">
							<Button type="submit">บันทึก</Button>
							{#if form?.message}<span class="text-sm text-emerald-700">{form.message}</span>{/if}
						</div>
					</form>
					{#if isAdmin}
						<form
							method="POST"
							action="?/delete"
							class="mt-6 border-t pt-4"
							use:enhance={({ cancel }) => {
								if (!confirm(`ลบงาน ${t.code}?`)) cancel();
							}}
						>
							<Button type="submit" variant="destructive" size="sm">ลบงานนี้</Button>
						</form>
					{/if}
				{:else}
					<dl class="grid grid-cols-2 gap-2 text-sm">
						<dt class="text-muted-foreground">ชั่วโมงประเมิน / จริง</dt>
						<dd>{t.estHours} / {t.actualHours}</dd>
						<dt class="text-muted-foreground">หมายเหตุ</dt>
						<dd>{t.note ?? '-'}</dd>
					</dl>
				{/if}
			</Card.Content>
		</Card.Root>

		<Card.Root>
			<Card.Header>
				<Card.Title>ประวัติการแก้ไข</Card.Title>
				<Card.Description>ทุกการเปลี่ยนแปลงถูกบันทึก กด "ย้อนกลับ" เพื่อคืนค่าก่อนแก้ไข</Card.Description>
			</Card.Header>
			<Card.Content><ActivityList logs={data.history} showLinks={false} /></Card.Content>
		</Card.Root>
	</div>
</div>
