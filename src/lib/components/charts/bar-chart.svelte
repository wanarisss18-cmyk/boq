<script lang="ts">
	import ChartTooltip, { type TooltipState } from './chart-tooltip.svelte';

	type Series = { key: string; label: string; color: string };
	type Row = { id: number; label: string; href?: string; values: Record<string, number> };

	let {
		series,
		rows,
		mode = 'stack',
		max: fixedMax,
		unit = '',
		showTotal = true
	}: {
		series: Series[];
		rows: Row[];
		/** stack = segments in one bar; group = one thin bar per series. */
		mode?: 'stack' | 'group';
		/** Fixed scale maximum (e.g. 100 for percentages); defaults to the data max. */
		max?: number;
		unit?: string;
		showTotal?: boolean;
	} = $props();

	const sum = (r: Row) => series.reduce((s, x) => s + (r.values[x.key] ?? 0), 0);
	const max = $derived(
		fixedMax ??
			Math.max(1, ...rows.map((r) => (mode === 'stack' ? sum(r) : Math.max(...series.map((s) => r.values[s.key] ?? 0)))))
	);
	const pct = (v: number) => `${(v / max) * 100}%`;
	const fmt = (v: number) => `${Math.round(v * 10) / 10}${unit}`;

	let tip = $state<TooltipState>(null);
	let hovered = $state<number | null>(null);

	function show(e: PointerEvent, r: Row) {
		hovered = r.id;
		tip = {
			x: e.clientX,
			y: e.clientY,
			title: r.label,
			rows: series.map((s) => ({ label: s.label, value: fmt(r.values[s.key] ?? 0), color: s.color }))
		};
	}
</script>

{#if series.length > 1}
	<div class="mb-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
		{#each series as s (s.key)}
			<span class="flex items-center gap-1.5"><span class="size-3 rounded-sm" style="background:{s.color}"></span>{s.label}</span>
		{/each}
	</div>
{/if}

<div class="space-y-1">
	{#each rows as r (r.id)}
		<div
			class="grid grid-cols-[9.5rem_1fr_4.5rem] items-center gap-3 rounded-md px-1 py-1 text-sm transition-colors {hovered === r.id ? 'bg-muted' : ''}"
			role="group"
			aria-label="{r.label}: {series.map((s) => `${s.label} ${fmt(r.values[s.key] ?? 0)}`).join(', ')}"
			onpointermove={(e) => show(e, r)}
			onpointerleave={() => ((tip = null), (hovered = null))}
		>
			<div class="truncate" title={r.label}>
				{#if r.href}<a href={r.href} class="hover:underline">{r.label}</a>{:else}{r.label}{/if}
			</div>
			{#if mode === 'stack'}
				<div class="flex h-4 gap-0.5">
					{#each series as s (s.key)}
						{@const v = r.values[s.key] ?? 0}
						{#if v > 0}
							<div
								class="flex h-full items-center justify-center rounded-[4px] text-[10px] font-semibold text-white"
								style="width:{pct(v)}; background:{s.color}"
							>
								{series.length > 1 && (v / max) * 100 >= 8 ? v : ''}
							</div>
						{/if}
					{/each}
				</div>
			{:else}
				<div class="flex flex-col gap-0.5">
					{#each series as s (s.key)}
						<div class="h-2 rounded-r-[4px]" style="width:{pct(r.values[s.key] ?? 0)}; background:{s.color}"></div>
					{/each}
				</div>
			{/if}
			<div class="text-right text-xs text-muted-foreground tabular-nums">
				{#if showTotal}{mode === 'stack' ? fmt(sum(r)) : series.map((s) => Math.round(r.values[s.key] ?? 0)).join(' / ')}{/if}
			</div>
		</div>
	{/each}
</div>

<ChartTooltip {tip} />
