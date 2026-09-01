# ToolGlows

ToolGlows est une extension Chrome et Firefox qui ajoute une barre d'outils personnalisable directement dans les pages web. Elle regroupe des fonctions de lecture, de copie, de recherche, de navigation et de concentration sans imposer un changement d'application.

ToolGlows reste un produit autonome de l'écosystème Glows. Il complète CommandGlows pour la productivité et peut partager certains modules sociaux avec CommunityGlows, sans se confondre avec ces produits.

## Fonctionnalités

### Lecture et contenu

- compteur de mots, caractères, phrases et temps de lecture ;
- OCR instantané avec options de langue et de copie ;
- mode lecture personnalisable ;
- copie enrichie et copie automatique de la sélection.

### Navigation et recherche

- recherche rapide avec moteurs configurables ;
- exploration et copie des liens d'une page ;
- navigation et défilement accélérés ;
- défilement infini configurable ;
- ouverture, téléchargement ou copie par glisser-déposer ;
- rechargement de tous les onglets.

### Concentration et apparence

- mode sombre personnalisable et programmable ;
- masquage d'éléments par site ;
- remplacement des flux distrayants par une surface de concentration.

### Outils sociaux expérimentaux

- bibliothèque de contenus Instagram ;
- amélioration de l'interface Gmail ;
- analyse et export CSV de commentaires sociaux.

Ces modules dépendent des interfaces des plateformes tierces et doivent être considérés comme expérimentaux tant qu'ils ne disposent pas d'une preuve navigateur dédiée.

### Personnalisation

- activation individuelle des outils ;
- barre déplaçable, redimensionnable et épinglable ;
- préférences conservées dans le stockage du navigateur ;
- surfaces popup, options, panneau latéral et DevTools.

## Installation locale

Prérequis : Node.js `^20.19.0 || ^22.13.0 || >=24.0.0` et pnpm `10.33.2`.

```bash
corepack enable
pnpm install
pnpm dev
```

Pour charger une version locale, utilisez le dossier `dist/chrome` ou `dist/firefox` comme extension non empaquetée dans le navigateur correspondant.

ToolGlows doit disposer de l’accès « Sur tous les sites » pour afficher sa barre automatiquement. Si Edge ou Chrome restreint cet accès, le popup le détecte, explique la marche à suivre et ouvre directement la gestion de l’extension. Les pages internes du navigateur et les boutiques d’extensions restent protégées par le navigateur.

## Commandes

```bash
pnpm dev                 # Chrome et Firefox en développement
pnpm build               # Builds de production Chrome et Firefox
pnpm typecheck           # Vérification TypeScript/Vue
pnpm exec vitest run     # Tests automatisés
pnpm lint:manifest       # Validation du manifeste Firefox construit
pnpm launch              # Build de développement et lancement de Chrome
pnpm launch -- --firefox # Build de développement et lancement de Firefox
pnpm launch:all          # Lancement de Chrome, Firefox et Edge détectés
```

## Architecture

- Vue 3, TypeScript, Vite 8 et CRXJS stable ;
- Manifest V3 avec configurations Chrome et Firefox ;
- Pinia et stockage navigateur pour les préférences ;
- script de contenu pour injecter la barre ToolGlows ;
- service worker pour la synchronisation entre onglets ;
- Vue Router 5 avec génération de routes intégrée ;
- PrimeVue 3, Tailwind CSS et DaisyUI pour les interfaces.

Le manifeste partagé demande `alarms`, `bookmarks`, `scripting`, `storage` et `tabs`, ainsi que l'accès hôte nécessaire aux outils de page sur les URL autorisées. `scripting` et `alarms` maintiennent le pré-affichage sombre avant le rendu des sites, y compris aux limites d'un horaire configuré. `bookmarks` est requis par l'export de liens vers les favoris. Chrome ajoute `sidePanel` pour sa surface latérale et Firefox déclare la même surface avec `sidebar_action`. Toute permission supplémentaire doit être justifiée par une fonctionnalité et validée avant publication en store.

## Documentation

La documentation canonique se trouve dans `shipglows_data/` :

- `business/` : identité et périmètre produit ;
- `technical/` : architecture, développement et cartographie du code ;
- `editorial/` : surfaces publiques et règles de claims ;
- `workflow/` : spécifications, audits et historique de travail.

Les règles de contribution et les contraintes propres à l’extension sont décrites dans `AGENT.md`. La cartographie technique et le guide de maintenance se trouvent dans `shipglows_data/technical/`.

## État du produit

ToolGlows est en développement actif. Le socle multi-navigateur, la barre et les principaux outils sont implémentés, mais toutes les fonctions ne disposent pas encore du même niveau de validation en conditions réelles. La version du package reste pré-1.0.

La modernisation du toolchain d'août 2026 est implémentée, mais le produit ne doit être considéré prêt pour un store qu’après les builds, la validation du manifeste et les preuves réelles dans les deux navigateurs.
