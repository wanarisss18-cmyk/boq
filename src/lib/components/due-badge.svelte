<script lang="ts">
	import { daysUntil, formatDate, isDueSoon, isOverdue } from '#lib/constants.js';
	import { cn } from '#lib/utils.js';

	let { task }: { task: { status: string; dueDate: string | null } } = $props();

	const overdue = $derived(isOverdue(task));
	const soon = $derived(isDueSoon(task));
</script>

{#if task.dueDate}
	<span
		class={cn(
			'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs whitespace-nowrap',
			overdue ? 'bg-red-100 text-red-700' : soon ? 'bg-amber-100 text-amber-800' : 'text-muted-foreground'
		)}
	>
		{formatDate(task.dueDate)}
		{#if overdue}· เลย {-daysUntil(task.dueDate)} วัน{:else if soon}· อีก {daysUntil(task.dueDate)} วัน{/if}
	</span>
{:else}
	<span class="text-xs text-muted-foreground">-</span>
{/if}
