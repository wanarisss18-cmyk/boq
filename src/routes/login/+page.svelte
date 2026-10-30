<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button } from '#lib/components/ui/button/index.js';
	import { Input } from '#lib/components/ui/input/index.js';
	import { Label } from '#lib/components/ui/label/index.js';
	import * as Card from '#lib/components/ui/card/index.js';
	import type { PageProps } from './$types';

	let { form }: PageProps = $props();
	let pending = $state(false);
</script>

<svelte:head><title>เข้าสู่ระบบ · Project Tracker</title></svelte:head>

<div class="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-800 via-blue-600 to-sky-400 p-4">
	<Card.Root class="w-full max-w-sm shadow-2xl">
		<Card.Header>
			<Card.Title class="text-xl text-primary">Project Tracker</Card.Title>
			<Card.Description>เข้าสู่ระบบด้วยบัญชีของคุณ</Card.Description>
		</Card.Header>
		<Card.Content>
			<form
				method="POST"
				class="grid gap-4"
				use:enhance={() => {
					pending = true;
					return async ({ update }) => {
						await update();
						pending = false;
					};
				}}
			>
				<div class="grid gap-2">
					<Label for="email">อีเมล</Label>
					<Input id="email" name="email" type="email" autocomplete="username" value={form?.email ?? ''} required />
				</div>
				<div class="grid gap-2">
					<Label for="password">รหัสผ่าน</Label>
					<Input id="password" name="password" type="password" autocomplete="current-password" required />
				</div>
				{#if form?.message}
					<p class="text-sm text-destructive">{form.message}</p>
				{/if}
				<Button type="submit" disabled={pending}>{pending ? 'กำลังเข้าสู่ระบบ…' : 'เข้าสู่ระบบ'}</Button>
			</form>
		</Card.Content>
	</Card.Root>
</div>
