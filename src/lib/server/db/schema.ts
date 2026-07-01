import { sqliteTable, text, integer, real, primaryKey } from 'drizzle-orm/sqlite-core';

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
	// Notes de pêche saisies manuellement
	place: text('place'),
	tideTrend: text('tide_trend'), // 'rising' | 'falling' | 'slack'
	coefficient: integer('coefficient'),
	tempC: real('temp_c'),
	weatherNote: text('weather_note'),
	fromBoat: integer('from_boat', { mode: 'boolean' }).notNull().default(false),
	companionsText: text('companions_text'),
	// Géolocalisation de la prise
	lat: real('lat'),
	lng: real('lng'),
	// Photo (nom de fichier stocké sur le volume de données)
	photo: text('photo'),
	notes: text('notes'),
	createdAt: integer('created_at', { mode: 'timestamp' }).notNull()
});

export type CatchRow = typeof catches.$inferSelect;

// Potes tagués sur une prise (utilisateurs inscrits).
export const catchCompanions = sqliteTable(
	'catch_companions',
	{
		catchId: text('catch_id')
			.notNull()
			.references(() => catches.id),
		userId: text('user_id')
			.notNull()
			.references(() => users.id)
	},
	(t) => [primaryKey({ columns: [t.catchId, t.userId] })]
);

export type CatchCompanionRow = typeof catchCompanions.$inferSelect;
