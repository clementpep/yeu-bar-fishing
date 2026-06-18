# Plan 3 — Moteur Conditions (design spec)

> Date : 2026-06-18
> Statut : design validé en brainstorming, en attente de relecture avant écriture du plan d'implémentation
> Auteur : Clément Peponnet (projet perso)
> Spec produit de référence : `docs/superpowers/specs/2026-06-18-bar-yeu-fishing-app-design.md` (§4.3, §4.4, §5.1, §6, §9)

## 1. Objectif & périmètre

Doter l'app du **moteur de conditions** qui alimente l'écran d'accueil « Le moment » pour l'île d'Yeu / Port-Joinville :

- **Marées** : courbe de hauteur, pleines/basses mers, état (montant / descendant / étale), **coefficient** français.
- **Lune & soleil** : phase + % illumination + lever/coucher lune ; lever/coucher soleil + aube/crépuscule.
- **Météo / mer** : vent (force, direction), temps, vagues (hauteur/période).
- **Score de pêche** : indicateur 0–100 **explicable** (facteurs visibles), dérivé des éléments ci-dessus.
- **Écran « Le moment »** câblé avec ces données réelles (composants signature : courbe de marée animée, jauge de score), **fenêtres conseillées**, **conseil du jour** contextualisé.

**Hors périmètre Plan 3** (autres plans) : carnet & capture de conditions à la prise (Plan 4), savoir/quiz (Plan 5), duel/badges (Plan 6), offline avancé/finitions (Plan 7), multi-spots cartographiés.

## 2. Décisions verrouillées (issues du brainstorming 2026-06-18)

| Sujet | Décision |
|---|---|
| Marées | **Calcul harmonique local** (offline, gratuit, sans clé ni quota). |
| Constantes harmoniques | **Dérivées par analyse harmonique** d'une série d'observations de niveau marin de Port-Joinville issue de **REFMAR/SONEL** (réseau marégraphique français), **en Licence Ouverte 2.0** (donc **rediffusable** → constituantes committées en JSON, repo public OK). SHOM **interdit la rediffusion** de ses *constantes* (OHI) → exclu ; **FES2014** (AVISO) écarté faute de compte + lourdeur FTP/NetCDF. |
| Acquisition constantes | **Spike outillé (Task 1)** : télécharger une série de niveaux Port-Joinville (REFMAR, Licence Ouverte, ≥ ~1 an si possible), **fit harmonique least-squares** (ex. `utide`/`pytides`) → JSON committé, puis **validation vs prédictions/coef SHOM gratuits** (horaires PM/BM ~±10 min, coef ±5). **Repli** si la série REFMAR est inexploitable : extraction FES2014 (nécessite alors un compte AVISO). Si aucun ne valide → on rouvre la décision (API). |
| Météo / vent / vagues | **Open-Meteo** Forecast + Marine API — gratuit, **sans clé**. |
| Lune & soleil | Bibliothèque **suncalc** (MIT), calcul local offline. |
| Cron VPS | **Aucun en v1** : marées + lune calculées localement à tout instant ; seule la météo (réseau) est mise en cache pour l'offline. *(Écart assumé vs spec produit §4.2.)* |
| Spot | **Constante `ILE_DYEU`** (nom, lat, lng) en v1 ; table `spot` introduite au Plan 4. *(Écart YAGNI assumé vs spec produit §6.)* |
| Score | Fonction **pure et explicable** (0–100 + contributions), **pondérations par défaut documentées à calibrer**. |

## 3. Architecture en modules

Cinq unités à responsabilité unique. Calcul/réseau sous `src/lib/server/conditions/**` (server-only) ; types partagés purs sous `src/lib/conditions/**` si réutilisés côté client. La marée et la lune sont **déterministes** (calculables hors-ligne) ; la météo est la **seule** dépendance réseau.

```
spot (constante) ─┐
                  ├─► tide   ──┐
suncalc ──────────┼─► moon  ──┤
Open-Meteo ───────┴─► weather ┤
                              ├─► conditions (orchestrateur) ──► score ──► écran « Le moment »
constituants.json ─► tide ────┘
```

1. **`tide`** — prédiction harmonique pure : `predictHeights`, `findExtremes`, `tideStateAt`, `coefficientForDay`. Dépend d'un **JSON de constituantes** (interface stable, source interchangeable).
2. **`moon`** — wrapper suncalc : phase, illumination, lever/coucher lune **et** soleil (aube/crépuscule).
3. **`weather`** — client Open-Meteo : fetch + parse en modèle interne ; **cache offline** du dernier résultat.
4. **`score`** — fonction pure : agrège les facteurs pondérés → `{ value, rating, factors[] }` (contributions signées + libellés).
5. **`conditions`** — orchestrateur : assemble tide+moon+weather, calcule le score et les **fenêtres conseillées** → objet `DayConditions` consommé par l'UI :
   ```ts
   interface AdviceWindow { from: Date; to: Date; reason: string; } // ex. « aube », « étale de PM », « gros coef »
   interface DayConditions {
     spot: { id: string; name: string };
     day: Date;
     tides: DayTides;          // §4.2
     sunMoon: SunMoon;         // §6
     weather: WeatherNow | null; // null si jamais récupérée (offline au 1er lancement)
     weatherStale: boolean;    // true si servie depuis le cache
     score: FishingScore;      // §7, au moment courant
     windows: AdviceWindow[];  // fenêtres conseillées du jour
     tip: string;              // conseil du jour contextualisé
   }
   ```

**Propriété clé** : score, weather, moon et l'écran ne dépendent **pas** de la source des constituantes — seulement de l'interface du prédicteur `tide`.

## 4. Moteur de marée (cœur)

### 4.1 Acquisition des constituantes (Task 1 = spike)
- **Voie principale — fit harmonique sur données REFMAR (Licence Ouverte 2.0)** :
  1. Télécharger une série d'observations de niveau marin de Port-Joinville depuis **REFMAR / data.shom.fr / SONEL** (≥ ~1 an si possible ; ≥ 29 jours minimum pour les constituantes principales).
  2. **Analyse harmonique least-squares** (outil de prep one-time : `utide`/`pytides`/`uptide`) pour estimer amplitude `H` et phase `g` d'un jeu de constituantes dominantes (au minimum **M2, S2, N2, K2, K1, O1, P1, Q1, M4, MS4**, étendu si la série le permet). L'analyse least-squares sépare naturellement les constituantes astronomiques du résidu météo (surcote).
  3. Écrire le fichier committé `src/lib/server/conditions/data/port-joinville.constituents.json` (+ métadonnées : source REFMAR, station, période, datum, date de calcul, licence).
- **Critère de succès / validation** : prédire les horaires PM/BM sur 5–10 dates et comparer aux **prédictions SHOM gratuites** (portail public, `maree.info`) → écart cible **~±10 min** ; comparer le **coefficient** calculé aux coef **publiés par SHOM** → écart cible **±5**.
- **Repli** si la série REFMAR est inexploitable (lacunes, station indisponible) : extraction **FES2014** au point (nécessite un compte **AVISO+** + FTP/NetCDF + PyFES). Même critère de validation.
- **Garde-fou** : si ni le fit REFMAR ni FES ne passent la validation, **arrêt** et remontée à l'utilisateur pour rouvrir la décision (API tier gratuit). Le reste du plan reste valable (interface du prédicteur inchangée).

### 4.2 Prédicteur
- Bibliothèque **`@neaps/tide-predictor`** (MIT) consommant le JSON de constituantes (corrections nodales + arguments astronomiques inclus), ou implémentation minimale vettée si la lib pose problème. Tout est validé par les tests TDD ci-dessous.
- **Sorties** (types) :
  ```ts
  interface TideExtreme { time: Date; height: number; type: 'high' | 'low'; }
  interface TidePoint   { time: Date; height: number; }
  type TideTrend = 'rising' | 'falling' | 'slack';
  interface DayTides {
    extremes: TideExtreme[];          // PM/BM du jour, ordonnées
    curve: TidePoint[];               // échantillonnage régulier (ex. /10 min) pour l'animation
    coefficient: number;              // 20–120
  }
  ```
  - `predictHeights(day): TidePoint[]` (échantillonné).
  - `findExtremes(day): TideExtreme[]`.
  - `tideStateAt(t): TideTrend` (`slack` dans une fenêtre ±N min autour d'un extrême).
  - `coefficientForDay(day): number`.

### 4.3 Coefficient français
- Le coefficient (échelle 20–120) est **dérivé des amplitudes** (principalement M2+S2) / de la hauteur de pleine mer rapportée au niveau moyen, **normalisé** pour que vives-eaux ≈ 95–120 et mortes-eaux ≈ 20–45.
- **Formule exacte + calibration définies à l'implémentation**, validées contre les **coefficients publiés par SHOM** (donnée gratuite). C'est un point de risque identifié (§9.2 spec produit).

## 5. Météo & mer (Open-Meteo)

- **Sans clé.** Forecast API (vent, temps) + Marine API (vagues) au point `ILE_DYEU`.
  - Forecast (hourly/daily) : `wind_speed_10m`, `wind_direction_10m`, `weather_code`, `temperature_2m`.
  - Marine : `wave_height`, `wave_period` (+ direction si dispo).
- **Modèle interne** (parse découplé du format Open-Meteo) :
  ```ts
  interface WeatherNow {
    windSpeedKmh: number;
    windDirDeg: number;         // 0–360
    waveHeightM: number | null; // Marine peut être indisponible
    wavePeriodS: number | null;
    weatherCode: number;        // mappé en libellé FR + icône
    tempC: number;
    fetchedAt: Date;
  }
  ```
- **Offline** : à chaque chargement réussi, on **persiste** le dernier `WeatherNow` (table `conditions_cache`). Hors-ligne ou si le fetch échoue, on sert le dernier cache en l'**indiquant** dans l'UI (« données du <heure> »). Marées + lune restent calculées localement (toujours à jour).
- **Robustesse** : timeout court + dégradation gracieuse (la Marine API peut manquer → `wave* = null`, l'app reste fonctionnelle).

## 6. Lune & soleil (suncalc)

- Dépendance **suncalc** (MIT, minuscule, offline).
  ```ts
  interface SunMoon {
    sunrise: Date; sunset: Date; dawn: Date; dusk: Date;
    moonrise: Date | null; moonset: Date | null;
    moonPhase: number;        // 0–1 (0 = nouvelle, 0.5 = pleine)
    moonIllumination: number; // 0–1
    moonLabel: string;        // libellé FR (nouvelle, premier croissant, …)
  }
  ```
- Pur/déterministe → testé en TDD (valeurs de référence sur dates connues, tolérance raisonnable).

## 7. Score de pêche (pur & explicable)

- **Signature** :
  ```ts
  interface ScoreFactor { key: string; label: string; contribution: number; } // signé, en points
  type ScoreRating = 'faible' | 'moyen' | 'bon' | 'excellent';
  interface FishingScore { value: number; rating: ScoreRating; factors: ScoreFactor[]; }
  computeScore(input): FishingScore   // input = extrait de DayConditions à un instant donné
  ```
- **Modèle** : base + somme des contributions signées, **borné 0–100**. Chaque facteur produit une `ScoreFactor` affichable (« +25 fenêtre aube », « −15 vent fort »). **Pondérations par défaut à calibrer** (documentées dans le plan, jamais boîte noire) :
  | Facteur | Logique (défaut indicatif) |
  |---|---|
  | Base | 30 |
  | Marée en mouvement | montant/descendant **+20**, étale **+0** |
  | Proximité PM/BM | dans ±1 h d'un extrême **+10** |
  | Coefficient | mappé 0→+20 (gros coef favorable) |
  | Fenêtre solaire | aube/crépuscule ±1 h **+25** |
  | Vent / mer | calme/modéré **+5** ; vent fort (> ~30 km/h) **−15** ; mer forte **−10** |
  | Lune | nouvelle/pleine ±2 j **+8** |
  | Saison | pleine saison bar **+10** ; basse saison **−5** |
- **Bandes de rating** (défaut) : `<35 faible`, `35–59 moyen`, `60–79 bon`, `≥80 excellent`.
- **Fenêtres conseillées** : intervalles où le score dépasse un seuil (aube/crépuscule, ±1 h des étales, créneaux de gros coef), renvoyés par l'orchestrateur pour affichage.

## 8. Écran « Le moment »

Câblage de l'écran existant (livré au design system) avec `DayConditions` :
- **Courbe de marée animée** (montant/descendant, étales, position « maintenant ») — composant signature.
- **Coefficient** du jour + tendance.
- **Jauge de score explicable** — composant signature, affiche les `factors` contributifs.
- **Fenêtres conseillées** (aube/crépuscule, étales, gros coef).
- **Synthèse** vent / mer / météo (icône + libellé FR + chiffres tabulaires), avec mention « données du <heure> » si cache.
- **Conseil du jour** contextualisé (technique adaptée au moment de marée/heure/saison) — règles simples dérivées des conditions.

> Les composants signature (courbe, jauge) à forte dimension visuelle passent par la skill **`frontend-design`** au moment de l'implémentation. Tout style dérive des tokens (single source of truth).

## 9. Modèle de données

- **`conditions_cache`** (météo uniquement en v1) :
  ```
  id (pk), spot (text, = 'ile-dyeu'), weather_json (text), fetched_at (timestamp)
  ```
  Marées/lune **non stockées** (recalculées localement). Migration Drizzle générée.
- **Spot** : constante `ILE_DYEU = { id: 'ile-dyeu', name: 'Île d'Yeu · Port-Joinville', lat, lng }` (pas de table en v1). La table `spot` arrivera au Plan 4 quand le carnet en aura besoin.

## 10. Offline & PWA

- Marées + lune : **toujours** disponibles hors-ligne (calcul local, constituantes embarquées).
- Météo : dernier cache servi hors-ligne, avec indication de fraîcheur.
- Le service worker (déjà en place, Plan 1) couvre l'app shell ; l'endpoint conditions doit dégrader proprement sans réseau.

## 11. Stratégie de test

- **Unitaires (TDD)** : `tide` (extremes, trend, échantillonnage, coefficient), `moon` (valeurs de référence), `weather` (parsing Open-Meteo → modèle interne, gestion Marine absente), `score` (cas représentatifs + bornage + contributions), `conditions` (assemblage + fenêtres).
- **Validation marée** (Task 1) : horaires PM/BM et coefficient vs prédictions/coef **SHOM gratuits** (5–10 dates).
- **Front** : composants critiques (courbe de marée, jauge de score) — rendu de base.
- **Manuel ciblé** : écran « Le moment » sur Safari iOS **et** Chrome Android (lisibilité plein soleil, safe areas, animation marée), comportement offline (couper le réseau → marées/lune OK, météo en cache daté).
- **Non négociable** : zéro régression (suite existante verte), `npm run check` 0/0, `npm run build` OK.

## 12. Risques & points ouverts

1. **Acquisition des constituantes** (principal) : disponibilité et qualité de la série REFMAR Port-Joinville (lacunes, longueur). → spike Task 1 time-boxé + validation SHOM + repli FES2014 (compte AVISO) + garde-fou (arrêt si validation échoue).
2. **Exactitude** : un fit sur série marégraphique portuaire est *a priori* précis localement ; reste à confirmer la validation SHOM (±10 min / ±5 coef), sinon ajuster (plus de constituantes / série plus longue) ou repli.
3. **Coefficient français** : formule/normalisation à calibrer contre les coef SHOM publiés.
4. **Pondérations du score** : valeurs par défaut « pêche du bar » documentées, à calibrer ultérieurement — marquées comme telles.
5. **Licence des données** : REFMAR/SONEL = **Licence Ouverte 2.0** (rediffusion OK) ; documenter source/station/période/licence dans le JSON. (Ne PAS committer de constantes SHOM, non rediffusables.)
6. **Disponibilité Open-Meteo Marine** : peut manquer ponctuellement → dégradation gracieuse (`wave* = null`).

## 13. Hors périmètre (rappel)

Carnet & capture conditions à la prise (Plan 4), savoir/quiz (Plan 5), duel/badges (Plan 6), offline avancé & finitions (Plan 7), multi-spots cartographiés, notifications de créneau favorable.
