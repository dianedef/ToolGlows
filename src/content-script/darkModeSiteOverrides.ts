const OSCARO_HOSTNAMES = new Set(['oscaro.com', 'www.oscaro.com'])

export function buildSiteDarkModeOverrides(hostname: string): string {
  if (!OSCARO_HOSTNAMES.has(hostname.toLowerCase())) return ''

  return `
    .filter-container,
    .filter-container .form-group__input.form-select {
      background-color: var(--tg-page-dark-surface) !important;
      color: var(--tg-page-dark-text) !important;
    }

    .filter-container :is(h2, legend, label, button, span) {
      color: inherit !important;
    }

    .vehicle-identification {
      background-color: var(--tg-page-dark-surface-warm) !important;
      border: 1px solid var(--tg-page-dark-border) !important;
      color: var(--tg-page-dark-text) !important;
    }

    .vehicle-identification .button,
    .opcom-html__trigger {
      background-color: var(--tg-page-dark-action-surface) !important;
      border: 1px solid var(--tg-page-dark-action-border) !important;
      box-shadow: var(--tg-page-dark-control-shadow) !important;
      color: var(--tg-page-dark-text) !important;
    }

    .opcom-html__trigger *,
    .opcom-html__trigger::before,
    .opcom-html__trigger::after {
      background-color: transparent !important;
      box-shadow: var(--tg-page-dark-shadow-none) !important;
      color: inherit !important;
    }

  `
}
