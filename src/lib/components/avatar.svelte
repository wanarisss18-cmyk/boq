<script lang="ts">
	import { colorFor } from '#lib/constants.js';
	import { cn } from '#lib/utils.js';

	let { id, name, class: className }: { id: number | null; name: string | null; class?: string } = $props();
</script>

<span
	title={name ?? 'ไม่มีผู้รับผิดชอบ'}
	class={cn(
		'inline-flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white',
		name ? colorFor(id).solid : 'bg-slate-300',
		className
	)}
>
	{name ? [...name][0] : '?'}
</span>
