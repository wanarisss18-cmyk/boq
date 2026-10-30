<script lang="ts">
	import { enhance } from '$app/forms';
	import * as Card from '#lib/components/ui/card/index.js';
	import * as Table from '#lib/components/ui/table/index.js';
	import { Button } from '#lib/components/ui/button/index.js';
	import { Input } from '#lib/components/ui/input/index.js';
	import { Label } from '#lib/components/ui/label/index.js';
	import NativeSelect from '#lib/components/native-select.svelte';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	let showAdd = $state(false);
</script>

<svelte:head><title>พนักงาน · Project Tracker</title></svelte:head>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<h1 class="text-2xl font-semibold">จัดการพนักงาน</h1>
		<Button onclick={() => (showAdd = !showAdd)}>+ เพิ่มพนักงาน</Button>
	</div>

	{#if form?.message}<p class="rounded-lg bg-muted px-3 py-2 text-sm">{form.message}</p>{/if}

	{#if showAdd}
		<Card.Root>
			<Card.Header><Card.Title>เพิ่มพนักงานใหม่</Card.Title></Card.Header>
			<Card.Content>
				<form
					method="POST"
					action="?/create"
					class="grid gap-4 sm:grid-cols-3"
					use:enhance={() =>
						async ({ result, update }) => {
							await update();
							if (result.type === 'success') showAdd = false;
						}}
				>
					<div class="grid gap-1.5"><Label for="name">ชื่อ</Label><Input id="name" name="name" required /></div>
					<div class="grid gap-1.5"><Label for="email">อีเมล (ใช้ Login)</Label><Input id="email" name="email" type="email" required /></div>
					<div class="grid gap-1.5"><Label for="password">รหัสผ่านเริ่มต้น</Label><Input id="password" name="password" type="text" minlength={8} required /></div>
					<div class="grid gap-1.5"><Label for="position">ตำแหน่ง</Label><Input id="position" name="position" /></div>
					<div class="grid gap-1.5"><Label for="level">ระดับ</Label><Input id="level" name="level" /></div>
					<div class="grid gap-1.5">
						<Label for="role">สิทธิ์</Label>
						<NativeSelect id="role" name="role"><option value="member">พนักงาน</option><option value="admin">Admin</option></NativeSelect>
					</div>
					<div class="grid gap-1.5 sm:col-span-2"><Label for="duty">หน้าที่หลัก</Label><Input id="duty" name="duty" /></div>
					<div class="grid gap-1.5"><Label for="startDate">วันเริ่มงาน</Label><Input id="startDate" name="startDate" type="date" /></div>
					<div class="sm:col-span-3"><Button type="submit">บันทึก</Button></div>
				</form>
			</Card.Content>
		</Card.Root>
	{/if}

	<Card.Root>
		<Card.Content>
			<Table.Root>
				<Table.Header>
					<Table.Row>
						<Table.Head>ชื่อ</Table.Head>
						<Table.Head>อีเมล</Table.Head>
						<Table.Head>ตำแหน่ง</Table.Head>
						<Table.Head>ระดับ</Table.Head>
						<Table.Head>สิทธิ์</Table.Head>
						<Table.Head class="text-right">งานค้าง</Table.Head>
						<Table.Head>สถานะ</Table.Head>
						<Table.Head></Table.Head>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#each data.employees as e (e.id)}
						<Table.Row class={e.active ? '' : 'opacity-50'}>
							<Table.Cell class="font-medium">{e.name}</Table.Cell>
							<Table.Cell>{e.email}</Table.Cell>
							<Table.Cell>{e.position ?? '-'}</Table.Cell>
							<Table.Cell>{e.level ?? '-'}</Table.Cell>
							<Table.Cell>{e.role === 'admin' ? 'Admin' : 'พนักงาน'}</Table.Cell>
							<Table.Cell class="text-right">{e.openTasks}</Table.Cell>
							<Table.Cell>{e.active ? 'ใช้งาน' : 'ปิดใช้งาน'}</Table.Cell>
							<Table.Cell class="text-right"><Button variant="outline" size="sm" href="/employees/{e.id}">แก้ไข</Button></Table.Cell>
						</Table.Row>
					{/each}
				</Table.Body>
			</Table.Root>
		</Card.Content>
	</Card.Root>
</div>
