<script lang="ts">
	import ChartTooltip, { type TooltipState } from './chart-tooltip.svelte';

	type Segment = { label: string; value: number; color: string };
	let { segments, centerLabel }: { segments: Segment[]; centerLabel: string } = $props();

	const R = 70;
	const STROKE = 26;
	const C = 2 * Math.PI * R;
	const GAP = 3; // surface gap between segments, in px of arc length

	const total = $derived(segments.reduce((s, x) => s + x.value, 0));
	const arcs = $derived.by(() => {
		let offset = 0;
		return segments.map((s) => {
			const len = total ? (s.value / total) * C : 0;
			const arc = { ...s, len: Math.max(0, len - GAP), offset, pct: total ? Math.round((s.value / total) * 100) : 0 };
			offset += len;
			return arc;
		});
	});

	let tip = $state<TooltipState>(null);
	let active = $state<string | null>(null);
</script>

<div class="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
	<svg viewBox="0 0 200 200" class="size-48 shrink-0" role="img" aria-label="สัดส่วนสถานะงาน">
		<g transform="rotate(-90 100 100)">
			<circle cx="100" cy="100" r={R} fill="none" stroke="var(--muted)" stroke-width={STROKE} />
			{#each arcs as a (a.label)}
				{#if a.len > 0}
					<circle
						cx="100"
						cy="100"
						r={R}
						fill="none"
						stroke={a.color}
						stroke-width={active === a.label ? STROKE + 6 : STROKE}
						stroke-dasharray="{a.len} {C - a.len}"
						stroke-dashoffset={-a.offset}
						class="cursor-pointer transition-all"
						role="presentation"
						onpointermove={(e) => {
							active = a.label;
							tip = { x: e.clientX, y: e.clientY, title: a.label, rows: [{ label: `งาน (${a.pct}%)`, value: String(a.value), color: a.color }] };
						}}
						onpointerleave={() => ((tip = null), (active = null))}
					/>
				{/if}
			{/each}
		</g>
		<text x="100" y="96" text-anchor="middle" class="fill-foreground text-[28px] font-bold">{total}</text>
		<text x="100" y="118" text-anchor="middle" class="fill-muted-foreground text-[12px]">{centerLabel}</text>
	</svg>
	<ul class="space-y-2 text-sm">
		{#each arcs as a (a.label)}
			<li class="flex items-center gap-2">
				<span class="size-3 rounded-sm" style="background:{a.color}"></span>
				<span class="w-20">{a.label}</span>
				<span class="font-semibold">{a.value}</span>
				<span class="text-muted-foreground">({a.pct}%)</span>
			</li>
		{/each}
	</ul>
</div>

<ChartTooltip {tip} />
