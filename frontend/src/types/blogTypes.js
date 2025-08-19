// Structure de données pour les articles avec système de blocs
// Fichier: src/types/blogTypes.js

export const ARTICLE_STATUS = {
  DRAFT: 'draft',
  IN_REVIEW: 'in_review', 
  APPROVED: 'approved',
  PUBLISHED: 'published',
  SCHEDULED: 'scheduled'
};

export const BLOCK_TYPES = {
  PARAGRAPH: 'paragraph',
  HEADING: 'heading',
  IMAGE: 'image',
  LIST: 'list',
  QUOTE: 'quote',
  SEPARATOR: 'separator'
};

// Structure d'un article complet
export const articleSchema = {
  id: 'string',
  title: 'string',
  slug: 'string',
  excerpt: 'string',
  
  // Contenu par blocs
  blocks: [
    {
      id: 'uuid',
      type: 'BLOCK_TYPES',
      order: 'number',
      content: {}, // Varie selon le type
      styles: {}, // Classes CSS, alignement, etc.
      metadata: {} // Données spécifiques au bloc
    }
  ],
  
  // Métadonnées
  status: 'ARTICLE_STATUS',
  author: {
    id: 'string',
    username: 'string',
    email: 'string'
  },
  
  // SEO
  seo: {
    metaTitle: 'string',
    metaDescription: 'string',
    keywords: ['string'],
    ogImage: 'string'
  },
  
  // Organisation
  category: {
    id: 'string',
    name: 'string',
    slug: 'string'
  },
  tags: [
    {
      id: 'string', 
      name: 'string',
      slug: 'string'
    }
  ],
  
  // Dates
  createdAt: 'ISO string',
  updatedAt: 'ISO string',
  publishedAt: 'ISO string',
  scheduledAt: 'ISO string',
  
  // Workflow
  reviews: [
    {
      id: 'string',
      reviewer: {
        id: 'string',
        username: 'string'
      },
      status: 'approved | rejected | pending',
      comments: 'string',
      createdAt: 'ISO string'
    }
  ],
  
  // Statistiques
  stats: {
    views: 'number',
    shares: 'number',
    readTime: 'number' // en minutes
  }
};

// Structures spécifiques par type de bloc
export const blockSchemas = {
  // Bloc paragraphe
  paragraph: {
    id: 'uuid',
    type: 'paragraph',
    order: 0,
    content: {
      text: 'string', // Texte brut ou HTML simple
      format: 'plain | html' // Type de formatage
    },
    styles: {
      alignment: 'left | center | right | justify',
      fontSize: 'small | normal | large',
      color: 'string'
    }
  },
  
  // Bloc titre
  heading: {
    id: 'uuid',
    type: 'heading',
    order: 0,
    content: {
      text: 'string',
      level: 1 // H1 à H6
    },
    styles: {
      alignment: 'left | center | right',
      color: 'string'
    }
  },
  
  // Bloc image
  image: {
    id: 'uuid',
    type: 'image',
    order: 0,
    content: {
      src: 'string', // URL de l'image
      alt: 'string',
      caption: 'string',
      title: 'string'
    },
    styles: {
      alignment: 'left | center | right',
      width: 'small | medium | large | full',
      border: 'boolean',
      rounded: 'boolean'
    },
    metadata: {
      originalName: 'string',
      size: 'number', // en bytes
      dimensions: {
        width: 'number',
        height: 'number'
      }
    }
  },
  
  // Bloc liste
  list: {
    id: 'uuid',
    type: 'list',
    order: 0,
    content: {
      items: ['string'], // Array d'items
      listType: 'bullet | numbered'
    },
    styles: {
      indentation: 'number',
      bulletStyle: 'disc | circle | square',
      numberStyle: 'decimal | roman | alpha'
    }
  },
  
  // Bloc citation
  quote: {
    id: 'uuid',
    type: 'quote',
    order: 0,
    content: {
      text: 'string',
      author: 'string',
      source: 'string',
      url: 'string' // Lien vers la source
    },
    styles: {
      style: 'classic | modern | minimal',
      alignment: 'left | center | right'
    }
  },
  
  // Bloc séparateur
  separator: {
    id: 'uuid',
    type: 'separator',
    order: 0,
    content: {},
    styles: {
      style: 'line | dots | stars',
      thickness: 'thin | medium | thick',
      spacing: 'small | medium | large'
    }
  }
};

// Helpers pour la validation
export const validateBlock = (block) => {
  if (!block.id || !block.type || typeof block.order !== 'number') {
    return false;
  }
  
  if (!Object.values(BLOCK_TYPES).includes(block.type)) {
    return false;
  }
  
  // Validation spécifique par type
  switch (block.type) {
    case BLOCK_TYPES.PARAGRAPH:
      return block.content?.text && typeof block.content.text === 'string';
    case BLOCK_TYPES.HEADING:
      return block.content?.text && 
             typeof block.content.text === 'string' &&
             block.content?.level >= 1 && 
             block.content?.level <= 6;
    case BLOCK_TYPES.IMAGE:
      return block.content?.src && typeof block.content.src === 'string';
    case BLOCK_TYPES.LIST:
      return Array.isArray(block.content?.items) && block.content.items.length > 0;
    case BLOCK_TYPES.QUOTE:
      return block.content?.text && typeof block.content.text === 'string';
    case BLOCK_TYPES.SEPARATOR:
      return true; // Pas de contenu requis
    default:
      return false;
  }
};

export const validateArticle = (article) => {
  if (!article.title || !article.blocks || !Array.isArray(article.blocks)) {
    return false;
  }
  
  // Valider tous les blocs
  return article.blocks.every(validateBlock);
};

// Helpers pour créer des blocs par défaut
export const createBlock = (type, content = {}, order = 0) => {
  const baseBlock = {
    id: crypto.randomUUID(),
    type,
    order,
    content,
    styles: {},
    metadata: {}
  };
  
  // Contenu par défaut selon le type
  switch (type) {
    case BLOCK_TYPES.PARAGRAPH:
      return {
        ...baseBlock,
        content: { text: '', format: 'plain' },
        styles: { alignment: 'left', fontSize: 'normal' }
      };
      
    case BLOCK_TYPES.HEADING:
      return {
        ...baseBlock,
        content: { text: '', level: 2 },
        styles: { alignment: 'left' }
      };
      
    case BLOCK_TYPES.IMAGE:
      return {
        ...baseBlock,
        content: { src: '', alt: '', caption: '' },
        styles: { alignment: 'center', width: 'medium' }
      };
      
    case BLOCK_TYPES.LIST:
      return {
        ...baseBlock,
        content: { items: [''], listType: 'bullet' },
        styles: { bulletStyle: 'disc' }
      };
      
    case BLOCK_TYPES.QUOTE:
      return {
        ...baseBlock,
        content: { text: '', author: '', source: '' },
        styles: { style: 'classic', alignment: 'left' }
      };
      
    case BLOCK_TYPES.SEPARATOR:
      return {
        ...baseBlock,
        styles: { style: 'line', thickness: 'medium', spacing: 'medium' }
      };
      
    default:
      return baseBlock;
  }
};

export const createEmptyArticle = (author) => ({
  id: null, // Généré côté serveur
  title: '',
  slug: '',
  excerpt: '',
  blocks: [
    createBlock(BLOCK_TYPES.HEADING, { text: '', level: 1 }, 0),
    createBlock(BLOCK_TYPES.PARAGRAPH, { text: '' }, 1)
  ],
  status: ARTICLE_STATUS.DRAFT,
  author,
  seo: {
    metaTitle: '',
    metaDescription: '',
    keywords: [],
    ogImage: ''
  },
  category: null,
  tags: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  publishedAt: null,
  scheduledAt: null,
  reviews: [],
  stats: {
    views: 0,
    shares: 0,
    readTime: 1
  }
});

// Helpers pour les statuts
export const getStatusColor = (status) => {
  const colors = {
    [ARTICLE_STATUS.DRAFT]: 'gray',
    [ARTICLE_STATUS.IN_REVIEW]: 'yellow',
    [ARTICLE_STATUS.APPROVED]: 'green',
    [ARTICLE_STATUS.PUBLISHED]: 'blue',
    [ARTICLE_STATUS.SCHEDULED]: 'purple'
  };
  return colors[status] || 'gray';
};

export const getStatusLabel = (status) => {
  const labels = {
    [ARTICLE_STATUS.DRAFT]: 'Brouillon',
    [ARTICLE_STATUS.IN_REVIEW]: 'En révision', 
    [ARTICLE_STATUS.APPROVED]: 'Approuvé',
    [ARTICLE_STATUS.PUBLISHED]: 'Publié',
    [ARTICLE_STATUS.SCHEDULED]: 'Programmé'
  };
  return labels[status] || 'Inconnu';
};

// Helper pour calculer le temps de lecture
export const calculateReadTime = (blocks) => {
  const wordsPerMinute = 200;
  let totalWords = 0;
  
  blocks.forEach(block => {
    switch (block.type) {
      case BLOCK_TYPES.PARAGRAPH:
      case BLOCK_TYPES.HEADING:
      case BLOCK_TYPES.QUOTE:
        totalWords += (block.content.text || '').split(' ').length;
        break;
      case BLOCK_TYPES.LIST:
        block.content.items?.forEach(item => {
          totalWords += item.split(' ').length;
        });
        break;
    }
  });
  
  return Math.max(1, Math.ceil(totalWords / wordsPerMinute));
};