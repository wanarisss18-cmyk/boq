<script lang="ts">
	import { enhance } from '$app/forms';
	import * as Card from '#lib/components/ui/card/index.js';
	import { Button } from '#lib/components/ui/button/index.js';
	import { Input } from '#lib/components/ui/input/index.js';
	import { Label } from '#lib/components/ui/label/index.js';
	import NativeSelect from '#lib/components/native-select.svelte';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	const e = $derived(data.employee);
	const keep = () => async ({ update }: { update: (o?: { reset?: boolean }) => Promise<void> }) => update({ reset: false });
</script>

<svelte:head><title>{e.name} · พนักงาน</title></svelte:head>

<div class="max-w-3xl space-y-6">
	<div>
		<a href="/employees" class="text-sm text-muted-foreground hover:underline">← พนักงานทั้งหมด</a>
		<h1 class="text-2xl font-semibold">{e.name} {#if !e.active}<span class="text-base text-muted-foreground">(ปิดใช้งาน)</span>{/if}</h1>
		<a href="/board?assignee={e.id}" class="text-sm hover:underline">ดูงานทั้งหมด {data.taskCount} งาน →</a>
	</div>

	{#if form?.message}<p class="rounded-lg bg-muted px-3 py-2 text-sm">{form.message}</p>{/if}

	<Card.Root>
		<Card.Header><Card.Title>ข้อมูลพนักงาน</Card.Title></Card.Header>
		<Card.Content>
			<form method="POST" action="?/update" use:enhance={keep} class="grid gap-4 sm:grid-cols-2">
				<div class="grid gap-1.5"><Label for="name">ชื่อ</Label><Input id="name" name="name" value={e.name} required /></div>
				<div class="grid gap-1.5"><Label for="email">อีเมล</Label><Input id="email" name="email" type="email" value={e.email} required /></div>
				<div class="grid gap-1.5"><Label for="position">ตำแหน่ง</Label><Input id="position" name="position" value={e.position ?? ''} /></div>
				<div class="grid gap-1.5"><Label for="level">ระดับ</Label><Input id="level" name="level" value={e.level ?? ''} /></div>
				<div class="grid gap-1.5">
					<Label for="role">สิทธิ์</Label>
					<NativeSelect id="role" name="role" value={e.role}><option value="member">พนักงาน</option><option value="admin">Admin</option></NativeSelect>
				</div>
				<div class="grid gap-1.5"><Label for="startDate">วันเริ่มงาน</Label><Input id="startDate" name="startDate" type="date" value={e.startDate ?? ''} /></div>
				<div class="grid gap-1.5 sm:col-span-2"><Label for="duty">หน้าที่หลัก</Label><Input id="duty" name="duty" value={e.duty ?? ''} /></div>
				<div><Button type="submit">บันทึก</Button></div>
			</form>
		</Card.Content>
	</Card.Root>

	<Card.Root>
		<Card.Header><Card.Title>รีเซ็ตรหัสผ่าน</Card.Title></Card.Header>
		<Card.Content>
			<form method="POST" action="?/resetPassword" use:enhance class="flex gap-2">
				<Input name="password" type="text" minlength={8} placeholder="รหัสผ่านใหม่ (อย่างน้อย 8 ตัว)" class="max-w-xs" required />
				<Button type="submit" variant="outline">ตั้งรหัสผ่านใหม่</Button>
			</form>
		</Card.Content>
	</Card.Root>

	<Card.Root>
		<Card.Header>
			<Card.Title>ลดพนักงาน</Card.Title>
			<Card.Description>แนะนำ "ปิดการใช้งาน" เพื่อเก็บประวัติงานไว้ ลบถาวรได้เฉพาะคนที่ไม่มีงานค้างในระบบ</Card.Description>
		</Card.Header>
		<Card.Content class="flex gap-2">
			<form method="POST" action="?/toggleActive" use:enhance>
				<Button type="submit" variant="outline">{e.active ? 'ปิดการใช้งาน' : 'เปิดการใช้งานอีกครั้ง'}</Button>
			</form>
			<form
				method="POST"
				action="?/delete"
				use:enhance={({ cancel }) => {
					if (!confirm(`ลบ ${e.name} ถาวร?`)) cancel();
				}}
			>
				<Button type="submit" variant="destructive">ลบถาวร</Button>
			</form>
		</Card.Content>
	</Card.Root>
</div>
