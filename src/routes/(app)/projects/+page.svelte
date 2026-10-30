<script lang="ts">
	import { enhance } from '$app/forms';
	import { page } from '$app/state';
	import * as Card from '#lib/components/ui/card/index.js';
	import { Button } from '#lib/components/ui/button/index.js';
	import { Input } from '#lib/components/ui/input/index.js';
	import { colorFor } from '#lib/constants.js';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	const isAdmin = $derived(page.data.user?.role === 'admin');
</script>

<svelte:head><title>โปรเจกต์ · Project Tracker</title></svelte:head>

<div class="space-y-6">
	<h1 class="text-2xl font-semibold">โปรเจกต์</h1>

	{#if isAdmin}
		<Card.Root>
			<Card.Content>
				<form method="POST" action="?/create" use:enhance class="flex flex-wrap items-end gap-2">
					<Input name="name" placeholder="ชื่อลูกค้า / โครงการ" class="w-64" required />
					<Input name="description" placeholder="รายละเอียด (ไม่บังคับ)" class="min-w-64 flex-1" />
					<Button type="submit">+ เพิ่มโปรเจกต์</Button>
				</form>
				{#if form?.message}<p class="mt-2 text-sm text-destructive">{form.message}</p>{/if}
			</Card.Content>
		</Card.Root>
	{/if}

	<div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
		{#each data.projects as p (p.id)}
			<a href="/projects/{p.id}" class="block">
				<Card.Root class="h-full overflow-hidden pt-0 transition-shadow hover:shadow-lg">
					<div class="h-2 bg-gradient-to-r {colorFor(p.id).band}"></div>
					<Card.Header>
						<Card.Title class={colorFor(p.id).text}>{p.name}</Card.Title>
						<Card.Description>{p.members.join(', ') || 'ยังไม่มีผู้รับผิดชอบ'}</Card.Description>
					</Card.Header>
					<Card.Content class="space-y-2 text-sm">
						<div class="flex justify-between">
							<span>เสร็จ {p.done}/{p.total} งาน</span>
							{#if p.overdue}<span class="font-medium text-red-600">เลยกำหนด {p.overdue}</span>{/if}
						</div>
						<div class="flex items-center gap-2">
							<div class="h-2 flex-1 rounded-full bg-muted"><div class="h-2 rounded-full bg-gradient-to-r {colorFor(p.id).band}" style="width:{p.avgProgress}%"></div></div>
							<span class="text-xs">{p.avgProgress}%</span>
						</div>
					</Card.Content>
				</Card.Root>
			</a>
		{/each}
	</div>
</div>
