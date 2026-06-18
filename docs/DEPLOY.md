# Déploiement — Bar d'Yeu (Dokploy + Docker Compose)

Déploiement sur VPS via **Dokploy** (PaaS auto-hébergé). Traefik (intégré à Dokploy)
gère le reverse proxy et le **HTTPS Let's Encrypt** automatiquement — pas de nginx ni
certbot à configurer.

> ⚠️ Le HTTPS est **indispensable** : la PWA (service worker + « Ajouter à l'écran
> d'accueil » iOS/Android) ne fonctionne qu'en contexte sécurisé.

## Artefacts du repo
- `Dockerfile` — build multi-stage (compile `better-sqlite3`, build SvelteKit adapter-node, prune des devDeps).
- `docker-compose.yml` — service `app` (port 3000), volume `baryeu-data` pour la base SQLite.
- `scripts/migrate.js` — applique les migrations Drizzle au démarrage (deps de prod uniquement).
- `.dockerignore` — exclut node_modules, build, *.sqlite, docs, etc.

## Variables d'environnement (onglet *Environment* de Dokploy)
| Variable | Valeur | Rôle |
|---|---|---|
| `ORIGIN` | `https://ton-domaine.fr` | **Obligatoire** (adapter-node : URLs/CSRF). Doit = domaine HTTPS final. |
| `DATABASE_PATH` | `/data/data.sqlite` | Base persistée sur le volume (déjà dans le compose). |

`PORT`, `HOST`, `PROTOCOL_HEADER`, `HOST_HEADER` sont déjà fixés dans le compose.

## Étapes Dokploy
1. **Créer le projet** → *Create Service* → type **Compose**.
2. **Source** : connecter le repo GitHub `clementpep/yeu-bar-fishing`, branche
   (`feat/plan-1-fondations` pour tester, `main` une fois mergé). Dokploy lit le
   `docker-compose.yml` à la racine.
3. **Environment** : ajouter `ORIGIN=https://ton-domaine.fr`.
4. **Domains** : ajouter le (sous-)domaine, le router vers le service **`app`**, port
   **3000**, et **activer HTTPS** (Let's Encrypt). ⚠️ Le DNS du (sous-)domaine doit
   déjà pointer (enregistrement A) vers l'IP du VPS avant d'émettre le certificat.
5. **Deploy**. Dokploy build l'image et lance le conteneur. Au démarrage, les
   migrations s'appliquent (`scripts/migrate.js`) puis le serveur Node démarre.
6. Vérifier : ouvrir `https://ton-domaine.fr` → l'app se charge ; tester
   l'installation PWA sur iPhone (Safari → Partager → Sur l'écran d'accueil) et sur
   Android (Chrome → menu → Installer l'application).

## Redéploiements
À chaque release (push sur la branche suivie), relancer un **Deploy** dans Dokploy
(ou activer l'auto-deploy par webhook). Les nouvelles migrations Drizzle sont
appliquées automatiquement au démarrage du conteneur. Le volume `baryeu-data`
conserve la base entre les déploiements.

## Comptes (seed)

L'app n'a **pas d'inscription publique** : les 2 comptes sont créés par un script.

Les migrations sont déjà appliquées automatiquement au démarrage du conteneur
(`scripts/migrate.js`, sur `DATABASE_PATH`). Il reste donc seulement à créer les comptes :

1. Définir dans *Environment* (Dokploy, **non versionné**) :
   `SEED_USER1_EMAIL`, `SEED_USER1_NAME`, `SEED_USER1_PASSWORD`,
   `SEED_USER2_EMAIL`, `SEED_USER2_NAME`, `SEED_USER2_PASSWORD` (mot de passe ≥ 8 caractères).
2. Lancer le seed dans le conteneur (terminal Dokploy du service `app`) :
   `npm run db:seed` — **idempotent** (relançable pour réinitialiser un mot de passe).
   Le script cible `DATABASE_PATH` (= `/data/data.sqlite`, le volume persistant).
3. Vérifier que `ORIGIN=https://yeu-bar-fishing.clementpep.cloud` est défini
   (requis pour les actions POST/cookies en production).

Le changement de mot de passe est ensuite possible depuis l'écran **Profil**
(il invalide toutes les sessions de l'utilisateur : reconnexion requise).

> **En local** : migrer puis seeder une base jetable, p. ex.
> `DATABASE_PATH=dev.sqlite node scripts/migrate.js` puis
> `DATABASE_PATH=dev.sqlite SEED_USER1_EMAIL=… … npm run db:seed`.

## Vérification locale (optionnelle, avant de pousser)
```bash
docker compose build           # build l'image
ORIGIN=http://localhost:3000 docker compose up   # lance en local
# puis http://localhost:3000
```

## Sauvegarde de la base
La base vit dans le volume `baryeu-data` (`/data/data.sqlite`). Pense à une sauvegarde
périodique de ce volume (snapshot Dokploy/VPS) — c'est là que sont les comptes et les
carnets de prises.

## Dépannage

### 404 sur le domaine (TLS OK mais page « Not Found »)
Un **404 vient de Traefik** = aucune route ne correspond au host (≠ 502 qui voudrait dire
conteneur injoignable). Vérifier, dans l'ordre :
1. **Domains** (UI Dokploy) : domaine → service **`app`**, port **3000**, HTTPS activé.
2. **Réseau** : le service doit être sur **`dokploy-network`** (le réseau de Traefik). Il est
   désormais déclaré dans `docker-compose.yml` (`networks: [dokploy-network]`, `external: true`).
   Redéployer après ce changement.
3. **Logs** du conteneur : build terminé ✅, conteneur **Running**, message
   `[migrate] migrations appliquées sur /data/data.sqlite` puis démarrage du serveur Node.
   Si `migrate.js` plante → volume `/data` non monté/inscriptible.
4. **`ORIGIN`** défini dans *Environment* = `https://<domaine>` exact.

### 502 / Bad Gateway
Le router existe mais le backend ne répond pas : conteneur en crash-loop (voir Logs) ou
mauvais port (doit être `3000`).
