import { defineManifest } from "@crxjs/vite-plugin"
import ManifestConfig from "./manifest.config"

// @ts-expect-error ManifestConfig provides all required fields
export default defineManifest((env) => ({
  ...ManifestConfig,
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
  permissions: [
    // @ts-expect-error background permission is not supported in Firefox
    ...ManifestConfig.permissions.filter(
      (permission) => permission !== "background",
    ),
  ],
}))
