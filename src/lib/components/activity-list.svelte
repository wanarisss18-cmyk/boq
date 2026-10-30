<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import Undo2 from '@lucide/svelte/icons/undo-2';
	import { Button } from '#lib/components/ui/button/index.js';
	import { formatDateTime } from '#lib/constants.js';
	import type { LogView } from '#lib/server/present.js';

	let { logs, showLinks = true }: { logs: LogView[]; showLinks?: boolean } = $props();

	const actionStyle: Record<string, string> = {
		create: 'bg-emerald-100 text-emerald-700',
		update: 'bg-blue-100 text-blue-700',
		revert: 'bg-amber-100 text-amber-800',
		delete: 'bg-red-100 text-red-700',
		login: 'bg-slate-100 text-slate-600',
		logout: 'bg-slate-100 text-slate-600'
	};

	function link(log: LogView) {
		if (!showLinks || !log.entityId) return null;
		if (log.entityType === 'task' && log.action !== 'delete') return `/tasks/${log.entityId}`;
		if (log.entityType === 'project' && log.action !== 'delete') return `/projects/${log.entityId}`;
		return null;
	}
</script>

{#if logs.length === 0}
	<p class="py-6 text-center text-sm text-muted-foreground">ยังไม่มีประวัติ</p>
{:else}
	<ol class="divide-y">
		{#each logs as log (log.id)}
			{@const href = link(log)}
			<li class="flex gap-3 py-3">
				<div class="min-w-0 flex-1">
					<div class="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
						<span class="rounded px-1.5 py-0.5 font-medium {actionStyle[log.action]}">{log.action}</span>
						<span class="font-medium text-foreground">{log.userName}</span>
						<span>{formatDateTime(log.createdAt)}</span>
						<span>#{log.id}</span>
					</div>
					<p class="mt-1 text-sm">
						{#if href}<a {href} class="hover:underline">{log.summary}</a>{:else}{log.summary}{/if}
					</p>
					{#if log.details.length}
						<ul class="mt-1 space-y-0.5 text-xs text-muted-foreground">
							{#each log.details as d}<li>• {d}</li>{/each}
						</ul>
					{/if}
				</div>
				{#if log.revertable}
					<form
						method="POST"
						action="/activity?/revert"
						use:enhance={({ cancel }) => {
							if (!confirm(`ย้อนกลับการแก้ไข #${log.id}?`)) cancel();
							// The action lives on /activity; stay on the current page and just refresh its data.
							return async ({ result }) => {
								if (result.type === 'error') alert(result.error?.message ?? 'ย้อนกลับไม่สำเร็จ');
								await invalidateAll();
							};
						}}
					>
						<input type="hidden" name="logId" value={log.id} />
						<Button type="submit" variant="outline" size="sm" title="ย้อนกลับค่าก่อนแก้ไข">
							<Undo2 /> ย้อนกลับ
						</Button>
					</form>
				{/if}
			</li>
		{/each}
	</ol>
{/if}
