import { installDarkModeBootstrap } from './darkModeBootstrap'

// This entry intentionally stays independent from the Vue toolbar bundle so
// the cached dark canvas can be installed before the page's first paint.
void installDarkModeBootstrap()
