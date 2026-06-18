# Plan 2b — Inscription publique ouverte Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ajouter une **inscription publique ouverte** (écran + action register) à l'auth livrée au Plan 2 : n'importe qui peut créer un compte (nom + e-mail + mot de passe argon2), être connecté immédiatement, et apparaît de fait dans la communauté (tout inscrit est « ami » par défaut — pas de table friends).

**Architecture:** Un module server-only `register.ts` (testé en TDD) encapsule la création de compte (validation + unicité e-mail + hash argon2 + insertion), en réutilisant `hashPassword`, `MIN_PASSWORD_LENGTH` et le type `AuthUser` du module `login.ts`. Une route `/register` (hors route-group `(app)`, donc sans TabBar, comme `/login`) expose un écran tokenisé et une action qui crée le compte, ouvre une session (même cookie httpOnly/secure/lax que le login) et redirige vers `/`. Les écrans login et register se renvoient l'un à l'autre par un lien.

**Tech Stack:** SvelteKit 2 + Svelte 5 runes, TypeScript strict, Drizzle + better-sqlite3 (synchrone), `@node-rs/argon2` (via `hashPassword`), `node:crypto` (`randomUUID`), Vitest + @testing-library/svelte. Composants UI existants : `Card`, `Button`, `TextField`.

## Global Constraints

- **Langue de l'UI** : français.
- **Inscription publique ouverte** : aucun code d'invitation, aucun rate-limit (risque de spam assumé pour une app perso — décision verrouillée, spec §3 révisée 2026-06-18).
- **Amis = tous les inscrits** : pas de table `friends`, pas d'ajout d'amis (impacte Plan 6, rien à construire ici).
- **Sécurité** : mot de passe **argon2** (via `hashPassword`) ; e-mail **normalisé** (`trim().toLowerCase()`) ; unicité e-mail (contrainte DB `users.email` + contrôle applicatif renvoyant un message clair) ; cookie de session **httpOnly**, `sameSite: 'lax'`, `path: '/'`, `secure` en production, `maxAge` = `SESSION_TTL_MS`.
- **Design = single source of truth** : tout style dérive des tokens sémantiques ; réutiliser `Card`, `Button`, `TextField`. Aucune valeur en dur.
- **Mobile-first strict** : zones de tap ≥ 44px, safe areas, types d'input adaptés (`email`, `autocomplete` `name`/`username`/`new-password`).
- **Server-only** : tout le code DB/auth sous `src/lib/server/**`.
- **Accessibilité** : labels liés aux inputs, focus visibles, erreurs annoncées (`aria-live`).
- **TypeScript strict** ; **Node ≥ 20** ; **npm**.
- **Zéro régression** : les 46 tests existants restent verts ; `npm run check` reste à 0 erreur / 0 warning ; `npm run build` OK.

---

## File Structure

```
src/
├── lib/server/auth/
│   ├── register.ts            (CREATE : register() — validation + unicité + hash + insert)
│   └── register.test.ts       (CREATE)
├── routes/
│   ├── login/+page.svelte     (MODIFY : lien « Créer un compte » → /register)
│   └── register/
│       ├── +page.svelte       (CREATE : écran inscription, hors (app), sans TabBar)
│       └── +page.server.ts    (CREATE : load redirect-si-connecté + action register)
docs/DEPLOY.md                 (MODIFY : seed désormais optionnel, inscription publique)
```

> Le seed (`npm run db:seed`, Plan 2) est **conservé** (bootstrap/reset d'un mot de passe) mais n'est plus l'unique voie de création de compte.

---

### Task 1: Module `register` (server-only, TDD)

**Files:**
- Create: `src/lib/server/auth/register.ts`
- Test: `src/lib/server/auth/register.test.ts`

**Interfaces:**
- Consumes: `hashPassword` (de `./password`) ; `MIN_PASSWORD_LENGTH` et type `AuthUser` (de `./login`) ; `users` (schéma) ; `createDb`/instance `db`.
- Produces :
  - `register(db, input: { name: string; email: string; password: string }): Promise<{ ok: true; user: AuthUser } | { ok: false; error: string }>`
    — valide (nom non-vide ; e-mail format valide ; mdp ≥ `MIN_PASSWORD_LENGTH`), normalise l'e-mail (`trim().toLowerCase()`), refuse un e-mail déjà utilisé, hashe le mot de passe, insère l'utilisateur (`randomUUID`, `createdAt: new Date()`, `spotDefaultId: null`), et renvoie l'`AuthUser` créé.

- [ ] **Step 1: Écrire le test (échoue)**

Create `src/lib/server/auth/register.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { sql } from 'drizzle-orm';
import { createDb } from '$lib/server/db';
import { authenticate } from './login';
import { register } from './register';

function freshDb() {
	const db = createDb(':memory:');
	db.run(sql`CREATE TABLE users (
		id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE,
		password_hash TEXT NOT NULL, avatar TEXT, spot_default_id TEXT, created_at INTEGER NOT NULL
	)`);
	return db;
}

describe('register', () => {
	it('crée un compte et renvoie l’utilisateur', async () => {
		const db = freshDb();
		const res = await register(db, { name: 'Ami', email: 'ami@example.com', password: 'Bar2Yeu!!' });
		expect(res.ok).toBe(true);
		if (res.ok) {
			expect(res.user.name).toBe('Ami');
			expect(res.user.email).toBe('ami@example.com');
			expect(res.user.id).toBeTruthy();
		}
	});

	it('le compte créé peut s’authentifier', async () => {
		const db = freshDb();
		await register(db, { name: 'Ami', email: 'ami@example.com', password: 'Bar2Yeu!!' });
		expect(await authenticate(db, 'ami@example.com', 'Bar2Yeu!!')).not.toBeNull();
	});

	it('normalise l’e-mail (trim + minuscules)', async () => {
		const db = freshDb();
		const res = await register(db, { name: 'Ami', email: '  AMI@Example.com  ', password: 'Bar2Yeu!!' });
		expect(res.ok).toBe(true);
		if (res.ok) expect(res.user.email).toBe('ami@example.com');
		expect(await authenticate(db, 'ami@example.com', 'Bar2Yeu!!')).not.toBeNull();
	});

	it('refuse un e-mail déjà utilisé', async () => {
		const db = freshDb();
		await register(db, { name: 'Ami', email: 'ami@example.com', password: 'Bar2Yeu!!' });
		const res = await register(db, { name: 'Autre', email: 'ami@example.com', password: 'Autre123!' });
		expect(res.ok).toBe(false);
		if (!res.ok) expect(res.error).toMatch(/déjà/i);
	});

	it('refuse un mot de passe trop court', async () => {
		const db = freshDb();
		const res = await register(db, { name: 'Ami', email: 'ami@example.com', password: 'court' });
		expect(res.ok).toBe(false);
	});

	it('refuse un nom vide', async () => {
		const db = freshDb();
		const res = await register(db, { name: '   ', email: 'ami@example.com', password: 'Bar2Yeu!!' });
		expect(res.ok).toBe(false);
	});

	it('refuse un e-mail invalide', async () => {
		const db = freshDb();
		const res = await register(db, { name: 'Ami', email: 'pas-un-email', password: 'Bar2Yeu!!' });
		expect(res.ok).toBe(false);
	});
});
```

- [ ] **Step 2: Lancer et vérifier l'échec**

Run: `npm test -- run src/lib/server/auth/register.test.ts`
Expected: FAIL — module `./register` introuvable.

- [ ] **Step 3: Implémenter `src/lib/server/auth/register.ts`**

```ts
import { randomUUID } from 'node:crypto';
import { eq } from 'drizzle-orm';
import type { createDb } from '$lib/server/db';
import { users } from '$lib/server/db/schema';
import { hashPassword } from './password';
import { MIN_PASSWORD_LENGTH, type AuthUser } from './login';

type DB = ReturnType<typeof createDb>;

// Validation e-mail volontairement simple (un seul @, un point dans le domaine).
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function register(
	db: DB,
	input: { name: string; email: string; password: string }
): Promise<{ ok: true; user: AuthUser } | { ok: false; error: string }> {
	const name = input.name.trim();
	const email = input.email.trim().toLowerCase();

	if (!name) {
		return { ok: false, error: 'Le nom est obligatoire.' };
	}
	if (!EMAIL_RE.test(email)) {
		return { ok: false, error: 'Adresse e-mail invalide.' };
	}
	if (input.password.length < MIN_PASSWORD_LENGTH) {
		return { ok: false, error: `Le mot de passe doit faire au moins ${MIN_PASSWORD_LENGTH} caractères.` };
	}

	const existing = db.select().from(users).where(eq(users.email, email)).get();
	if (existing) {
		return { ok: false, error: 'Cet e-mail est déjà utilisé.' };
	}

	const id = randomUUID();
	const passwordHash = await hashPassword(input.password);
	db.insert(users).values({ id, name, email, passwordHash, createdAt: new Date() }).run();

	return { ok: true, user: { id, name, email, spotDefaultId: null } };
}
```

- [ ] **Step 4: Lancer et vérifier le succès**

Run: `npm test -- run src/lib/server/auth/register.test.ts`
Expected: PASS (7 tests).

- [ ] **Step 5: Suite complète + check**

Run: `npm test -- run && npm run check`
Expected: tous verts (46 + 7 = 53), check 0 erreur / 0 warning.

- [ ] **Step 6: Commit**

```bash
git add src/lib/server/auth/register.ts src/lib/server/auth/register.test.ts
git commit -m "feat(auth): module register (inscription publique, validation + unicité e-mail)"
```

---

### Task 2: Route `/register` (écran + action) + lien depuis `/login`

**Files:**
- Create: `src/routes/register/+page.server.ts`
- Create: `src/routes/register/+page.svelte`
- Modify: `src/routes/login/+page.svelte` (ajout du lien « Créer un compte »)

**Interfaces:**
- Consumes: `register` (Task 1) ; `createSession`, `generateSessionToken`, `SESSION_COOKIE`, `SESSION_TTL_MS` (Plan 2, `$lib/server/auth/session`) ; `db` ; `Card`, `Button`, `TextField`.
- Produces : route `/register` (hors group `(app)`, sans TabBar) ; action par défaut qui crée le compte, ouvre une session, pose le cookie et redirige vers `/`. Un utilisateur déjà connecté est redirigé vers `/`.

- [ ] **Step 1: Implémenter l'action `src/routes/register/+page.server.ts`**

```ts
import { fail, redirect } from '@sveltejs/kit';
import { dev } from '$app/environment';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { register } from '$lib/server/auth/register';
import {
	createSession,
	generateSessionToken,
	SESSION_COOKIE,
	SESSION_TTL_MS
} from '$lib/server/auth/session';

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.user) throw redirect(303, '/');
	return {};
};

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const data = await request.formData();
		const name = String(data.get('name') ?? '');
		const email = String(data.get('email') ?? '');
		const password = String(data.get('password') ?? '');

		const res = await register(db, { name, email, password });
		if (!res.ok) {
			return fail(400, { error: res.error, name, email });
		}

		const token = generateSessionToken();
		createSession(db, res.user.id, token);
		cookies.set(SESSION_COOKIE, token, {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			secure: !dev,
			maxAge: Math.floor(SESSION_TTL_MS / 1000)
		});

		throw redirect(303, '/');
	}
};
```

- [ ] **Step 2: Implémenter l'écran `src/routes/register/+page.svelte`**

```svelte
<script lang="ts">
	import { enhance } from '$app/forms';
	import Card from '$lib/components/ui/Card.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import TextField from '$lib/components/ui/TextField.svelte';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();
</script>

<main class="auth">
	<header class="auth-head">
		<p class="auth-kicker">Bar d'Yeu</p>
		<h1>Créer un compte</h1>
	</header>

	<Card>
		<form method="POST" use:enhance class="auth-form">
			<TextField label="Nom" name="name" type="text" autocomplete="name" required value={form?.name ?? ''} />
			<TextField label="Adresse e-mail" name="email" type="email" autocomplete="username" required value={form?.email ?? ''} />
			<TextField label="Mot de passe" name="password" type="password" autocomplete="new-password" required />

			{#if form?.error}
				<p class="auth-error" role="alert" aria-live="polite">{form.error}</p>
			{/if}

			<Button type="submit">S'inscrire</Button>
		</form>
	</Card>

	<p class="auth-switch">Déjà un compte ? <a href="/login">Se connecter</a></p>
</main>

<style>
	.auth {
		min-height: 100dvh;
		display: flex;
		flex-direction: column;
		justify-content: center;
		gap: var(--space-8);
		padding: var(--space-6) var(--space-4);
		padding-top: max(var(--space-6), env(safe-area-inset-top));
		padding-bottom: max(var(--space-6), env(safe-area-inset-bottom));
		max-width: 480px;
		margin: 0 auto;
	}
	@supports (min-height: 100svh) {
		.auth { min-height: 100svh; }
	}
	.auth-kicker {
		font-size: var(--text-sm);
		letter-spacing: var(--tracking-wide);
		text-transform: uppercase;
		color: var(--text-faint);
		margin-bottom: var(--space-1);
	}
	.auth-head h1 {
		font-size: var(--text-3xl);
	}
	.auth-form {
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
	}
	.auth-error {
		font-size: var(--text-sm);
		color: var(--color-danger);
	}
	.auth-switch {
		text-align: center;
		font-size: var(--text-sm);
		color: var(--text-secondary);
	}
	.auth-switch a {
		color: var(--accent);
		font-weight: 500;
	}
</style>
```

- [ ] **Step 3: Ajouter le lien « Créer un compte » dans `src/routes/login/+page.svelte`**

Juste après le `</Card>` (avant la fermeture `</main>`), insérer :
```svelte
	<p class="login-switch">Pas encore de compte ? <a href="/register">Créer un compte</a></p>
```
Et dans le bloc `<style>`, ajouter :
```css
	.login-switch {
		text-align: center;
		font-size: var(--text-sm);
		color: var(--text-secondary);
	}
	.login-switch a {
		color: var(--accent);
		font-weight: 500;
	}
```

- [ ] **Step 4: Vérifier build + check + suite**

Run: `npm run build && npm run check && npm test -- run`
Expected: build OK, check 0/0, 53 tests verts.
Vérification manuelle (serveur buildé + DB migrée, ou en preview) : `/register` s'affiche sans TabBar ; e-mail déjà pris → message d'erreur ; inscription valide → cookie posé + redirection vers `/` (avec TabBar) ; liens login ↔ register fonctionnels.

- [ ] **Step 5: Commit**

```bash
git add src/routes/register/+page.svelte src/routes/register/+page.server.ts src/routes/login/+page.svelte
git commit -m "feat(auth): écran et action d'inscription publique + lien login <-> register"
```

---

### Task 3: Docs (seed désormais optionnel) + vérification finale

**Files:**
- Modify: `docs/DEPLOY.md` (section « Comptes (seed) »)

**Interfaces:**
- Consumes: rien (documentation).
- Produces : doc de déploiement alignée — l'inscription est publique ; le seed est optionnel (bootstrap/reset).

- [ ] **Step 1: Mettre à jour `docs/DEPLOY.md`**

Remplacer la première phrase de la section « Comptes (seed) » :
```md
L'app n'a **pas d'inscription publique** : les 2 comptes sont créés par un script.
```
par :
```md
L'inscription est **publique et ouverte** : n'importe qui peut créer un compte depuis l'écran `/register`. Le seed ci-dessous reste **optionnel** — pratique pour amorcer un premier compte ou réinitialiser un mot de passe.
```

- [ ] **Step 2: Vérification finale complète**

Run: `npm test -- run && npm run build && npm run check`
Expected : suite complète verte (**53 tests** = 46 + register 7), build OK, check 0 erreur / 0 warning.
Vérification manuelle de bout en bout (serveur buildé + DB migrée) : `/register` → inscription d'un nouveau compte → connecté et redirigé vers `/` ; déconnexion depuis Profil → `/login` ; reconnexion avec le compte créé → OK ; e-mail déjà pris → erreur ; `/register` en étant déjà connecté → redirigé vers `/`.

- [ ] **Step 3: Commit**

```bash
git add docs/DEPLOY.md
git commit -m "docs(auth): inscription publique (seed désormais optionnel)"
```

---

## Self-Review

**1. Spec coverage (spec §3/§4.1/§8 révisées) :**
- Inscription publique ouverte (login **et** register) → Tasks 1, 2 ✅
- Tout inscrit est ami par défaut (pas de table friends) → décision verrouillée, **rien à construire ici** (impacte Plan 6) ✅
- Hash argon2 + session cookie httpOnly (réutilisés du Plan 2) → Task 2 ✅
- Seed conservé mais optionnel → Task 3 ✅

**2. Placeholder scan :** chaque step contient le code complet ou la commande exacte avec sortie attendue. Aucun TODO/TBD.

**3. Type consistency :** `register` renvoie `{ ok: true; user: AuthUser } | { ok: false; error: string }` ; `AuthUser` et `MIN_PASSWORD_LENGTH` importés de `login.ts` (mêmes définitions que Plan 2). L'action `/register` consomme `register` + `createSession`/`generateSessionToken`/`SESSION_COOKIE`/`SESSION_TTL_MS` (signatures identiques au login du Plan 2). Props `TextField` (`label`, `name`, `type`, `autocomplete`, `required`, `value`) cohérentes avec le composant existant. `users` insert utilise `createdAt: new Date()` (mode `timestamp`, cohérent Drizzle).

**4. Sécurité :** mot de passe argon2 via `hashPassword` ; e-mail normalisé + unicité (contrainte DB + contrôle applicatif) ; cookie httpOnly + secure (prod) + sameSite lax. Risque assumé : inscription ouverte sans code ni rate-limit (décision produit).

**Risque connu / vérification manuelle :** comme au Plan 2, les actions form et le cookie nécessitent `ORIGIN` correct en production. Les tests unitaires couvrent la logique de `register` ; le flux HTTP (cookie, redirection, liens) se valide en preview/serveur buildé.
