export interface SearchEngine {
  id: string
  name: string
  url: string
  icon?: string
  shortcut?: string
  category: string
  contextMenu?: {
    text?: boolean
    image?: boolean
    link?: boolean
  }
}

export const defaultSearchEngines: SearchEngine[] = [
  {
    id: 'google',
    name: 'Google',
    url: 'https://www.google.com/search?q=%s',
    shortcut: 'alt+g',
    category: 'General',
    contextMenu: {
      text: true,
      image: true,
      link: true
    }
  },
  {
    id: 'images',
    name: 'Google Images',
    url: 'https://www.google.com/search?tbm=isch&q=%s',
    category: 'Images',
    contextMenu: {
      image: true
    }
  },
  {
    id: 'translate',
    name: 'Google Translate',
    url: 'https://translate.google.com/?text=%s',
    category: 'Tools',
    contextMenu: {
      text: true
    }
  }
] 