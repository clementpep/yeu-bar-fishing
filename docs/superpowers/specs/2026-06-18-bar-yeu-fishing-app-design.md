# Bar d'Yeu — Application compagnon de pêche au bar (design spec)

> Date : 2026-06-18
> Statut : validé en brainstorming, en attente de relecture finale avant plan d'implémentation
> Auteur : Clément Peponnet (projet perso)

## 1. Vision

Application web **mobile-first**, installable sur l'écran d'accueil (PWA), qui aide à **pêcher le bar** — en bateau comme du bord (surfcasting) — avec l'**île d'Yeu (Vendée)** comme lieu prioritaire par défaut.

Trois moments d'usage structurent tout le produit :

1. **Avant la sortie** — « Est-ce que ça vaut le coup d'y aller, et à quel créneau ? » → conditions live (marées, coefficients, vent, météo, lune) et fenêtres conseillées.
2. **Pendant** — « Quelle technique / stratégie maintenant ? » → fiches techniques interactives, montages illustrés, conseils contextualisés selon marée / heure / saison.
3. **Après** — « Je note ma prise et je me compare à mon copain. » → carnet de pêche, records, duel amical, badges, défis.

L'app est utilisée par **deux pêcheurs** (le père de Clément et son ami). Elle doit être **éducative**, **ludique et interactive** (pas de pavés indigestes), **ergonomique**, **robuste**, et dotée d'un **design premium avancé** — au niveau des meilleures apps de pêche, sans aucun « look IA générique ».

## 2. Utilisateurs & objectifs

- **Profil** : 2 pêcheurs amateurs passionnés, usage iPhone (Safari) en priorité **mais Android (Chrome) comme cible de premier rang également**, souvent **sur l'eau sans réseau**.
- **Objectifs utilisateurs** :
  - Savoir quand et comment pêcher le bar à l'île d'Yeu.
  - Apprendre / réviser les techniques sans s'ennuyer.
  - Garder une trace de ses prises et se mesurer (amicalement) à l'autre.
- **Critères de succès** :
  - Utilisable et agréable **aussi bien sur iPhone (Safari) que sur Android (Chrome)**, installable sur l'écran d'accueil des deux (icône adaptative/maskable côté Android).
  - Fonctionne **hors-ligne** pour le carnet et le contenu éducatif.
  - Design ressenti comme « premium » et distinctif, pas templated.
  - Conseils de conditions perçus comme **utiles et fiables**.

## 3. Décisions de conception (verrouillées en brainstorming)

| Sujet | Décision |
|---|---|
| Niveau d'intelligence conditions | **Assistant complet** (marées + coef + météo/vent + lune + score de pêche), **APIs gratuites uniquement**. |
| Hébergement | **VPS Hostinger**, app **full-stack** auto-hébergée. |
| Contenu éducatif | **Rédigé et assumé par l'assistant**, format **ludique et interactif** (fiches, schémas, quiz) — pas de longs pavés. |
| Mécaniques ludiques | **Les 4** : carnet & records perso, duel/classement amical, badges & défis, quiz d'apprentissage. |
| Stack | **SvelteKit + SQLite (Drizzle ORM)** — validé. |
| Langue | **Français**. |
| Lieu par défaut | **Île d'Yeu / Port-Joinville**, avec possibilité d'ajouter d'autres spots (v1 minimale, extensible). |
| Inscription | **Publique et ouverte** (révision 2026-06-18, *amende* la décision initiale « 2 comptes, pas d'inscription publique ») : n'importe qui peut créer un compte (nom + e-mail + mot de passe argon2). Risque de spam assumé pour une app perso. Le seed reste disponible (bootstrap/reset). |
| Amis / social | **Tout utilisateur inscrit est « ami » par défaut** : pas de table `friends`, pas de mécanisme d'ajout d'amis. Le duel/classement (Plan 6) porte sur l'ensemble des inscrits. |

## 4. Stack technique & architecture

### 4.1 Choix de stack

**SvelteKit + SQLite** (validé). Justification : bundles ultra-légers (perf maximale sur Safari iOS), animations premium natives (transitions / motion), PWA & offline simples, un seul livrable déployable sur le VPS.

- **ORM** : Drizzle (typé, léger, migrations simples).
- **Auth** : email + mot de passe, hash **argon2**, sessions cookie **httpOnly** (implémentation maison minimale, livrée au Plan 2). **Inscription publique ouverte** (révision 2026-06-18) : écrans login **et** register ; tout inscrit est ami par défaut. Extensible.
- **PWA / offline** : service worker (Workbox ou natif Vite PWA) ; cache du contenu éducatif + dernières conditions synchronisées ; carnet en *local-first* puis synchronisation.
- **Déploiement** : `@sveltejs/adapter-node` + PM2 + nginx (reverse proxy + TLS). Guide de déploiement fourni à l'implémentation.

### 4.2 Schéma d'architecture

```
SvelteKit (app unique déployée sur le VPS Hostinger)
├── Front PWA mobile-first (offline-ready, installable iOS)
├── Routes API (+server.ts) : auth, prises, conditions, classement, quiz
├── SQLite (fichier local VPS) via Drizzle ORM
└── Cron VPS quotidien : pré-fetch marées + météo → cache en base (conditions_cache)
        ↓ consomme
   Open-Meteo (météo/vent/vagues, SANS clé)
   API marées (clé gratuite, tier gratuit) — à finaliser, voir 4.3
   Lune (calcul astronomique local, sans API)
```

### 4.3 Sources de données (gratuites)

- **Météo / vent / vagues** : **Open-Meteo** (Forecast + Marine API) — gratuit, **sans clé**. ✅
- **Lune** (phase, % illumination, lever/coucher) : **calcul local** (algorithme astronomique). Gratuit, offline. ✅
- **Marées + coefficients** : **point ouvert à finaliser**. Pas d'API totalement gratuite et sans clé fiable pour Port-Joinville. Approche retenue : **API en tier gratuit avec clé gratuite** (candidats : WorldTides, Stormglass), **pré-fetchée et mise en cache quotidiennement par un cron sur le VPS** → reste dans les quotas gratuits **et** fonctionne hors-ligne une fois synchronisé.
  - *Décision à confirmer au plan* : choix du fournisseur + repli éventuel (calcul harmonique local à partir de constantes publiées si une source libre fiable est trouvée).
  - *Coefficients de marée* : valeur française spécifique ; à dériver de la donnée marée (marnage) ou d'une source dédiée. À cadrer au plan.

### 4.4 Score de pêche (logique)

Indicateur synthétique (0–100 ou échelle qualitative) calculé à partir de facteurs pondérés, **transparent et explicable** (on affiche *pourquoi*) :
- moments de marée (étales, montant/descendant, **gros coefficient** favorable au bar) ;
- fenêtres aube / crépuscule ;
- vent (force/direction) et état de mer ;
- phase de lune ;
- saison.
Le détail exact des pondérations sera défini et documenté au plan (basé sur les pratiques reconnues de pêche du bar). **Toujours explicable**, jamais une boîte noire.

## 5. Écrans & navigation

Navigation par **onglets en bas** (ergonomie pouce). 5 onglets :

1. **Le moment (Accueil)** — score de pêche du jour pour l'île d'Yeu ; **courbe de marée animée** + coefficient ; **fenêtres conseillées** (lever/coucher du soleil, étales, gros coef) ; synthèse vent / mer / météo ; **conseil du jour** contextualisé (technique adaptée au moment).
2. **Savoir** — bibliothèque éducative **interactive** :
   - Techniques : **leurre**, **surfcasting**, **appâts naturels**, **traîne**, **pêche à soutenir**.
   - **Montages illustrés** (schémas), réglages selon conditions.
   - **Stratégies** selon marée / saison / heure de la journée.
   - **Réglementation** : maille **42 cm** (façade Atlantique/Manche), quotas, périodes.
   - **Quiz** intégrés (score, mémorisation ludique).
   - Format : fiches / cartes, schémas, courtes séquences — **jamais de longs pavés**.
3. **Carnet** — saisie d'une prise : taille (cm), poids estimé, technique, leurre/appât, spot, photo, gardé/relâché ; **capture automatique des conditions** au moment de la prise (marée, coef, vent, météo) ; historique, **records**, statistiques de progression.
4. **Duel** — **classement amical** père vs ami (saison en cours, plus gros bar, nombre de prises) ; **badges** débloqués ; **défis** en cours (hebdo).
5. **Profil** — compte, records perso, badges, réglages (spot par défaut = île d'Yeu, unités, déconnexion).

## 6. Modèle de données (SQLite / Drizzle)

- **user** : id, nom, email, password_hash, avatar, spot_default_id, created_at
- **session** : id, user_id, expires_at (auth cookie)
- **spot** : id, nom, lat, lng, tide_station (Port-Joinville par défaut)
- **catch** : id, user_id, spot_id, caught_at, length_cm, weight_est, technique, lure_bait, photo_path, released (bool), conditions_json (marée/coef/vent/météo capturés), created_at
- **conditions_cache** : id, spot_id, day, tides_json, weather_json, moon_json, fetched_at (rempli par le cron)
- **badge** : id, code, nom, description, illustration ; **user_badge** : user_id, badge_id, earned_at
- **challenge** : id, code, libellé, période, critère ; (progression dérivée des `catch`)
- **quiz_result** : id, user_id, quiz_code, score, taken_at

Records & classement = **vues / requêtes calculées** sur `catch` (pas de dénormalisation prématurée).

**Validation maille** : une prise `length_cm < 42` est signalée « à relâcher » (pédagogie + cohérence des records), **sans blocage** de saisie.

## 7. Direction UX/UI — exigence centrale du projet

> L'UX/UI est traitée comme une **discipline à part entière**, au niveau d'un designer produit senior ayant raffiné le domaine pendant des années. Aucun rendu « IA générique ». La direction fine (moodboard, tokens, choix typographiques définitifs, prototypes de micro-interactions) sera élaborée avec la skill **frontend-design** à l'implémentation. Ce qui suit fixe le cap et les non-négociables.

### 7.1 Principes directeurs

- **Distinctif, pas templated** : une vraie patte éditoriale nautique, reconnaissable. On bannit le « dashboard SaaS bleu » par défaut.
- **Contenu d'abord, chrome ensuite** : la donnée (score, marée, prise) est la star ; l'UI s'efface.
- **Hiérarchie radicale** : gros chiffres lisibles d'un coup d'œil (conditions consultées sur un bateau qui bouge, en plein soleil).
- **Calme et profondeur** : ambiance marine premium, sensation d'eau et de profondeur — sobre, jamais gadget.
- **Cohérence systémique** : tout dérive d'un **design system** (tokens), pas de one-off.

### 7.2 Identité visuelle

- **Palette** : bleus profonds (abysse → marine) et ardoise, avec accents **laiton / or** et **sable** ; surfaces sombres dominantes possibles (lisibilité soleil + cachet premium). Bleu SaaS générique proscrit.
- **Typographie** : duo éditorial — un **display** à caractère pour les titres + une **grotesque** très lisible pour data/texte ; chiffres tabulaires pour les conditions et stats.
- **Iconographie & illustration** : style cohérent et soigné (montages, badges illustrés), pas de banque d'icônes générique mal intégrée.

### 7.3 Composants signature

- **Courbe de marée animée** (montant/descendant, étales marquées, position « maintenant »).
- **Jauge de score de pêche** explicable (les facteurs qui contribuent sont visibles).
- **Carte de prise** : photo + conditions capturées, traitée comme un objet premium.
- **Badges illustrés** et progression de défis.
- **Cartes de fiches** (Savoir) tactiles, avec schémas de montage.

### 7.4 Micro-interactions & motion

- Transitions fluides entre écrans, effets d'eau / profondeur subtils, retours visuels (et haptiques si dispo) sobres.
- Le motion **sert la compréhension** (marée qui monte, score qui se compose), jamais décoratif gratuit.
- Respect de `prefers-reduced-motion`.

### 7.5 Contraintes terrain (non négociables)

- **Mobile-first strict** : zones de tap larges, navigation au pouce, ergonomie une main.
- **Lisibilité plein soleil** : contraste élevé, tailles généreuses.
- **Safari iOS ET Chrome Android impeccables** : safe areas (encoche / barre iOS, barre de navigation gestuelle Android) via `env(safe-area-inset-*)`, pas de bugs de viewport (`100dvh`, `viewport-fit=cover`), installable sur l'écran d'accueil des deux plateformes avec icône et splash soignés. Côté Android : icône **maskable** (adaptive icon) et `theme_color`/`background_color` dans le manifest ; ne pas dépendre de comportements webkit-only.
- **Performance** : bundles légers, rendu rapide même en réseau faible ; offline gracieux.
- **Accessibilité** : contraste AA minimum, focus visibles, tailles de police respectées.

## 8. Périmètre

### v1 (cible de ce cycle)
- Auth **inscription publique ouverte** (argon2, sessions cookie) — login + register ; tout inscrit est ami par défaut (révision 2026-06-18).
- Accueil « Le moment » : conditions live île d'Yeu + score de pêche explicable + fenêtres conseillées.
- Savoir : bibliothèque éducative interactive + quiz.
- Carnet : saisie prise + capture auto des conditions + records & stats.
- Duel : classement amical + badges + défis.
- Profil & réglages.
- PWA installable + offline (contenu + carnet).
- Design premium (design system + composants signature).

### Plus tard (hors v1 — YAGNI)
- Spots multiples avancés / ajout libre cartographié.
- Partage social externe.
- Galerie photos cloud.
- Notifications push (alerte créneau favorable).

## 9. Risques & points à finaliser au plan

1. **Source marées gratuite** : choisir le fournisseur (tier gratuit + clé gratuite) et la stratégie de cache/cron ; définir le repli (harmonique local) si une source libre fiable existe. *Risque principal.*
2. **Coefficients de marée** : méthode de calcul / source (spécificité française).
3. **Pondérations du score de pêche** : à documenter et calibrer sur des bases reconnues.
4. **Stockage des photos** : système de fichiers VPS en v1 (pas de cloud), prévoir taille/compression.
5. **Exactitude du contenu éducatif & réglementaire** : rédigé par l'assistant, points sensibles (réglementation) à marquer pour relecture.

## 10. Stratégie de test

- **Unitaires** : calcul lune, calcul/parse marées, logique du score de pêche, validation maille (42 cm), agrégations records/classement.
- **Intégration** : routes API (auth, prises, conditions), cache cron.
- **Front** : composants critiques (courbe de marée, jauge de score, formulaire de prise).
- **Manuel ciblé multi-plateforme** : rendu et ergonomie sur **Safari iOS** ET **Chrome Android** (safe areas/encoche/barre gestuelle, viewport `100dvh`, installation PWA + icône maskable Android, splash, offline). Vérifier l'installabilité (Lighthouse PWA) sur les deux.
- TDD appliqué sur la logique métier (lune, marée, score, validation).
