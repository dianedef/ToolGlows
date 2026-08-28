import { homedir } from 'os'
import { resolve } from 'path'
import { existsSync } from 'fs'

export interface BrowserPaths {
  name: string
  type: 'chrome' | 'firefox' | 'safari' | 'other'
  path: Record<NodeJS.Platform, string[]>
}

export interface BrowserPath {
  name: string
  type: 'chrome' | 'firefox' | 'safari' | 'other'
  path: string
}

interface BrowserInfo {
  name: string
  type: string
  command: string
}

const getWinPaths = (subdir: string) => {
  const sysDrive = process.env['SystemDrive'] || 'C:'
  const programFiles =
    process.env['ProgramFiles'] || resolve(sysDrive, 'Program Files')
  const programFilesX86 =
    process.env['ProgramFiles(x86)'] || resolve(sysDrive, 'Program Files (x86)')
  const localAppData =
    process.env['LocalAppData'] || resolve(homedir(), 'AppData\\Local')
  const appData =
    process.env['AppData'] || resolve(homedir(), 'AppData\\Roaming')
  const knownPaths = [
    resolve(localAppData, subdir),
    resolve(appData, subdir),
    resolve(programFiles, subdir),
    resolve(programFilesX86, subdir),
  ]
  return knownPaths
}

const getDarwinPaths = (subdir: string) => {
  const home = homedir()
  const knownPaths = [
    resolve(home, 'Applications', subdir),
    resolve('/Applications', subdir),
  ]
  return knownPaths
}

const getLinuxPaths = (subdir: string) => {
  return [
    `/usr/bin/${subdir}`,
    `/usr/local/bin/${subdir}`,
    `/snap/bin/${subdir}`,
    `/var/lib/flatpak/exports/bin/${subdir}`,
    resolve(homedir(), `.local/share/flatpak/exports/bin/${subdir}`),
  ]
}

function getCommand(name: string, type: string, path: string) {
  if (!existsSync(path)) return undefined

  const browserPath = JSON.stringify(path)

  if (type === 'chrome') {
    return `pnpm exec web-ext run --target chromium --chromium-binary ${browserPath} --source-dir dist/chrome --no-input --browser-console --devtools`
  }

  if (type === 'firefox') {
    return `pnpm exec web-ext run --firefox=${browserPath} --source-dir dist/firefox --no-input --browser-console --devtools`
  }

  return undefined
}

export function GetInstalledBrowsers(): { [name: string]: BrowserInfo } {
  const platform = process.platform
  const installedBrowsers: { [name: string]: BrowserInfo } = {}

  for (const browser of Browsers) {
    if (!browser.path[platform]) continue

    for (const path of browser.path[platform]) {
      const command = getCommand(browser.name, browser.type, path)

      if (!command) {
        continue
      }

      installedBrowsers[browser.name] = {
        name: browser.name,
        type: browser.type,
        command,
      }
      break
    }
  }
  return installedBrowsers
}

const emptyPlatform = {
  aix: [],
  android: [],
  cygwin: [],
  darwin: [],
  freebsd: [],
  haiku: [],
  linux: [],
  netbsd: [],
  openbsd: [],
  sunos: [],
  win32: [],
}
export const Browsers: BrowserPaths[] = [
  {
    name: 'Arc',
    type: 'chrome',
    path: {
      ...emptyPlatform,
      darwin: getDarwinPaths('Arc.app/Contents/MacOS/Arc'),
    },
  },
  {
    name: 'Brave',
    type: 'chrome',
    path: {
      ...emptyPlatform,
      win32: getWinPaths(
        'BraveSoftware\\Brave-Browser\\Application\\brave.exe'
      ),
      darwin: getDarwinPaths('Brave Browser.app/Contents/MacOS/Brave Browser'),
      linux: [
        ...getLinuxPaths('brave-browser'),
        ...getLinuxPaths('com.brave.Browser'),
      ],
    },
  },
  {
    name: 'Chrome',
    type: 'chrome',
    path: {
      ...emptyPlatform,
      win32: getWinPaths('Google\\Chrome\\Application\\chrome.exe'),
      darwin: getDarwinPaths('Google Chrome.app/Contents/MacOS/Google Chrome'),
      linux: [
        ...getLinuxPaths('google-chrome'),
        ...getLinuxPaths('google-chrome-stable'),
      ],
    },
  },
  {
    name: 'Chrome Beta',
    type: 'chrome',
    path: {
      ...emptyPlatform,
      win32: getWinPaths('Google\\Chrome Beta\\Application\\chrome.exe'),
      darwin: getDarwinPaths(
        'Google Chrome Beta.app/Contents/MacOS/Google Chrome Beta'
      ),
      linux: [...getLinuxPaths('google-chrome-beta')],
    },
  },
  {
    name: 'Chrome Canary',
    type: 'chrome',
    path: {
      ...emptyPlatform,
      win32: getWinPaths('Google\\Chrome Canary\\Application\\chrome.exe'),
      darwin: getDarwinPaths(
        'Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary'
      ),
      linux: [...getLinuxPaths('google-chrome-canary')],
    },
  },
  {
    name: 'Chromium',
    type: 'chrome',
    path: {
      ...emptyPlatform,
      win32: getWinPaths('Chromium\\Application\\chrome.exe'),
      darwin: getDarwinPaths('Chromium.app/Contents/MacOS/Chromium'),
      linux: [
        ...getLinuxPaths('chromium'),
        ...getLinuxPaths('org.chromium.Chromium'),
      ],
    },
  },
  {
    name: 'Edge',
    type: 'chrome',
    path: {
      ...emptyPlatform,
      win32: getWinPaths('Microsoft\\Edge\\Application\\msedge.exe'),
      darwin: getDarwinPaths(
        'Microsoft Edge.app/Contents/MacOS/Microsoft Edge'
      ),
      linux: [
        ...getLinuxPaths('microsoft-edge'),
        ...getLinuxPaths('com.microsoft.Edge'),
      ],
    },
  },
  {
    name: 'Sidekick',
    type: 'chrome',
    path: {
      ...emptyPlatform,
      win32: getWinPaths('Sidekick\\Application\\sidekick.exe'),
      darwin: getDarwinPaths('Sidekick.app/Contents/MacOS/Sidekick'),
      linux: [...getLinuxPaths('sidekick-browser-stable')],
    },
  },
  {
    name: 'Vivaldi',
    type: 'chrome',
    path: {
      ...emptyPlatform,
      win32: getWinPaths('Vivaldi\\Application\\vivaldi.exe'),
      darwin: getDarwinPaths('Vivaldi.app/Contents/MacOS/Vivaldi'),
      linux: [
        ...getLinuxPaths('vivaldi-stable'),
        ...getLinuxPaths('com.vivaldi.Vivaldi'),
      ],
    },
  },
  {
    name: 'Firefox',
    type: 'firefox',
    path: {
      ...emptyPlatform,
      win32: getWinPaths('Mozilla Firefox\\firefox.exe'),
      darwin: getDarwinPaths('Firefox.app/Contents/MacOS/Firefox'),
      linux: [
        ...getLinuxPaths('firefox'),
        ...getLinuxPaths('org.mozilla.firefox'),
      ],
    },
  },
  {
    name: 'Firefox Nightly',
    type: 'firefox',
    path: {
      ...emptyPlatform,
      win32: getWinPaths('Firefox Nightly\\firefox.exe'),
      darwin: getDarwinPaths('Firefox Nightly.app/Contents/MacOS/Firefox'),
      linux: [
        ...getLinuxPaths('firefox-nightly'),
        ...getLinuxPaths('org.mozilla.firefox-nightly'),
      ],
    },
  },
  {
    name: 'Firefox Developer Edition',
    type: 'firefox',
    path: {
      ...emptyPlatform,
      win32: getWinPaths('Firefox Developer Edition\\firefox.exe'),
      darwin: getDarwinPaths(
        'Firefox Developer Edition.app/Contents/MacOS/Firefox'
      ),
      linux: [
        ...getLinuxPaths('firefox-dev'),
        ...getLinuxPaths('org.mozilla.firefox.dev'),
      ],
    },
  },
  {
    name: 'Safari',
    type: 'safari',
    path: {
      ...emptyPlatform,
      darwin: getDarwinPaths('Safari.app/Contents/MacOS/Safari'),
    },
  },
  {
    name: 'Safari Technical Preview',
    type: 'safari',
    path: {
      ...emptyPlatform,
      darwin: getDarwinPaths(
        'Safari Technical Preview.app/Contents/MacOS/Safari Technical Preview'
      ),
    },
  },
  {
    name: 'Safari beta',
    type: 'safari',
    path: {
      ...emptyPlatform,
      darwin: getDarwinPaths('Safari beta.app/Contents/MacOS/Safari beta'),
    },
  },
  {
    name: 'Orion',
    type: 'safari',
    path: {
      ...emptyPlatform,
      darwin: getDarwinPaths('Orion.app/Contents/MacOS/Orion'),
    },
  },
  {
    name: 'Epiphany',
    type: 'safari',
    path: {
      ...emptyPlatform,
      linux: ['epiphany-browser', 'org.gnome.Epiphany'],
    },
  },
  {
    name: 'Opera',
    type: 'chrome',
    path: {
      ...emptyPlatform,
      win32: getWinPaths('Opera\\opera.exe'),
      darwin: getDarwinPaths('Opera.app/Contents/MacOS/Opera'),
      linux: [...getLinuxPaths('opera'), ...getLinuxPaths('opera-stable')],
    },
  },
  {
    name: 'IE',
    type: 'other',
    path: {
      ...emptyPlatform,
      win32: getWinPaths('Internet Explorer\\iexplore.exe'),
    },
  },
]
