/**
 * UI translations for the starlight-tags plugin.
 * These are injected into Starlight's i18n system.
 */

export const translations = {
  en: {
    'starlightTags.totalTags': 'Total Tags',
    'starlightTags.tagsApplied': 'Tags Applied',
    'starlightTags.tagCloud': 'Tag Cloud',
    'starlightTags.alphabeticalIndex': 'Alphabetical Index',
    'starlightTags.allTags': 'All Tags',
    'starlightTags.page': 'page',
    'starlightTags.pages': 'pages',
    'starlightTags.pageTags': 'Tags:',
    'starlightTags.taggedPrefix': 'Tagged:',
    'starlightTags.relatedTags': 'Related Tags',
    'starlightTags.pagesWithTag': 'Pages with this tag',
    'starlightTags.related': 'related',
    'starlightTags.path': 'Path:',
  },
  fr: {
    'starlightTags.totalTags': 'Total des tags',
    'starlightTags.tagsApplied': 'Tags appliqués',
    'starlightTags.tagCloud': 'Nuage de tags',
    'starlightTags.alphabeticalIndex': 'Index alphabétique',
    'starlightTags.allTags': 'Tous les tags',
    'starlightTags.page': 'page',
    'starlightTags.pages': 'pages',
    'starlightTags.pageTags': 'Tags :',
    'starlightTags.taggedPrefix': 'Tagué :',
    'starlightTags.relatedTags': 'Tags associés',
    'starlightTags.pagesWithTag': 'Pages avec ce tag',
    'starlightTags.related': 'associés',
    'starlightTags.path': 'Chemin :',
  },
  es: {
    'starlightTags.totalTags': 'Total de etiquetas',
    'starlightTags.tagsApplied': 'Etiquetas aplicadas',
    'starlightTags.tagCloud': 'Nube de etiquetas',
    'starlightTags.alphabeticalIndex': 'Índice alfabético',
    'starlightTags.allTags': 'Todas las etiquetas',
    'starlightTags.page': 'página',
    'starlightTags.pages': 'páginas',
    'starlightTags.pageTags': 'Etiquetas:',
    'starlightTags.taggedPrefix': 'Etiquetado:',
    'starlightTags.relatedTags': 'Etiquetas relacionadas',
    'starlightTags.pagesWithTag': 'Páginas con esta etiqueta',
    'starlightTags.related': 'relacionadas',
    'starlightTags.path': 'Ruta:',
  },
  de: {
    'starlightTags.totalTags': 'Gesamte Tags',
    'starlightTags.tagsApplied': 'Angewandte Tags',
    'starlightTags.tagCloud': 'Tag-Wolke',
    'starlightTags.alphabeticalIndex': 'Alphabetischer Index',
    'starlightTags.allTags': 'Alle Tags',
    'starlightTags.page': 'Seite',
    'starlightTags.pages': 'Seiten',
    'starlightTags.pageTags': 'Tags:',
    'starlightTags.taggedPrefix': 'Getaggt:',
    'starlightTags.relatedTags': 'Verwandte Tags',
    'starlightTags.pagesWithTag': 'Seiten mit diesem Tag',
    'starlightTags.related': 'verwandt',
    'starlightTags.path': 'Pfad:',
  },
} as const;

export type TranslationKey = keyof typeof translations.en;
