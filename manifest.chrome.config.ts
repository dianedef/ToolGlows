import { defineManifest } from "@crxjs/vite-plugin"
import ManifestConfig from "./manifest.config.ts"

// @ts-expect-error ManifestConfig provides all required fields
export default defineManifest((env) => ({
  ...ManifestConfig,
  minimum_chrome_version: "114",
  key: env["CHROME_ADDON_KEY"],
  permissions: [...ManifestConfig.permissions, "sidePanel"],
}))
