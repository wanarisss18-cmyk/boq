<script lang="ts">
	import TriangleAlert from '@lucide/svelte/icons/triangle-alert';
	import ListChecks from '@lucide/svelte/icons/list-checks';
	import CircleCheck from '@lucide/svelte/icons/circle-check';
	import Loader from '@lucide/svelte/icons/loader';
	import CircleDashed from '@lucide/svelte/icons/circle-dashed';
	import AlarmClock from '@lucide/svelte/icons/alarm-clock';
	import Hourglass from '@lucide/svelte/icons/hourglass';
	import Timer from '@lucide/svelte/icons/timer';
	import Users from '@lucide/svelte/icons/users';
	import FolderOpen from '@lucide/svelte/icons/folder-open';
	import Activity from '@lucide/svelte/icons/activity';
	import * as Card from '#lib/components/ui/card/index.js';
	import * as Table from '#lib/components/ui/table/index.js';
	import StatusBadge from '#lib/components/status-badge.svelte';
	import DueBadge from '#lib/components/due-badge.svelte';
	import ActivityList from '#lib/components/activity-list.svelte';
	import Avatar from '#lib/components/avatar.svelte';
	import DonutChart from '#lib/components/charts/donut-chart.svelte';
	import BarChart from '#lib/components/charts/bar-chart.svelte';
	import { colorFor, formatDate } from '#lib/constants.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const kpis = $derived([
		{ label: 'งานทั้งหมด', value: data.totals.total, icon: ListChecks, bg: 'from-blue-600 to-sky-500' },
		{ label: 'เสร็จแล้ว', value: `${data.totals.done} (${data.totals.donePct}%)`, icon: CircleCheck, bg: 'from-emerald-500 to-teal-400' },
		{ label: 'กำลังทำ', value: data.totals.doing, icon: Loader, bg: 'from-violet-500 to-fuchsia-400' },
		{ label: 'ยังไม่เริ่ม', value: data.totals.todo, icon: CircleDashed, bg: 'from-sky-600 to-cyan-400' },
		{ label: 'เลยกำหนด', value: data.totals.overdue, icon: AlarmClock, bg: 'from-red-500 to-rose-400' },
		{ label: 'ใกล้ครบกำหนด (≤3 วัน)', value: data.totals.dueSoon, icon: Hourglass, bg: 'from-amber-500 to-yellow-400' },
		{ label: 'ชั่วโมงประเมิน / จริง', value: `${data.totals.estHours} / ${data.totals.actualHours}`, icon: Timer, bg: 'from-cyan-500 to-sky-400' }
	]);

	// Validated with the dataviz palette checker (CVD-safe with legend + gaps).
	const STATUS_COLORS = { todo: '#0284c7', doing: '#8b5cf6', done: '#059669' };
	const statusSeries = [
		{ key: 'todo', label: 'To do', color: STATUS_COLORS.todo },
		{ key: 'doing', label: 'Doing', color: STATUS_COLORS.doing },
		{ key: 'done', label: 'Done', color: STATUS_COLORS.done }
	];
	const hourSeries = [
		{ key: 'est', label: 'ชั่วโมงประเมิน', color: '#2563eb' },
		{ key: 'actual', label: 'ชั่วโมงจริง', color: '#ea580c' }
	];
	const people = $derived(data.byPerson.filter((p) => p.total > 0));

	/** Red → amber → green as completion rises. */
	const progressColor = (pct: number) => (pct >= 70 ? 'bg-emerald-500' : pct >= 40 ? 'bg-amber-400' : 'bg-rose-400');
</script>

<svelte:head><title>Dashboard · Project Tracker</title></svelte:head>

<div class="space-y-6">
	<div>
		<h1 class="text-2xl font-semibold">Dashboard</h1>
		<p class="text-sm text-muted-foreground">สรุปข้อมูล ณ วันที่ {formatDate(data.today)} · อัปเดตแบบเรียลไทม์จากฐานข้อมูล</p>
	</div>

	<div class="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-7">
		{#each kpis as k}
			<div class="relative overflow-hidden rounded-xl bg-gradient-to-br p-4 text-white shadow-md {k.bg}">
				<k.icon class="absolute -right-2 -bottom-2 size-14 opacity-20" />
				<div class="text-xs text-white/85">{k.label}</div>
				<div class="mt-1 text-2xl font-bold">{k.value}</div>
			</div>
		{/each}
	</div>

	<div class="grid gap-6 xl:grid-cols-[2fr_3fr]">
		<Card.Root>
			<Card.Header>
				<Card.Title>สัดส่วนสถานะงาน</Card.Title>
				<Card.Description>งานทั้งหมดแยกตาม To do / Doing / Done</Card.Description>
			</Card.Header>
			<Card.Content>
				<DonutChart
					centerLabel="งานทั้งหมด"
					segments={[
						{ label: 'To do', value: data.totals.todo, color: STATUS_COLORS.todo },
						{ label: 'Doing', value: data.totals.doing, color: STATUS_COLORS.doing },
						{ label: 'Done', value: data.totals.done, color: STATUS_COLORS.done }
					]}
				/>
			</Card.Content>
		</Card.Root>

		<Card.Root>
			<Card.Header>
				<Card.Title>งานรายคน แยกตามสถานะ</Card.Title>
				<Card.Description>จำนวนงานของแต่ละคน กดชื่อเพื่อดูงานบน Kanban</Card.Description>
			</Card.Header>
			<Card.Content>
				<BarChart
					series={statusSeries}
					rows={people.map((p) => ({ id: p.id, label: p.name, href: `/board?assignee=${p.id}`, values: { todo: p.todo, doing: p.doing, done: p.done } }))}
					unit=" งาน"
				/>
			</Card.Content>
		</Card.Root>

		<Card.Root>
			<Card.Header>
				<Card.Title>ความคืบหน้าเฉลี่ยรายโปรเจกต์</Card.Title>
				<Card.Description>ค่าเฉลี่ย % ความคืบหน้าของงานในแต่ละโปรเจกต์</Card.Description>
			</Card.Header>
			<Card.Content>
				<BarChart
					series={[{ key: 'progress', label: 'ความคืบหน้าเฉลี่ย', color: '#2563eb' }]}
					rows={data.byProject.map((p) => ({ id: p.id, label: p.name, href: `/projects/${p.id}`, values: { progress: p.avgProgress } }))}
					max={100}
					unit="%"
				/>
			</Card.Content>
		</Card.Root>

		<Card.Root>
			<Card.Header>
				<Card.Title>ชั่วโมงประเมิน เทียบ ชั่วโมงจริง รายคน</Card.Title>
				<Card.Description>ดูว่าใครใช้เวลาเกินหรือน้อยกว่าที่ประเมินไว้</Card.Description>
			</Card.Header>
			<Card.Content>
				<BarChart
					mode="group"
					series={hourSeries}
					rows={people.map((p) => ({ id: p.id, label: p.name, values: { est: p.estHours, actual: p.actualHours } }))}
					unit=" ชม."
				/>
			</Card.Content>
		</Card.Root>
	</div>

	{#if data.mine.length}
		<Card.Root>
			<Card.Header>
				<Card.Title>งานของฉันที่ยังไม่เสร็จ ({data.mine.length})</Card.Title>
			</Card.Header>
			<Card.Content class="flex flex-wrap gap-2">
				{#each data.mine as t (t.id)}
					<a href="/tasks/{t.id}" class="flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm hover:bg-muted">
						<span class="text-muted-foreground">{t.code}</span>
						<span class="max-w-64 truncate">{t.title}</span>
						<StatusBadge status={t.status} />
						<DueBadge task={t} />
					</a>
				{/each}
			</Card.Content>
		</Card.Root>
	{/if}

	<Card.Root>
		<Card.Header>
			<Card.Title class="flex items-center gap-2 text-red-600"><TriangleAlert class="size-4" /> งานที่เลยกำหนด ({data.overdue.length})</Card.Title>
			<Card.Description>ยังไม่เสร็จและเลยวันกำหนดส่งแล้ว เรียงจากช้าที่สุด</Card.Description>
		</Card.Header>
		<Card.Content>
			{#if data.overdue.length === 0}
				<p class="text-sm text-muted-foreground">ไม่มีงานที่เลยกำหนด 🎉</p>
			{:else}
				<Table.Root>
					<Table.Header>
						<Table.Row>
							<Table.Head>รหัส</Table.Head>
							<Table.Head>งาน</Table.Head>
							<Table.Head>โปรเจกต์</Table.Head>
							<Table.Head>ผู้รับผิดชอบ</Table.Head>
							<Table.Head>สถานะ</Table.Head>
							<Table.Head>กำหนดส่ง</Table.Head>
							<Table.Head class="text-right">ช้า (วัน)</Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#each data.overdue as t (t.id)}
							<Table.Row>
								<Table.Cell class="text-muted-foreground">{t.code}</Table.Cell>
								<Table.Cell><a href="/tasks/{t.id}" class="hover:underline">{t.title}</a></Table.Cell>
								<Table.Cell>
									<span class="inline-flex items-center gap-1.5"><span class="size-2 rounded-full {colorFor(t.projectId).solid}"></span>{t.projectName}</span>
								</Table.Cell>
								<Table.Cell>
									<span class="inline-flex items-center gap-1.5"><Avatar id={t.assigneeId} name={t.assigneeName} />{t.assigneeName ?? '-'}</span>
								</Table.Cell>
								<Table.Cell><StatusBadge status={t.status} /> <span class="text-xs text-muted-foreground">{t.progress}%</span></Table.Cell>
								<Table.Cell>{formatDate(t.dueDate)}</Table.Cell>
								<Table.Cell class="text-right font-semibold text-red-600">{t.daysLate}</Table.Cell>
							</Table.Row>
						{/each}
					</Table.Body>
				</Table.Root>
			{/if}
			{#if data.dueSoon.length}
				<div class="mt-4 text-sm">
					<span class="font-medium text-amber-700">ใกล้ครบกำหนดภายใน 3 วัน:</span>
					{#each data.dueSoon as t, i (t.id)}
						<a href="/tasks/{t.id}" class="hover:underline">{t.code} {t.title} ({t.assigneeName ?? '-'}, {formatDate(t.dueDate)})</a>{i < data.dueSoon.length - 1 ? ' · ' : ''}
					{/each}
				</div>
			{/if}
		</Card.Content>
	</Card.Root>

	<div class="grid gap-6 xl:grid-cols-2">
		<Card.Root>
			<Card.Header>
				<Card.Title class="flex items-center gap-2"><span class="rounded-md bg-emerald-100 p-1 text-emerald-700"><Users class="size-4" /></span> สรุปรายคน</Card.Title>
			</Card.Header>
			<Card.Content>
				<Table.Root>
					<Table.Header>
						<Table.Row>
							<Table.Head>ผู้รับผิดชอบ</Table.Head>
							<Table.Head class="text-right">ทั้งหมด</Table.Head>
							<Table.Head class="text-right">To do</Table.Head>
							<Table.Head class="text-right">Doing</Table.Head>
							<Table.Head class="text-right">Done</Table.Head>
							<Table.Head class="text-right">เลยกำหนด</Table.Head>
							<Table.Head class="text-right">ชม. ประเมิน/จริง</Table.Head>
							<Table.Head class="w-32">% เสร็จ</Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#each data.byPerson as p (p.id)}
							<Table.Row>
								<Table.Cell>
									<div class="flex items-center gap-2">
										<Avatar id={p.id} name={p.name} class="size-8 text-sm" />
										<div>
											<a href="/board?assignee={p.id}" class="font-medium hover:underline">{p.name}</a>
											<div class="text-xs text-muted-foreground">{p.position ?? ''}</div>
										</div>
									</div>
								</Table.Cell>
								<Table.Cell class="text-right">{p.total}</Table.Cell>
								<Table.Cell class="text-right text-slate-500">{p.todo}</Table.Cell>
								<Table.Cell class="text-right text-violet-600">{p.doing}</Table.Cell>
								<Table.Cell class="text-right text-emerald-600">{p.done}</Table.Cell>
								<Table.Cell class="text-right {p.overdue ? 'font-semibold text-red-600' : ''}">{p.overdue}</Table.Cell>
								<Table.Cell class="text-right">{p.estHours} / {p.actualHours}</Table.Cell>
								<Table.Cell>
									<div class="flex items-center gap-2">
										<div class="h-2 flex-1 rounded-full bg-muted"><div class="h-2 rounded-full {progressColor(p.donePct)}" style="width:{p.donePct}%"></div></div>
										<span class="w-9 text-right text-xs">{p.donePct}%</span>
									</div>
								</Table.Cell>
							</Table.Row>
						{/each}
					</Table.Body>
				</Table.Root>
			</Card.Content>
		</Card.Root>

		<Card.Root>
			<Card.Header>
				<Card.Title class="flex items-center gap-2"><span class="rounded-md bg-amber-100 p-1 text-amber-700"><FolderOpen class="size-4" /></span> สรุปรายโปรเจกต์</Card.Title>
			</Card.Header>
			<Card.Content>
				<Table.Root>
					<Table.Header>
						<Table.Row>
							<Table.Head>โปรเจกต์</Table.Head>
							<Table.Head class="text-right">ทั้งหมด</Table.Head>
							<Table.Head class="text-right">To do</Table.Head>
							<Table.Head class="text-right">Doing</Table.Head>
							<Table.Head class="text-right">Done</Table.Head>
							<Table.Head class="text-right">เลยกำหนด</Table.Head>
							<Table.Head class="w-32">ความคืบหน้าเฉลี่ย</Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#each data.byProject as p (p.id)}
							<Table.Row>
								<Table.Cell>
									<a href="/projects/{p.id}" class="inline-flex items-center gap-2 font-medium hover:underline">
										<span class="size-3 rounded-full {colorFor(p.id).solid}"></span>{p.name}
									</a>
								</Table.Cell>
								<Table.Cell class="text-right">{p.total}</Table.Cell>
								<Table.Cell class="text-right text-slate-500">{p.todo}</Table.Cell>
								<Table.Cell class="text-right text-violet-600">{p.doing}</Table.Cell>
								<Table.Cell class="text-right text-emerald-600">{p.done}</Table.Cell>
								<Table.Cell class="text-right {p.overdue ? 'font-semibold text-red-600' : ''}">{p.overdue}</Table.Cell>
								<Table.Cell>
									<div class="flex items-center gap-2">
										<div class="h-2 flex-1 rounded-full bg-muted"><div class="h-2 rounded-full {colorFor(p.id).solid}" style="width:{p.avgProgress}%"></div></div>
										<span class="w-9 text-right text-xs">{p.avgProgress}%</span>
									</div>
								</Table.Cell>
							</Table.Row>
						{/each}
					</Table.Body>
				</Table.Root>
			</Card.Content>
		</Card.Root>
	</div>

	<Card.Root>
		<Card.Header>
			<Card.Title class="flex items-center gap-2"><span class="rounded-md bg-pink-100 p-1 text-pink-700"><Activity class="size-4" /></span> ความเคลื่อนไหวล่าสุด</Card.Title>
			<Card.Action><a href="/activity" class="text-sm text-muted-foreground hover:underline">ดูทั้งหมด →</a></Card.Action>
		</Card.Header>
		<Card.Content><ActivityList logs={data.recent} /></Card.Content>
	</Card.Root>
</div>
