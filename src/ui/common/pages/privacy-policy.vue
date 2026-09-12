<template>
  <article class="privacy-policy">
    <RouterLinkUp />

    <h1>Politique de confidentialité</h1>
    <p><strong>Dernière mise à jour : 4 septembre 2026.</strong></p>
    <p>
      ToolGlows ajoute une barre d’outils aux pages web compatibles. Son
      fonctionnement principal est local : l’extension n’exige pas de compte,
      ne contient pas de publicité et ne vend pas de données personnelles.
    </p>

    <h2>Données traitées localement</h2>
    <ul>
      <li>URL et domaine de la page active, pour appliquer les réglages propres au site ;</li>
      <li>contenu sélectionné ou visible, uniquement lorsque vous déclenchez un outil qui en a besoin ;</li>
      <li>liens, titres d’onglets et favoris nécessaires aux actions demandées ;</li>
      <li>préférences ToolGlows, raccourcis et sélecteurs d’éléments masqués.</li>
    </ul>
    <p>
      Ces données servent exclusivement à fournir les fonctions visibles de
      l’extension. ToolGlows n’établit pas d’historique de navigation à des
      fins publicitaires ou analytiques.
    </p>

    <h2>Stockage et conservation</h2>
    <p>
      Les préférences et configurations par site sont enregistrées dans le
      stockage de l’extension du navigateur. Les résultats temporaires restent
      en mémoire pour la session de la page. Vous pouvez
      supprimer les configurations par site depuis les paramètres de ToolGlows
      et effacer toutes les données en désinstallant l’extension.
    </p>

    <h2>Transmission</h2>
    <p>
      ToolGlows ne transmet pas le contenu des pages, les images analysées, le
      contenu sélectionné, les URL consultées ou les favoris à l’éditeur ou à
      un service tiers.
    </p>

    <h2>Permissions du navigateur</h2>
    <p>
      L’accès aux pages web permet d’afficher la barre sur toutes les URL
      compatibles et d’exécuter les outils demandés. Les permissions de
      stockage, onglets, favoris, alarmes et injection de scripts sont utilisées
      seulement par les fonctions correspondantes de ToolGlows.
    </p>

    <h2>Vos choix</h2>
    <p>
      L’acceptation automatique des cookies est désactivée par défaut. Si vous
      l’activez, ToolGlows recherche localement les bannières reconnues et clique
      sur leur bouton d’acceptation, y compris pour les cookies publicitaires.
      Ce choix et les exceptions par site restent dans ce navigateur. Les sites
      peuvent alors déposer des cookies et transmettre des données selon leurs
      propres politiques. Désactiver cette fonction ne retire pas les accords
      déjà enregistrés : modifiez-les dans les réglages cookies du site.
    </p>
    <p>
      Vous pouvez désactiver chaque outil, restaurer les éléments masqués d’un
      site, effacer les données de l’extension depuis votre navigateur ou
      désinstaller ToolGlows à tout moment.
    </p>

    <h2>Contact</h2>
    <p>
      Pour une question relative à la confidentialité ou une demande concernant
      vos données, utilisez le canal d’assistance indiqué sur la fiche officielle
      de ToolGlows dans le magasin où vous avez installé l’extension.
    </p>
  </article>
</template>

<style scoped>
.privacy-policy {
  max-width: var(--tg-size-800);
  margin-inline: auto;
}

.privacy-policy li + li {
  margin-top: var(--tg-space-2);
}
</style>
