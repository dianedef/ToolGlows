# System Architecture Document
# ToolFlowz Browser Extension Framework

**Version**: 1.0
**Date**: 2025-12-16
**Status**: Active
**Owner**: Architecture Team

---

## 1. Architecture Overview

### 1.1 System Context

ToolFlowz is a browser extension framework that operates within the browser environment, utilizing multiple isolated contexts (background, content scripts, popup, etc.) that communicate via browser extension APIs.

```
┌─────────────────────────────────────────────────────────┐
│                    Browser Environment                   │
├─────────────────────────────────────────────────────────┤
│  ┌────────────────┐  ┌──────────────┐  ┌─────────────┐ │
│  │  Background    │  │   Popup      │  │   Options   │ │
│  │  Service       │  │   Window     │  │   Page      │ │
│  │  Worker        │  │              │  │             │ │
│  └───────┬────────┘  └──────┬───────┘  └──────┬──────┘ │
│          │                  │                  │         │
│          └──────────────────┴──────────────────┘         │
│                      │                                   │
│          ┌───────────▼──────────┐                       │
│          │  Extension APIs      │                       │
│          │  (webext-bridge)     │                       │
│          └───────────┬──────────┘                       │
│                      │                                   │
│          ┌───────────▼──────────┐                       │
│          │   Content Scripts    │                       │
│          │   (Injected Pages)   │                       │
│          └──────────────────────┘                       │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │             Webpage DOM                         │    │
│  └────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

### 1.2 Key Architectural Principles

1. **Separation of Concerns**: Each extension context has a specific responsibility
2. **Type Safety**: TypeScript throughout for compile-time error detection
3. **Modularity**: Composable architecture using Vue 3 Composition API
4. **Cross-Browser Compatibility**: Abstraction layer for browser-specific APIs
5. **Performance**: Lazy loading, code splitting, and optimized builds
6. **Developer Experience**: Hot reload, auto-imports, and clear conventions

---

## 2. Extension Architecture

### 2.1 Extension Contexts

#### Background Service Worker
- **Purpose**: Long-running background process, event handler
- **Lifecycle**: Persistent or event-based (Manifest V3)
- **Responsibilities**:
  - API request handling
  - State coordination
  - Extension lifecycle management
  - Cross-context communication hub
  - Alarm and notification management

#### Action Popup
- **Purpose**: Quick access UI from browser toolbar
- **Lifecycle**: Opens/closes on user interaction
- **Responsibilities**:
  - Quick actions and status display
  - User preference toggles
  - Navigation to other pages

#### Options Page
- **Purpose**: Full-featured settings and configuration UI
- **Lifecycle**: Standard web page lifecycle
- **Responsibilities**:
  - Comprehensive settings management
  - User data configuration
  - Feature toggles and preferences

#### Content Scripts
- **Purpose**: Interact with web page DOM
- **Lifecycle**: Injected per page load
- **Responsibilities**:
  - DOM manipulation
  - Page event listening
  - Data extraction from pages
  - UI injection into host pages

#### Side Panel (Chrome)
- **Purpose**: Persistent side panel UI in Chrome
- **Lifecycle**: Toggleable by user
- **Responsibilities**:
  - Extended workspace UI
  - Multi-tab operations
  - Persistent tools and utilities

#### Devtools Panel
- **Purpose**: Integration with browser developer tools
- **Lifecycle**: Active when DevTools open
- **Responsibilities**:
  - Debug information display
  - Developer utilities
  - Extension diagnostics

#### Offscreen Pages
- **Purpose**: Headless pages for background operations
- **Lifecycle**: Created/destroyed programmatically
- **Responsibilities**:
  - Audio processing
  - Screen recording
  - Heavy computations

---

## 3. Component Architecture

### 3.1 Frontend Architecture (Vue 3)

```
┌──────────────────────────────────────────────────────┐
│                    Vue Application                    │
├──────────────────────────────────────────────────────┤
│                                                       │
│  ┌─────────────────────────────────────────────┐    │
│  │              App Component                   │    │
│  │  (ErrorBoundary, Theme, Locale)             │    │
│  └──────────────────┬──────────────────────────┘    │
│                     │                                │
│  ┌──────────────────▼──────────────────────────┐    │
│  │            Vue Router                        │    │
│  │    (File-based routing via unplugin)        │    │
│  └──────────────────┬──────────────────────────┘    │
│                     │                                │
│  ┌──────────────────▼──────────────────────────┐    │
│  │              Page Components                 │    │
│  │  • Popup    • Options   • SidePanel         │    │
│  │  • Setup    • Devtools  • Common            │    │
│  └──────────────────┬──────────────────────────┘    │
│                     │                                │
│  ┌──────────────────▼──────────────────────────┐    │
│  │           Shared Components                  │    │
│  │  • Header   • Footer    • ThemeSwitch       │    │
│  │  • LocaleSwitch  • LoadingSpinner           │    │
│  └──────────────────┬──────────────────────────┘    │
│                     │                                │
│  ┌──────────────────▼──────────────────────────┐    │
│  │            Composables                       │    │
│  │  • useTheme        • useLocale              │    │
│  │  • useBrowserStorage • useNotifications     │    │
│  └──────────────────┬──────────────────────────┘    │
│                     │                                │
│  ┌──────────────────▼──────────────────────────┐    │
│  │            Pinia Stores                      │    │
│  │  • Settings Store  • User Store             │    │
│  │  • App State Store                          │    │
│  └─────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────┘
```

### 3.2 State Management Architecture

#### Pinia Store Structure
```typescript
// Store Pattern
interface Store {
  state: {
    // Reactive state properties
  }
  getters: {
    // Computed properties
  }
  actions: {
    // State mutations and async operations
  }
}

// Persistent Store Pattern
interface PersistentStore extends Store {
  persist: {
    storage: 'local' | 'sync'
    key: string
  }
}
```

#### Store Organization
- **App Store**: Global application state
- **Settings Store**: User preferences (persistent)
- **UI Store**: UI state (non-persistent)
- **Cache Store**: Temporary data cache

### 3.3 Communication Architecture

```
┌─────────────────────────────────────────────────┐
│            webext-bridge Message Bus             │
├─────────────────────────────────────────────────┤
│                                                  │
│  Background ◄──────────────► Content Script    │
│      ▲                              ▲           │
│      │                              │           │
│      ▼                              ▼           │
│   Popup  ◄──────────────────►  Devtools        │
│      ▲                              ▲           │
│      │                              │           │
│      └──────────────────────────────┘           │
│              Options Page                       │
│                                                  │
└─────────────────────────────────────────────────┘

Message Types:
• Request/Response Pattern
• Event Broadcasting
• State Synchronization
• Error Propagation
```

---

## 4. Data Architecture

### 4.1 Storage Strategy

#### Browser Storage API
```
chrome.storage.local    → Large data, device-specific
chrome.storage.sync     → Settings, sync across devices
chrome.storage.session  → Temporary session data
```

#### Storage Patterns
```typescript
// useBrowserStorage Composable
interface StorageOptions {
  storage: 'local' | 'sync' | 'session'
  key: string
  defaultValue?: any
  serializer?: Serializer
}

// Usage
const settings = useBrowserStorage('settings', {
  storage: 'sync',
  defaultValue: {}
})
```

### 4.2 Data Flow

```
User Action
    ↓
Component Event Handler
    ↓
Store Action
    ↓
State Mutation
    ↓
Persistence Layer (if configured)
    ↓
Browser Storage API
    ↓
(Optional) Sync Across Devices
    ↓
State Reactivity
    ↓
UI Update
```

---

## 5. Build Architecture

### 5.1 Build System (Vite)

```
┌────────────────────────────────────────────────┐
│              Vite Build System                  │
├────────────────────────────────────────────────┤
│                                                 │
│  vite.config.ts (Base Configuration)           │
│       ↓                    ↓                    │
│  vite.chrome.config.ts  vite.firefox.config.ts │
│       ↓                    ↓                    │
│  ┌─────────┐          ┌──────────┐            │
│  │ Chrome  │          │ Firefox  │            │
│  │ Build   │          │ Build    │            │
│  └────┬────┘          └─────┬────┘            │
│       ↓                     ↓                   │
│  dist/chrome/          dist/firefox/           │
│                                                 │
└────────────────────────────────────────────────┘
```

### 5.2 Plugin Architecture

#### Vite Plugins Stack
1. **@vitejs/plugin-vue**: Vue 3 SFC compilation
2. **@crxjs/vite-plugin**: Extension manifest handling
3. **unplugin-vue-router**: File-based routing
4. **unplugin-auto-import**: Auto-import Vue APIs
5. **unplugin-vue-components**: Auto-import components
6. **unplugin-icons**: Icon component system
7. **@intlify/unplugin-vue-i18n**: i18n integration

### 5.3 Build Outputs

```
dist/
├── chrome/
│   ├── manifest.json          # Chrome Manifest V3
│   ├── background.js          # Service worker
│   ├── content-script.js      # Content script
│   ├── popup.html             # Popup page
│   ├── options.html           # Options page
│   ├── side-panel.html        # Side panel
│   ├── devtools.html          # DevTools
│   └── assets/                # Bundled assets
└── firefox/
    ├── manifest.json          # Firefox manifest
    └── [similar structure]
```

---

## 6. Security Architecture

### 6.1 Content Security Policy (CSP)

```json
{
  "content_security_policy": {
    "extension_pages": "script-src 'self'; object-src 'self'"
  }
}
```

### 6.2 Permissions Model

```json
{
  "permissions": [
    "storage",
    "tabs"
  ],
  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "all_frames": true
    }
  ]
}
```

The base manifest intentionally keeps the content script available on ordinary pages because the toolbar is the product's primary surface. Store-review hardening now avoids redundant `host_permissions`, `scripting`, `activeTab`, and `webNavigation` declarations. Runtime dark-mode styling is relayed through existing content scripts instead of `chrome.scripting`, so broad host access is not needed for style injection.

Firefox builds declare `browser_specific_settings.gecko.data_collection_permissions.required: ["none"]` while the extension remains local-only for data collection. Manifest icons use explicit 16, 24, 32, and 128 pixel PNG files under `src/assets/icons/`.

### 6.3 Security Best Practices

1. **No eval()**: Prohibited by CSP
2. **Sanitize HTML**: Use DOMPurify for user content
3. **Validate Messages**: Check message sources
4. **HTTPS Only**: External requests must be HTTPS
5. **Minimal Permissions**: Request only needed permissions
6. **No packaged CDN fallback**: Extension bundles must not include runtime fallbacks to remote CDN code or SVG assets.

---

## 7. Performance Architecture

### 7.1 Code Splitting Strategy

```
Entry Points:
├── background.ts      → background.js
├── content-script.ts  → content-script.js
├── popup.ts           → popup.js (+ lazy chunks)
├── options.ts         → options.js (+ lazy chunks)
└── side-panel.ts      → side-panel.js (+ lazy chunks)

Lazy Loaded:
├── routes/            → route-based chunks
├── components/        → dynamic import chunks
└── locales/           → locale chunks
```

### 7.2 Bundle Optimization

- **Tree Shaking**: Remove unused code
- **Minification**: Terser for production
- **Asset Optimization**: Image compression
- **CSS Extraction**: Separate CSS bundles
- **Source Maps**: External for debugging

### 7.3 Runtime Performance

- **Virtual Scrolling**: For large lists
- **Debouncing**: User input handling
- **Memoization**: Expensive computations
- **Lazy Component Loading**: On-demand imports
- **Service Worker Caching**: Static assets

---

## 8. Testing Architecture

### 8.1 Testing Strategy

```
┌──────────────────────────────────────────┐
│          Testing Pyramid                  │
├──────────────────────────────────────────┤
│                                           │
│              ┌─────┐                      │
│              │ E2E │  Playwright         │
│              └─────┘                      │
│           ┌──────────┐                    │
│           │Integration│  Vitest          │
│           └──────────┘                    │
│       ┌────────────────┐                  │
│       │   Unit Tests    │  Vitest        │
│       └────────────────┘                  │
│                                           │
└──────────────────────────────────────────┘
```

### 8.2 Test Organization

```
tests/
├── unit/
│   ├── components/      # Component tests
│   ├── composables/     # Composable tests
│   └── utils/          # Utility tests
├── integration/
│   ├── stores/         # Store tests
│   └── workflows/      # Workflow tests
└── e2e/
    ├── popup/          # Popup E2E tests
    ├── options/        # Options E2E tests
    └── extension/      # Full extension tests
```

---

## 9. Deployment Architecture

### 9.1 Build Pipeline

```
Source Code
    ↓
Lint (ESLint)
    ↓
Type Check (tsc)
    ↓
Test (Vitest)
    ↓
Build (Vite)
    ↓ (parallel)
┌───┴────┐
Chrome   Firefox
Build    Build
    ↓       ↓
Package  Package
(.zip)   (.zip)
    ↓       ↓
Chrome   Firefox
Web      Add-ons
Store    Store
```

### 9.2 Distribution Strategy

- **Chrome Web Store**: Automatic updates, wide reach
- **Firefox Add-ons**: Mozilla review process
- **Direct Distribution**: Enterprise deployments
- **GitHub Releases**: Open-source distribution

---

## 10. Technology Stack Summary

### Core Technologies
- **Vue 3.5**: Frontend framework
- **TypeScript 5.7**: Type safety
- **Vite 6**: Build tool
- **Pinia 2.3**: State management

### UI & Styling
- **Tailwind CSS 3.4**: Utility CSS
- **DaisyUI 4.12**: Component library
- **PrimeVue 3.53**: Additional components
- **Native Vue forms**: Options pages avoid FormKit to keep the extension bundle free of remote icon/theme fallback code

### Browser Extension
- **webextension-polyfill 0.12**: Cross-browser APIs
- **webext-bridge 6.0**: Context messaging
- **@crxjs/vite-plugin 2.0**: Build integration

### Developer Tools
- **ESLint 9**: Code linting
- **Prettier 3.4**: Code formatting
- **Vitest 4.1**: Unit testing
- **Playwright 1.59**: E2E testing

---

## 11. Architecture Decision Records (ADRs)

### ADR-001: Vue 3 Composition API
**Decision**: Use Composition API exclusively
**Rationale**: Better TypeScript support, improved code organization, better reusability
**Status**: Accepted

### ADR-002: Pinia Over Vuex
**Decision**: Use Pinia for state management
**Rationale**: Official recommendation, better TypeScript support, simpler API
**Status**: Accepted

### ADR-003: File-Based Routing
**Decision**: Use unplugin-vue-router for automatic routing
**Rationale**: Reduces boilerplate, convention over configuration
**Status**: Accepted

### ADR-004: Manifest V3
**Decision**: Target Manifest V3 for Chrome
**Rationale**: Required by Chrome, future-proof
**Status**: Accepted

### ADR-005: Monorepo vs Multi-repo
**Decision**: Single repository with browser-specific configs
**Rationale**: Easier maintenance, shared code, simpler CI/CD
**Status**: Accepted

---

## 12. Future Architecture Considerations

### Planned Enhancements
1. **Module Federation**: Share code between extensions
2. **Micro-Frontend Architecture**: Plugin system
3. **Advanced Caching**: Service worker strategies
4. **GraphQL Integration**: Optional data layer
5. **SSR Support**: For options page

### Scalability Considerations
1. **Lazy Module Loading**: Further reduce bundle size
2. **Worker Threads**: Heavy computation offloading
3. **IndexedDB**: Large data storage
4. **WebAssembly**: Performance-critical operations

---

**Document Control**
**Version**: 1.0
**Last Updated**: 2026-05-04
**Next Review**: 2025-02-16
**Author**: Architecture Team
**Approved By**: [Pending]
