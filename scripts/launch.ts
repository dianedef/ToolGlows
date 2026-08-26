import { type ChildProcess, spawn } from "node:child_process"
import { existsSync, statSync } from "node:fs"
import { createRequire } from "node:module"
import { isAbsolute, relative, resolve } from "node:path"
import concurrently, { type ConcurrentlyCommandInput } from "concurrently"
import { program } from "commander"
import { GetInstalledBrowsers } from "./getInstalledBrowsers"

const require = createRequire(import.meta.url)
const projectRoot = process.cwd()
const viteEntry = resolve(
  require.resolve("vite/package.json"),
  "..",
  "bin",
  "vite.js",
)
const buildTimeoutMs = 30_000
const viteProcesses: ChildProcess[] = []

program
  .option("-a, --all", "Launch all supported browsers", false)
  .option("-c, --chrome", "Launch Chrome only", false)
  .option("-f, --firefox", "Launch Firefox only", false)
  .option("-e, --edge", "Launch Edge only", false)
  .option(
    "-v, --vite-chrome-config <path>",
    "Path to Vite Chrome config",
    "vite.chrome.config.ts",
  )
  .option(
    "-x, --vite-firefox-config <path>",
    "Path to Vite Firefox config",
    "vite.firefox.config.ts",
  )

program.parse(process.argv)

const options = program.opts<{
  all: boolean
  chrome: boolean
  firefox: boolean
  edge: boolean
  viteChromeConfig: string
  viteFirefoxConfig: string
}>()

const noExplicitBrowser =
  !options.all && !options.chrome && !options.firefox && !options.edge
const targets = {
  chrome: options.all || options.chrome || noExplicitBrowser,
  firefox: options.all || options.firefox,
  edge: options.all || options.edge,
}

function resolveConfigPath(configPath: string) {
  const absolutePath = resolve(projectRoot, configPath)
  const projectRelativePath = relative(projectRoot, absolutePath)

  if (
    projectRelativePath.startsWith("..") ||
    isAbsolute(projectRelativePath) ||
    !existsSync(absolutePath)
  ) {
    throw new Error(
      `Vite config must be an existing file inside the project: ${configPath}`,
    )
  }

  return absolutePath
}

function startVite(args: string[], name: string) {
  const child = spawn(process.execPath, [viteEntry, ...args], {
    cwd: projectRoot,
    stdio: "inherit",
    windowsHide: true,
  })

  child.once("error", (error) => {
    console.error(`${name} could not start:`, error)
  })

  viteProcesses.push(child)
  return child
}

function waitForFreshManifest(
  browser: "chrome" | "firefox",
  startedAt: number,
  child: ChildProcess,
) {
  const manifestPath = resolve(projectRoot, "dist", browser, "manifest.json")

  return new Promise<void>((resolveReady, rejectReady) => {
    const timeout = setTimeout(() => {
      cleanup()
      rejectReady(
        new Error(
          `${browser} build did not produce a fresh manifest within ${buildTimeoutMs / 1000}s`,
        ),
      )
    }, buildTimeoutMs)

    const interval = setInterval(() => {
      if (
        existsSync(manifestPath) &&
        statSync(manifestPath).mtimeMs >= startedAt - 1_000
      ) {
        cleanup()
        resolveReady()
      }
    }, 250)

    const onExit = (code: number | null) => {
      cleanup()
      rejectReady(
        new Error(`${browser} build process exited before readiness (${code})`),
      )
    }

    const cleanup = () => {
      clearTimeout(timeout)
      clearInterval(interval)
      child.off("exit", onExit)
    }

    child.once("exit", onExit)
  })
}

async function runViteDev() {
  const readiness: Promise<void>[] = []

  if (targets.chrome || targets.edge) {
    const startedAt = Date.now()
    const configPath = resolveConfigPath(options.viteChromeConfig)
    const child = startVite(["--config", configPath], "Chrome Vite")
    readiness.push(waitForFreshManifest("chrome", startedAt, child))
  }

  if (targets.firefox) {
    const startedAt = Date.now()
    const configPath = resolveConfigPath(options.viteFirefoxConfig)
    const child = startVite(
      ["build", "--mode", "development", "--watch", "--config", configPath],
      "Firefox Vite",
    )
    readiness.push(waitForFreshManifest("firefox", startedAt, child))
  }

  await Promise.all(readiness)
}

async function launchBrowsers() {
  const installedBrowsers = GetInstalledBrowsers()
  const commands: ConcurrentlyCommandInput[] = []

  for (const [enabled, browserName] of [
    [targets.chrome, "Chrome"],
    [targets.firefox, "Firefox"],
    [targets.edge, "Edge"],
  ] as const) {
    if (!enabled) continue

    const browser = installedBrowsers[browserName]
    if (browser) {
      commands.push({ command: browser.command, name: browser.name })
    } else {
      console.error(`${browserName} is not installed.`)
    }
  }

  if (commands.length === 0) {
    throw new Error("No selected browser is installed.")
  }

  await concurrently(commands, {
    killOthers: ["failure", "success"],
    restartTries: 1,
  }).result
}

function shutdown() {
  for (const child of viteProcesses) {
    if (!child.killed) child.kill()
  }
}

process.once("SIGINT", () => {
  shutdown()
  process.exitCode = 130
})

process.once("SIGTERM", () => {
  shutdown()
  process.exitCode = 143
})

try {
  await runViteDev()
  await launchBrowsers()
} catch (error) {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
} finally {
  shutdown()
}
