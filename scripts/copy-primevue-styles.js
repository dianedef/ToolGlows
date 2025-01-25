import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Chemins source (node_modules)
const PRIMEVUE_PATH = path.resolve(__dirname, '../node_modules/primevue')
const PRIMEICONS_PATH = path.resolve(__dirname, '../node_modules/primeicons')

// Chemins destination
const DEST_PATH = path.resolve(__dirname, '../src/assets/primevue')

// Créer le dossier de destination s'il n'existe pas
if (!fs.existsSync(DEST_PATH)) {
  fs.mkdirSync(DEST_PATH, { recursive: true })
}

// Créer le dossier themes s'il n'existe pas
const themesPath = path.join(DEST_PATH, 'themes')
if (!fs.existsSync(themesPath)) {
  fs.mkdirSync(themesPath, { recursive: true })
}

// Liste des composants à copier
const components = [
  'button',
  'dialog',
  'dropdown',
  'inputtext',
  'panel',
  'toast',
  'tooltip',
  'slider',
  'checkbox',
  'chip',
  'inputnumber',
  'card',
  'divider',
  'menu',
  'menubar',
  'sidebar',
  'splitbutton',
  'tabview',
  'tabpanel',
  'toolbar',
  'togglebutton',
  'selectbutton',
  'radiobutton',
  'progressbar',
  'message',
  'inlinemessage'
]

async function copyFiles() {
  try {
    // Copier le thème
    const themePath = path.join(PRIMEVUE_PATH, 'resources/themes/lara-light-blue')
    const themesDestPath = path.join(themesPath, 'lara-light')
    
    if (fs.existsSync(themePath)) {
      if (!fs.existsSync(themesDestPath)) {
        fs.mkdirSync(themesDestPath, { recursive: true })
      }
      fs.cpSync(themePath, themesDestPath, { recursive: true })
      console.log('✓ Theme copied')
    } else {
      console.log('ERROR: Theme folder not found')
    }

    // Copier primevue.css
    const primevueCssPath = path.join(PRIMEVUE_PATH, 'resources/primevue.min.css')
    if (fs.existsSync(primevueCssPath)) {
      fs.copyFileSync(primevueCssPath, path.join(DEST_PATH, 'primevue.css'))
      console.log('✓ PrimeVue CSS copied')
    }

    // Créer le dossier components s'il n'existe pas
    const componentsPath = path.join(DEST_PATH, 'components')
    if (!fs.existsSync(componentsPath)) {
      fs.mkdirSync(componentsPath, { recursive: true })
    }

    // Copier les styles des composants
    components.forEach(component => {
      const componentPath = path.join(PRIMEVUE_PATH, component, 'style')
      const destComponentPath = path.join(componentsPath, component)
      
      if (fs.existsSync(componentPath)) {
        if (!fs.existsSync(destComponentPath)) {
          fs.mkdirSync(destComponentPath, { recursive: true })
        }
        
        fs.cpSync(componentPath, destComponentPath, { recursive: true })
        console.log(`✓ Styles of ${component} component copied`)
      }
    })

    // Copier les icônes et polices de PrimeIcons
    const primeIconsCssPath = path.join(PRIMEICONS_PATH, 'primeicons.css')
    const primeIconsFontsPath = path.join(PRIMEICONS_PATH, 'fonts')
    if (fs.existsSync(primeIconsCssPath)) {
      // Copier le CSS
      fs.copyFileSync(primeIconsCssPath, path.join(DEST_PATH, 'icons.css'))
      console.log('✓ PrimeIcons CSS copied')

      // Copier les polices
      const destFontsPath = path.join(DEST_PATH, 'fonts')
      if (!fs.existsSync(destFontsPath)) {
        fs.mkdirSync(destFontsPath, { recursive: true })
      }
      fs.cpSync(primeIconsFontsPath, destFontsPath, { recursive: true })
      console.log('✓ PrimeIcons fonts copied')
    }

    console.log('✓ Tous les fichiers ont été copiés avec succès !')
  } catch (error) {
    console.error('Erreur lors de la copie des fichiers:', error)
    process.exit(1)
  }
}

copyFiles() 