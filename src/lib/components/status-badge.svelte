<script lang="ts">
	import { statusLabel } from '#lib/constants.js';
	import { cn } from '#lib/utils.js';

	let { status }: { status: string } = $props();

	const styles: Record<string, string> = {
		todo: 'bg-sky-100 text-sky-700',
		doing: 'bg-violet-100 text-violet-700',
		done: 'bg-emerald-100 text-emerald-700'
	};
</script>

<span class={cn('inline-flex rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap', styles[status])}>
	{statusLabel(status)}
</span>
