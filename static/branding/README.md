# Branding — logo « Pêche au Bar »

Dépose ici le logo fourni pour que je puisse le décliner partout dans l'app
(icônes PWA, favicon, apple-touch-icon, splash, en-têtes login/register).

## Quoi déposer (par ordre de préférence)

1. **`logo.svg`** *(idéal)* — version vectorielle : nette à toutes les tailles, parfaite
   pour générer les icônes. Si tu l'as en SVG, c'est le meilleur choix.
2. **`logo.png`** — la version que tu m'as montrée (badge rond « Pêche au Bar · Île d'Yeu ·
   Vendée »), **haute résolution** (≥ 1024×1024), idéalement sur **fond transparent**
   (sinon le fond marine actuel convient pour l'usage « tuile »).
3. *(optionnel)* **`logo-mark.svg`/`.png`** — une version **simplifiée sans texte**
   (juste le bar + le phare dans l'anneau) : utile pour les petites icônes/favicon où le
   texte « Île d'Yeu · Vendée » serait illisible.

## Comment faire

- Glisse le fichier dans ce dossier `static/branding/` (via l'explorateur Windows ou VS Code),
  en le nommant exactement `logo.svg` ou `logo.png`.
- Dis-moi quand c'est fait (« logo déposé ») : je lance le chantier branding
  (génération des icônes via `scripts/gen-icons.mjs` adapté, intégration UI, manifest/couleurs).

> Note design : le logo complet (avec l'anneau de texte) est superbe pour les écrans et le splash.
> Pour les **petites icônes** et le favicon, je recommande la variante « mark » sans texte
> (lisibilité). Si tu n'as pas de variante simplifiée, je peux en dériver une proprement.
