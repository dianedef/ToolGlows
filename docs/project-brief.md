# Project Brief: ToolFlowz Browser Extension

## Project Overview

**Project Name:** ToolFlowz (based on vite-vue3-browser-extension-v3)  
**Project Type:** Browser Extension (Chrome & Firefox)  
**Technology Stack:** Vue 3, Vite, TypeScript, Tailwind CSS  
**Current Status:** Active Development

## Executive Summary

ToolFlowz is a modern browser extension built using Vue 3 and Vite, supporting both Chrome (Manifest V3) and Firefox. The project provides a comprehensive template for browser extension development with preconfigured tools, components, and workflows optimized for rapid development and deployment.

## Business Context

The project serves as both a production-ready browser extension framework and a development template for creating feature-rich browser extensions with modern web technologies. It addresses the complexity of browser extension development by providing:

- Pre-built UI pages for common extension scenarios (popup, options, side panel, devtools)
- Integrated state management and routing
- Cross-browser compatibility handling
- Modern development tooling and workflows

## Target Users

1. **Extension Developers**: Developers building new browser extensions
2. **Teams**: Development teams needing a standardized extension framework
3. **Organizations**: Companies requiring enterprise-grade browser extension solutions

## Key Features

### Core Extension Pages
- **Action Popup**: Browser toolbar popup interface
- **Options Page**: Extension settings and configuration
- **Side Panel**: Browser side panel integration
- **Devtools Panel**: Developer tools integration
- **Content Scripts**: Page injection and manipulation
- **Background Service**: Extension background processes
- **Offscreen Pages**: Audio and screen recording capabilities

### UI Components & State Management
- Pre-built components (Header, Footer, Theme Switch, Locale Switch)
- Pinia store for state management (persistent and non-persistent)
- Notifications system (using Notivue)
- Dark/Light theme support
- Internationalization (i18n) support

### Developer Experience
- Hot module replacement (HMR) for rapid development
- TypeScript support
- ESLint and Prettier for code quality
- Directory-based routing
- Auto-import for components and composables
- Icon system (unplugin-icons)

### Browser Compatibility
- Chrome/Chromium support via Manifest V3
- Firefox support with specific configurations
- Separate build configurations per browser

## Technology Stack

### Frontend Framework
- **Vue 3**: Progressive JavaScript framework with Composition API
- **Vite**: Next-generation frontend build tool
- **TypeScript**: Type-safe JavaScript

### UI & Styling
- **Tailwind CSS**: Utility-first CSS framework
- **DaisyUI**: Component library for Tailwind
- **PrimeVue**: Additional UI components

### State & Data Management
- **Pinia**: Vue store with persistent storage
- **VueUse**: Composition utilities
- **webext-bridge**: Cross-context communication
- **webextension-polyfill**: Cross-browser API compatibility

### Development Tools
- **unplugin-vue-router**: File-based routing
- **unplugin-auto-import**: Auto-import utilities
- **unplugin-vue-components**: Auto-import components
- **unplugin-icons**: Icon components
- **@intlify/unplugin-vue-i18n**: Internationalization

### Quality Assurance
- **ESLint**: Code linting
- **Prettier**: Code formatting
- **Playwright**: End-to-end testing
- **Vitest**: Unit testing

## Project Structure

```
.
├── src/
│   ├── background/         # Background service worker
│   ├── content-script/     # Content scripts
│   ├── ui/                 # UI pages (popup, options, etc.)
│   ├── components/         # Shared Vue components
│   ├── composables/        # Vue composables
│   ├── stores/             # Pinia stores
│   ├── locales/           # i18n translations
│   ├── assets/            # Static assets
│   └── utils/             # Utility functions
├── public/                # Public assets
├── scripts/               # Build scripts
├── dist/                  # Built extension files
│   ├── chrome/           # Chrome build
│   └── firefox/          # Firefox build
└── docs/                 # Project documentation
```

## Current Challenges

1. **Documentation Organization**: Need to structure documentation using BMAD methodology
2. **Workflow Definition**: Establish clear development workflows
3. **Testing Strategy**: Define comprehensive testing approach
4. **Deployment Process**: Document deployment and distribution procedures

## Success Criteria

1. Well-organized, maintainable documentation structure
2. Clear development and contribution guidelines
3. Documented architecture and design decisions
4. Comprehensive testing documentation
5. Streamlined build and deployment process

## Stakeholders

- **Primary Maintainer**: mubaidr (Muhammad Ubaid Raza)
- **Contributors**: Open-source community (7+ active contributors)
- **Users**: Extension developers and teams

## Timeline & Milestones

### Current Phase: Documentation & Process Improvement
- [x] Install BMAD method framework
- [ ] Create comprehensive PRD
- [ ] Define architecture documentation
- [ ] Establish development workflows
- [ ] Create testing strategy
- [ ] Document deployment procedures

## Constraints & Assumptions

### Technical Constraints
- Must support Manifest V3 (Chrome requirement)
- Must maintain Firefox compatibility
- Must use Vite as build tool
- Must support Vue 3 Composition API

### Assumptions
- Developers have Node.js v20+ installed
- pnpm is the preferred package manager
- Modern browser support (Chrome 88+, Firefox 90+)

## Resources

- **Repository**: https://github.com/mubaidr/vite-vue3-browser-extension-v3
- **Documentation**: README.md (to be expanded)
- **Build System**: Vite with custom browser-specific configurations
- **Package Manager**: pnpm

## Next Steps

1. Create detailed Product Requirements Document (PRD)
2. Document system architecture
3. Define development workflows
4. Establish testing strategy
5. Create contributor guidelines
6. Document deployment procedures

---

**Document Version**: 1.0  
**Last Updated**: 2025-12-16  
**Status**: Active Development
