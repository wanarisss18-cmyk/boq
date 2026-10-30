<script lang="ts">
	import { enhance } from '$app/forms';
	import { page } from '$app/state';
	import * as Card from '#lib/components/ui/card/index.js';
	import * as Table from '#lib/components/ui/table/index.js';
	import { Button } from '#lib/components/ui/button/index.js';
	import { Input } from '#lib/components/ui/input/index.js';
	import StatusBadge from '#lib/components/status-badge.svelte';
	import DueBadge from '#lib/components/due-badge.svelte';
	import TaskFields from '#lib/components/task-fields.svelte';
	import { priorityLabel } from '#lib/constants.js';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	const isAdmin = $derived(page.data.user?.role === 'admin');
	let showAdd = $state(false);
	let showEdit = $state(false);
</script>

<svelte:head><title>{data.project.name} · Project Tracker</title></svelte:head>

<div class="space-y-6">
	<div class="flex flex-wrap items-start justify-between gap-3">
		<div>
			<a href="/projects" class="text-sm text-muted-foreground hover:underline">← โปรเจกต์ทั้งหมด</a>
			<h1 class="text-2xl font-semibold">{data.project.name}</h1>
			{#if data.project.description}<p class="text-sm text-muted-foreground">{data.project.description}</p>{/if}
		</div>
		<div class="flex gap-2">
			<Button variant="outline" href="/board?project={data.project.id}">ดูแบบ Kanban</Button>
			{#if isAdmin}
				<Button variant="outline" onclick={() => (showEdit = !showEdit)}>แก้ไขโปรเจกต์</Button>
				<Button onclick={() => (showAdd = !showAdd)}>+ เพิ่มงาน</Button>
			{/if}
		</div>
	</div>

	{#if form?.message}<p class="rounded-lg bg-muted px-3 py-2 text-sm">{form.message}</p>{/if}

	{#if isAdmin && showEdit}
		<Card.Root>
			<Card.Content class="space-y-3">
				<form method="POST" action="?/update" use:enhance class="flex flex-wrap gap-2">
					<Input name="name" value={data.project.name} class="w-64" required />
					<Input name="description" value={data.project.description ?? ''} placeholder="รายละเอียด" class="min-w-64 flex-1" />
					<Button type="submit">บันทึก</Button>
				</form>
				<form
					method="POST"
					action="?/delete"
					use:enhance={({ cancel }) => {
						if (!confirm(`ลบโปรเจกต์ "${data.project.name}" และงานทั้งหมด ${data.tasks.length} งาน?`)) cancel();
					}}
				>
					<Button type="submit" variant="destructive" size="sm">ลบโปรเจกต์</Button>
				</form>
			</Card.Content>
		</Card.Root>
	{/if}

	{#if isAdmin && showAdd}
		<Card.Root>
			<Card.Header><Card.Title>เพิ่มงานใหม่</Card.Title></Card.Header>
			<Card.Content>
				<form
					method="POST"
					action="?/addTask"
					use:enhance={() =>
						async ({ result, update }) => {
							await update();
							if (result.type === 'success') showAdd = false;
						}}
					class="space-y-4"
				>
					<TaskFields users={data.users} />
					<Button type="submit">บันทึกงาน</Button>
				</form>
			</Card.Content>
		</Card.Root>
	{/if}

	<Card.Root>
		<Card.Content>
			<Table.Root>
				<Table.Header>
					<Table.Row>
						<Table.Head>รหัส</Table.Head>
						<Table.Head>ชื่องาน</Table.Head>
						<Table.Head>ผู้รับผิดชอบ</Table.Head>
						<Table.Head>ความสำคัญ</Table.Head>
						<Table.Head>สถานะ</Table.Head>
						<Table.Head>ความคืบหน้า</Table.Head>
						<Table.Head>กำหนดส่ง</Table.Head>
						<Table.Head class="text-right">ชม. ประเมิน/จริง</Table.Head>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#each data.tasks as t (t.id)}
						<Table.Row>
							<Table.Cell class="text-muted-foreground">{t.code}</Table.Cell>
							<Table.Cell class="max-w-80 whitespace-normal"><a href="/tasks/{t.id}" class="hover:underline">{t.title}</a></Table.Cell>
							<Table.Cell>{t.assigneeName ?? '-'}</Table.Cell>
							<Table.Cell>{priorityLabel(t.priority)}</Table.Cell>
							<Table.Cell><StatusBadge status={t.status} /></Table.Cell>
							<Table.Cell>{t.progress}%</Table.Cell>
							<Table.Cell><DueBadge task={t} /></Table.Cell>
							<Table.Cell class="text-right">{t.estHours} / {t.actualHours}</Table.Cell>
						</Table.Row>
					{:else}
						<Table.Row><Table.Cell colspan={8} class="text-center text-muted-foreground">ยังไม่มีงาน</Table.Cell></Table.Row>
					{/each}
				</Table.Body>
			</Table.Root>
		</Card.Content>
	</Card.Root>
</div>
