<script lang="ts" module>
	export type TooltipRow = { label: string; value: string; color: string };
	export type TooltipState = { x: number; y: number; title: string; rows: TooltipRow[] } | null;
</script>

<script lang="ts">
	let { tip }: { tip: TooltipState } = $props();
</script>

{#if tip}
	<div
		role="tooltip"
		class="pointer-events-none fixed z-50 min-w-36 rounded-lg border bg-popover px-3 py-2 text-xs shadow-lg"
		style="left:{tip.x + 14}px; top:{tip.y + 14}px"
	>
		<div class="mb-1 font-medium text-muted-foreground">{tip.title}</div>
		{#each tip.rows as r}
			<div class="flex items-center gap-2">
				<span class="h-0.5 w-3 rounded" style="background:{r.color}"></span>
				<span class="font-semibold text-foreground">{r.value}</span>
				<span class="text-muted-foreground">{r.label}</span>
			</div>
		{/each}
	</div>
{/if}
