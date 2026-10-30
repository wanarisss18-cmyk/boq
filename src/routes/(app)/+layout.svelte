<script lang="ts">
	import { page } from '$app/state';
	import LayoutDashboard from '@lucide/svelte/icons/layout-dashboard';
	import Kanban from '@lucide/svelte/icons/kanban';
	import FolderKanban from '@lucide/svelte/icons/folder-kanban';
	import Users from '@lucide/svelte/icons/users';
	import Clock from '@lucide/svelte/icons/clock';
	import LogOut from '@lucide/svelte/icons/log-out';
	import { cn } from '#lib/utils.js';
	import type { LayoutProps } from './$types';

	let { data, children }: LayoutProps = $props();

	const nav = $derived([
		{ href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, chip: 'bg-sky-400' },
		{ href: '/board', label: 'Kanban Board', icon: Kanban, chip: 'bg-violet-400' },
		{ href: '/projects', label: 'โปรเจกต์', icon: FolderKanban, chip: 'bg-amber-400' },
		...(data.user.role === 'admin' ? [{ href: '/employees', label: 'พนักงาน', icon: Users, chip: 'bg-emerald-400' }] : []),
		{ href: '/activity', label: 'ประวัติการแก้ไข', icon: Clock, chip: 'bg-pink-400' }
	]);
</script>

<div class="min-h-screen md:flex">
	<aside
		class="bg-gradient-to-b from-sidebar to-[oklch(0.3_0.13_266)] text-sidebar-foreground md:sticky md:top-0 md:flex md:h-screen md:w-60 md:shrink-0 md:flex-col"
	>
		<div class="flex items-center gap-2 px-4 py-4 text-lg font-semibold">
			<span class="flex size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
				<Kanban class="size-4" />
			</span>
			Project Tracker
		</div>
		<nav class="flex gap-1 overflow-x-auto px-2 pb-2 md:flex-1 md:flex-col md:pb-0">
			{#each nav as item (item.href)}
				{@const active = page.url.pathname.startsWith(item.href)}
				<a
					href={item.href}
					class={cn(
						'flex items-center gap-2 rounded-lg px-3 py-2 text-sm whitespace-nowrap text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
						active && 'bg-sidebar-primary font-medium text-sidebar-primary-foreground shadow-sm hover:bg-sidebar-primary hover:text-sidebar-primary-foreground'
					)}
				>
					<span class="flex size-6 items-center justify-center rounded-md text-white {item.chip}">
						<item.icon class="size-3.5" />
					</span>
					{item.label}
				</a>
			{/each}
		</nav>
		<div class="hidden border-t border-sidebar-border p-3 md:block">
			<div class="text-sm font-medium">{data.user.name}</div>
			<div class="text-xs text-sidebar-foreground/70">{data.user.email} · {data.user.role === 'admin' ? 'Admin' : 'พนักงาน'}</div>
			<form method="POST" action="/logout" class="mt-2">
				<button class="flex items-center gap-2 text-sm text-sidebar-foreground/70 hover:text-sidebar-foreground">
					<LogOut class="size-4" /> ออกจากระบบ
				</button>
			</form>
		</div>
	</aside>
	<main class="min-w-0 flex-1 p-4 md:p-6">
		<div class="mb-4 flex items-center justify-end gap-3 text-sm md:hidden">
			<span>{data.user.name}</span>
			<form method="POST" action="/logout"><button class="text-muted-foreground underline">ออกจากระบบ</button></form>
		</div>
		{@render children()}
	</main>
</div>
