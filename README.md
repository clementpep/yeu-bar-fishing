# 🎣 Bar d'Yeu

Application web **mobile-first** (PWA, installable sur l'écran d'accueil iOS & Android)
pour aider à **pêcher le bar** — en bateau comme du bord — avec l'**île d'Yeu (Vendée)**
comme lieu par défaut.

À la fois **assistant de conditions** (marées, coefficients, vent, météo, lune, score de
pêche), **bibliothèque éducative interactive** (techniques, stratégies, réglementation) et
**carnet de pêche social** (records, duel amical, badges, quiz) — avec un **design premium**
assumé, pensé pour 2 pêcheurs.

> Projet perso. Pensé pour fonctionner aussi bien sur **iPhone (Safari)** que sur
> **Android (Chrome)**, et **hors-ligne** (sur le bateau, sans réseau).

## 🧭 Statut

| Phase | État |
|---|---|
| **Plan 1 — Fondations** | ✅ Terminé (scaffold, design system, shell + navigation, PWA installable, base SQLite) |
| Plan 2 — Auth & Profil | ⏳ À venir |
| Plan 3 — Moteur Conditions (marées/météo/lune/score) | ⏳ À venir |
| Plan 4 — Carnet de pêche | ⏳ À venir |
| Plan 5 — Savoir & Quiz | ⏳ À venir |
| Plan 6 — Duel & Gamification | ⏳ À venir |
| Plan 7 — Offline avancé & finitions | ⏳ À venir |

Les écrans actuels (Le moment, Savoir, Carnet, Duel, Profil) sont des **placeholders** : la
coquille, le design system et l'infrastructure sont en place ; les fonctionnalités arrivent
plan par plan.

## 🛠️ Stack

- **[SvelteKit 2](https://svelte.dev/docs/kit) + Svelte 5** (runes), **TypeScript** strict
- **PWA** : `vite-plugin-pwa` / `@vite-pwa/sveltekit` (manifest, service worker, icône maskable Android)
- **Base de données** : **SQLite** via **Drizzle ORM** + `better-sqlite3`
- **Design system** : tokens typés (palette nautique « abysse → laiton »), polices auto-hébergées **Fraunces** (titres) + **Inter** (data), via `@fontsource-variable`
- **Tests** : **Vitest** + `@testing-library/svelte`
- **Build/run** : `@sveltejs/adapter-node`
- **Déploiement** : Docker + Docker Compose (Dokploy) — voir [`docs/DEPLOY.md`](docs/DEPLOY.md)

## 🚀 Démarrage

Pré-requis : **Node ≥ 20**, **npm**.

```sh
npm install
npm run dev        # serveur de dev (http://localhost:5173)
npm run dev -- --open
```

### Scripts utiles

| Script | Rôle |
|---|---|
| `npm run dev` | Serveur de développement |
| `npm run build` | Build de production (adapter-node, sortie `build/`) |
| `npm run preview` | Prévisualise le build de production |
| `npm test` | Lance les tests (Vitest) |
| `npm run check` | Vérification de types (svelte-check) |
| `npm run db:generate` | Génère une migration Drizzle depuis le schéma |
| `npm run db:migrate` | Applique les migrations |
| `npm run gen:icons` | Régénère les icônes PWA depuis `static/icons/icon.svg` |

## 📁 Structure

```
src/
├── app.html, app.css          # base HTML + tokens CSS globaux (design system)
├── lib/
│   ├── design/tokens.ts       # tokens typés (couleurs, espacements, typo, ombres)
│   ├── components/ui/          # primitives (Button, Card, TabBar)
│   └── server/db/              # schéma Drizzle + client SQLite (server-only)
└── routes/                     # 5 onglets : / · /savoir · /carnet · /duel · /profil
static/icons/                   # icônes PWA (192/512/maskable/apple-touch) + source SVG
drizzle/                        # migrations SQL générées
docs/
├── DEPLOY.md                   # guide de déploiement Dokploy
└── superpowers/                # specs & plans d'implémentation
```

## 🚢 Déploiement

Conçu pour **Dokploy** (PaaS auto-hébergé sur VPS) via le `docker-compose.yml` à la racine :
Traefik gère le reverse proxy et le **HTTPS** automatiquement, la base SQLite est persistée
sur un volume, et les migrations s'appliquent au démarrage du conteneur.
👉 Procédure complète dans [`docs/DEPLOY.md`](docs/DEPLOY.md).

## 📜 Réglementation

La taille minimale de capture du bar retenue est de **42 cm** (façade Atlantique / Manche).
Le contenu réglementaire sera intégré et signalé pour relecture dans les phases dédiées.
