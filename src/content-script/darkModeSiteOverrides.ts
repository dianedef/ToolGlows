const OSCARO_HOSTNAMES = new Set(['oscaro.com', 'www.oscaro.com'])

export function buildSiteDarkModeOverrides(hostname: string): string {
  const host = hostname.toLowerCase()
  if (host === 'backerkit.com' || host.endsWith('.backerkit.com')) {
    // Hosted preorders enlarge this decorative photo to a near-white canvas.
    // Keep content images intact; only replace the layout's background layer.
    return `
      .hosted-preorders-layout .project-background {
        background-image: none !important;
        background-color: var(--tg-page-dark-surface) !important;
      }
    `
  }
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
