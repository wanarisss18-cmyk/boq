import { sqliteTable, text, integer, real, index } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	name: text('name').notNull(),
	email: text('email').notNull().unique(),
	passwordHash: text('password_hash').notNull(),
	role: text('role', { enum: ['admin', 'member'] }).notNull().default('member'),
	position: text('position'),
	duty: text('duty'),
	level: text('level'),
	startDate: text('start_date'),
	active: integer('active', { mode: 'boolean' }).notNull().default(true),
	createdAt: integer('created_at', { mode: 'timestamp_ms' })
		.notNull()
		.$defaultFn(() => new Date())
});

export const sessions = sqliteTable('sessions', {
	id: text('id').primaryKey(),
	userId: integer('user_id')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	expiresAt: integer('expires_at', { mode: 'timestamp_ms' }).notNull()
});

export const projects = sqliteTable('projects', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	name: text('name').notNull().unique(),
	description: text('description'),
	createdAt: integer('created_at', { mode: 'timestamp_ms' })
		.notNull()
		.$defaultFn(() => new Date())
});

export const tasks = sqliteTable(
	'tasks',
	{
		id: integer('id').primaryKey({ autoIncrement: true }),
		code: text('code').notNull().unique(),
		projectId: integer('project_id')
			.notNull()
			.references(() => projects.id, { onDelete: 'cascade' }),
		title: text('title').notNull(),
		assigneeId: integer('assignee_id').references(() => users.id, { onDelete: 'set null' }),
		priority: text('priority', { enum: ['high', 'medium', 'low'] }).notNull().default('medium'),
		status: text('status', { enum: ['todo', 'doing', 'done'] }).notNull().default('todo'),
		startDate: text('start_date'),
		dueDate: text('due_date'),
		estHours: real('est_hours').notNull().default(0),
		actualHours: real('actual_hours').notNull().default(0),
		progress: integer('progress').notNull().default(0),
		note: text('note'),
		createdAt: integer('created_at', { mode: 'timestamp_ms' })
			.notNull()
			.$defaultFn(() => new Date()),
		updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
			.notNull()
			.$defaultFn(() => new Date())
	},
	(t) => [index('tasks_project_idx').on(t.projectId), index('tasks_assignee_idx').on(t.assigneeId)]
);

export type FieldChange = { from: unknown; to: unknown };

export const activityLogs = sqliteTable(
	'activity_logs',
	{
		id: integer('id').primaryKey({ autoIncrement: true }),
		userId: integer('user_id').references(() => users.id, { onDelete: 'set null' }),
		entityType: text('entity_type', { enum: ['task', 'project', 'user', 'auth'] }).notNull(),
		entityId: integer('entity_id'),
		action: text('action', {
			enum: ['create', 'update', 'delete', 'revert', 'login', 'logout']
		}).notNull(),
		summary: text('summary').notNull(),
		changes: text('changes', { mode: 'json' }).$type<Record<string, FieldChange>>(),
		createdAt: integer('created_at', { mode: 'timestamp_ms' })
			.notNull()
			.$defaultFn(() => new Date())
	},
	(t) => [
		index('logs_entity_idx').on(t.entityType, t.entityId),
		index('logs_created_idx').on(t.createdAt)
	]
);

export type User = typeof users.$inferSelect;
export type Project = typeof projects.$inferSelect;
export type Task = typeof tasks.$inferSelect;
export type ActivityLog = typeof activityLogs.$inferSelect;
