import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { getDayConditions } from '$lib/server/conditions/conditions';
import { toMomentData } from '$lib/server/conditions/moment';

export const load: PageServerLoad = async () => {
	const now = new Date();
	const conditions = await getDayConditions(db, now);
	return { moment: toMomentData(conditions, now) };
};
