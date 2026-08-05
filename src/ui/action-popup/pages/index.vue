<script setup lang="ts"></script>

<template>
  <div>
    <div class="hero">
      <div class="hero-content text-center">
        <div class="max-w-md">
          <h1>ToolGlows</h1>
          <p>
            Vos outils essentiels, directement dans chaque page web.
          </p>

          <div class="flex gap-2 justify-center mb-4">
            <RouterLink
              to="/common/features"
              class="btn btn-primary"
            >
              <i-ph-list-heart />
              Fonctionnalités
            </RouterLink>
            <RouterLink
              to="/common/pricing"
              class="btn btn-primary"
            >
              <i-ph-presentation-chart />
              Offre
            </RouterLink>
          </div>

          <RouterLink
            to="/common/account/login"
            class="btn btn-secondary btn-lg"
          >
            <i-ph-rocket-launch />
            Commencer
          </RouterLink>

          <br />

          <RouterLink
            to="/action-popup/playground"
            class="btn btn-link"
          >
            Tester l'interface
          </RouterLink>

        </div>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
