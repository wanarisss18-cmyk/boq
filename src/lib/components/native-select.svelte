<script lang="ts">
	import type { HTMLSelectAttributes } from 'svelte/elements';
	import { cn } from '#lib/utils.js';

	let { class: className, children, value = $bindable(), ...rest }: HTMLSelectAttributes = $props();
</script>

<select
	bind:value
	class={cn(
		'h-8 w-full min-w-0 rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50',
		className
	)}
	{...rest}
>
	{@render children?.()}
</select>
