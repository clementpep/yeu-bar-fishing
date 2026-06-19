import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
	id: text('id').primaryKey(),
	name: text('name').notNull(),
	email: text('email').notNull().unique(),
	passwordHash: text('password_hash').notNull(),
	avatar: text('avatar'),
	spotDefaultId: text('spot_default_id'),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull()
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export const sessions = sqliteTable('sessions', {
	id: text('id').primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => users.id),
	expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull()
});

export type Session = typeof sessions.$inferSelect;

export const conditionsCache = sqliteTable('conditions_cache', {
	id: text('id').primaryKey(), // = spot id
	weatherJson: text('weather_json').notNull(),
	fetchedAt: integer('fetched_at', { mode: 'timestamp' }).notNull()
});

export type ConditionsCache = typeof conditionsCache.$inferSelect;

export const catches = sqliteTable('catches', {
	id: text('id').primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => users.id),
	spotId: text('spot_id').notNull().default('ile-dyeu'),
	caughtAt: integer('caught_at', { mode: 'timestamp' }).notNull(),
	lengthCm: real('length_cm').notNull(),
	weightEstG: integer('weight_est_g').notNull(),
	technique: text('technique'),
	lureBait: text('lure_bait'),
	released: integer('released', { mode: 'boolean' }).notNull().default(false),
	conditionsJson: text('conditions_json'),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull()
});

export type CatchRow = typeof catches.$inferSelect;
