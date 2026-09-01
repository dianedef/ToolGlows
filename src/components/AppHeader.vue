<script setup lang="ts"></script>

<template>
  <div class="app-navbar navbar bg-primary text-primary-content p-2">
    <div class="app-navbar-brand flex-1 pl-2">
      <RouterLink
        to="/"
        class="flex gap-2 items-center"
      >
        <img
          src="@assets/logo.png"
          alt="logo"
          class="h-8 w-auto"
        />
        <div class="app-navbar-title text-base font-semibold">ToolGlows</div>
      </RouterLink>
    </div>
    <div class="app-navbar-actions flex-none">
      <ul class="app-navbar-menu menu menu-horizontal menu-xs">
        <li>
          <RouterLink to="/options-page">
            <i-ph-gear />
          </RouterLink>
        </li>
        <li>
          <LocaleSwitch />
        </li>
        <li>
          <div class="dropdown dropdown-bottom dropdown-end">
            <div
              tabindex="0"
              role="button"
              class="flex gap-1"
            >
              <i-ph-dots-three-vertical />
            </div>
            <ul
              tabindex="0"
              class="dropdown-content toolglows-header-menu"
            >
              <li><ThemeSwitch /></li>
              <li></li>
              <li>
                <RouterLink
                  to="/common/about"
                  class="text-primary"
                >
                  <i-ph-question />
                  About
                </RouterLink>
              </li>
            </ul>
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.app-navbar {
  min-width: 0;
  flex-wrap: wrap;
  gap: var(--tg-space-1) var(--tg-space-2);
}

.app-navbar-brand {
  min-width: 0;
}

.app-navbar-title {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.app-navbar-actions {
  max-width: var(--tg-full-width);
  margin-left: auto;
}

.app-navbar-menu {
  max-width: var(--tg-full-width);
  flex-wrap: wrap;
  justify-content: flex-end;
}
</style>

