import { defineManifest } from "@crxjs/vite-plugin"
import ManifestConfig from "./manifest.config.ts"

const { side_panel: _chromeSidePanel, ...FirefoxManifestConfig } = ManifestConfig

// @ts-expect-error ManifestConfig provides all required fields
export default defineManifest((env) => ({
  ...FirefoxManifestConfig,
  browser_specific_settings: {
    gecko: {
      id: env["FIREFOX_ADDON_ID"] || "toolglows-v2@example.com",
      data_collection_permissions: {
        required: ["none"],
      },
    },
  },
  background: {
    scripts: ["src/background/index.ts"],
    type: "module",
    persistent: false,
  },
  sidebar_action: {
    default_icon: ManifestConfig.icons,
    default_panel: "src/ui/side-panel/index.html",
    default_title: "ToolGlows",
    open_at_install: false,
  },
}))
