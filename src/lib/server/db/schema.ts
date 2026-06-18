import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

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
