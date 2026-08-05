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

## Commandes

```bash
pnpm dev                 # Chrome et Firefox en développement
pnpm build               # Builds de production Chrome et Firefox
pnpm typecheck           # Vérification TypeScript/Vue
pnpm exec vitest run     # Tests automatisés
pnpm lint:manifest       # Validation du manifeste Firefox construit
```

## Architecture

- Vue 3, TypeScript et Vite ;
- Manifest V3 avec configurations Chrome et Firefox ;
- Pinia et stockage navigateur pour les préférences ;
- script de contenu pour injecter la barre ToolGlows ;
- service worker pour la synchronisation entre onglets ;
- PrimeVue, Tailwind CSS et DaisyUI pour les interfaces.

Le manifeste demande actuellement les permissions `storage` et `tabs`, ainsi que l'injection du script de contenu sur les pages web. Toute permission supplémentaire doit être justifiée par une fonctionnalité et validée avant publication en store.

## Documentation

La documentation canonique se trouve dans `shipglows_data/` :

- `business/` : identité et périmètre produit ;
- `technical/` : architecture, développement et cartographie du code ;
- `editorial/` : surfaces publiques et règles de claims ;
- `workflow/` : spécifications, audits et historique de travail.

## État du produit

ToolGlows est en développement actif. Le socle multi-navigateur, la barre et les principaux outils sont implémentés, mais toutes les fonctions ne disposent pas encore du même niveau de validation en conditions réelles. La version du package reste pré-1.0.
