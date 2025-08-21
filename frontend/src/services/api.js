import axios from 'axios';
import Cookies from 'js-cookie';
import toast from 'react-hot-toast';

// Configuration de base de l'API
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Instance Axios configurée
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour les requêtes (ajouter le token)
api.interceptors.request.use(
  (config) => {
    const token = Cookies.get('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercepteur pour les réponses (gestion des erreurs)
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const { response } = error;
    
    if (response?.status === 401) {
      // Token expiré ou invalide
      Cookies.remove('auth_token');
      Cookies.remove('user');
      toast.error('Session expirée, veuillez vous reconnecter');
      window.location.href = '/admin/login';
    } else if (response?.status === 403) {
      toast.error('Accès refusé - Permissions insuffisantes');
    } else if (response?.status === 404) {
      toast.error('Ressource non trouvée');
    } else if (response?.status >= 500) {
      toast.error('Erreur serveur - Veuillez réessayer plus tard');
    } else if (response?.data?.message) {
      toast.error(response.data.message);
    }
    
    return Promise.reject(error);
  }
);

// ==================== UTILITAIRES AUTH ====================
export const getStoredUser = () => {
  try {
    const user = Cookies.get('user');
    return user ? JSON.parse(user) : null;
  } catch {
    return null;
  }
};

export const isAuthenticated = () => {
  return !!Cookies.get('auth_token');
};

export const hasRole = (userRoles, requiredRole) => {
  return userRoles?.includes(requiredRole) || userRoles?.includes('admin');
};



// ==================== SERVICES AUTH ====================
export const authService = {
  // Connexion
  login: async (credentials) => {
  try {
    const response = await api.post('/auth/login', credentials);
    
    // ✅ CORRECTION : Adaptez à la structure de votre backend
    const { user, accessToken } = response.data.data; // Notez le .data.data
    
    Cookies.set('auth_token', accessToken, { expires: 7, secure: true, sameSite: 'lax' });
    Cookies.set('user', JSON.stringify(user), { expires: 7, secure: true, sameSite: 'lax' });
    
    toast.success(`Bienvenue ${user.username}!`);
    return { user, token: accessToken }; // Format attendu par le frontend
  } catch (error) {
    throw error;
  }
},

  // Déconnexion
  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.warn('Erreur lors de la déconnexion:', error);
    } finally {
      Cookies.remove('auth_token');
      Cookies.remove('user');
      toast.success('Déconnexion réussie');
    }
  },

  // Récupérer utilisateur actuel
  getCurrentUser: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  // Changer mot de passe
  changePassword: async (passwordData) => {
    const response = await api.put('/auth/change-password', passwordData);
    toast.success('Mot de passe modifié avec succès');
    return response.data;
  }
};

// ==================== SERVICES BLOG ====================
export const blogService = {
  // Récupérer tous les articles
  getArticles: async (params = {}) => {
    const response = await api.get('/blog/articles', { params });
    return response.data.data;
  },

  // Récupérer un article par ID
  getArticle: async (id) => {
    const response = await api.get(`/blog/articles/${id}`);
    return response.data.data;
  },

  // Créer un article
  createArticle: async (articleData) => {
    const response = await api.post('/blog/articles', articleData);
    toast.success('Article créé avec succès');
    return response.data.data;
  },

  // Mettre à jour un article
  updateArticle: async (id, articleData) => {
    const response = await api.put(`/blog/articles/${id}`, articleData);
    toast.success('Article mis à jour');
    return response.data.data;
  },

  // Supprimer un article
  deleteArticle: async (id) => {
    await api.delete(`/blog/articles/${id}`);
    toast.success('Article supprimé');
  },

  // Upload d'image pour article
  uploadImage: async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    
    const response = await api.post('/blog/upload-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  // Récupérer catégories
  getCategories: async () => {
    const response = await api.get('/blog/categories');
    return response.data.data;
  },

  // Changer le statut d'un article
  updateArticleStatus: async (id, status) => {
    const response = await api.put(`/blog/articles/${id}/status`, { status });
    toast.success(`Article ${status === 'published' ? 'publié' : 'mis à jour'}`);
    return response.data;
  },

  // Soumettre un article pour révision
  submitForReview: async (id, reviewData = {}) => {
    const response = await api.post(`/blog/articles/${id}/submit-review`, reviewData);
    toast.success('Article soumis pour révision');
    return response.data;
  },

  // Approuver/rejeter un article (admin seulement)
  reviewArticle: async (id, reviewData) => {
    const response = await api.post(`/blog/articles/${id}/review`, {
      status: reviewData.status, // 'approved' ou 'rejected'
      comments: reviewData.comments
    });
    toast.success(`Article ${reviewData.status === 'approved' ? 'approuvé' : 'rejeté'}`);
    return response.data;
  },

  // Programmer la publication d'un article
  scheduleArticle: async (id, scheduledAt) => {
    const response = await api.put(`/blog/articles/${id}/schedule`, { 
      scheduledAt,
      status: 'scheduled'
    });
    toast.success('Article programmé pour publication');
    return response.data;
  },


  // Récupérer l'historique des versions d'un article
  getArticleVersions: async (id) => {
    const response = await api.get(`/blog/articles/${id}/versions`);
    return response.data;
  },

  // Créer une nouvelle version (sauvegarde automatique)
  createVersion: async (id, versionData) => {
    const response = await api.post(`/blog/articles/${id}/versions`, {
      blocks: versionData.blocks,
      title: versionData.title,
      excerpt: versionData.excerpt,
      seo: versionData.seo,
      metadata: {
        savedAt: new Date().toISOString(),
        autoSave: versionData.autoSave || false
      }
    });
    return response.data;
  },

  // Restaurer une version spécifique
  restoreVersion: async (id, versionId) => {
    const response = await api.post(`/blog/articles/${id}/restore/${versionId}`);
    toast.success('Version restaurée avec succès');
    return response.data;
  },

  // Comparer deux versions
  compareVersions: async (id, versionA, versionB) => {
    const response = await api.get(`/blog/articles/${id}/compare/${versionA}/${versionB}`);
    return response.data;
  },


  // Sauvegarder les blocs d'un article (structure JSON)
  updateArticleBlocks: async (id, blocks) => {
    const response = await api.put(`/blog/articles/${id}/blocks`, { 
      blocks: blocks.map((block, index) => ({
        ...block,
        order: index // S'assurer que l'ordre est correct
      }))
    });
    return response.data;
  },

  // Sauvegarder automatiquement (toutes les X secondes)
  autoSaveArticle: async (id, articleData) => {
    try {
      const response = await api.post(`/blog/articles/${id}/autosave`, {
        ...articleData,
        metadata: {
          autoSave: true,
          savedAt: new Date().toISOString()
        }
      });
      return response.data;
    } catch (error) {
      // Pas de toast pour l'auto-save en cas d'erreur
      console.warn('Auto-save failed:', error);
      throw error;
    }
  },

  // Récupérer les brouillons auto-sauvegardés
  getAutoSavedDraft: async (id) => {
    const response = await api.get(`/blog/articles/${id}/autosave`);
    return response.data;
  },



  // Upload d'image optimisée pour les blocs
  uploadBlockImage: async (file, blockId) => {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('blockId', blockId);
    formData.append('context', 'block'); // Pour différencier des autres uploads

    const response = await api.post('/blog/upload-block-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        // Vous pouvez émettre un événement ici pour la progress bar
        window.dispatchEvent(new CustomEvent('uploadProgress', {
          detail: { blockId, progress: percentCompleted }
        }));
      }
    });

    toast.success('Image uploadée avec succès');
    return response.data;
  },

  // Upload de fichier pour les blocs (PDF, documents, etc.)
  uploadBlockFile: async (file, blockId, blockType = 'file') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('blockId', blockId);
    formData.append('blockType', blockType);

    const response = await api.post('/blog/upload-block-file', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });

    toast.success('Fichier uploadé avec succès');
    return response.data;
  },

  // Recherche d'articles avec filtres étendus
  searchArticles: async (params) => {
    const response = await api.get('/blog/articles/search', { 
      params: {
        q: params.query,
        status: params.status,
        author: params.author,
        category: params.category,
        tags: params.tags,
        dateFrom: params.dateFrom,
        dateTo: params.dateTo,
        hasBlocks: params.hasBlocks, // Articles avec certains types de blocs
        sortBy: params.sortBy || 'updatedAt',
        sortOrder: params.sortOrder || 'desc',
        page: params.page || 1,
        limit: params.limit || 20
      }
    });
    return response.data;
  },

};

// ==================== SERVICES CARRIÈRES ====================
export const jobService = {
  // Récupérer toutes les offres
  getJobs: async (params = {}) => {
    const response = await api.get('/jobs', { params });
    return response.data;
  },

  // Récupérer une offre par ID
  getJob: async (id) => {
    const response = await api.get(`/jobs/${id}`);
    return response.data;
  },

  // Créer une offre
  createJob: async (jobData) => {
    const response = await api.post('/jobs', jobData);
    toast.success('Offre d\'emploi créée');
    return response.data;
  },

  // Mettre à jour une offre
  updateJob: async (id, jobData) => {
    const response = await api.put(`/jobs/${id}`, jobData);
    toast.success('Offre mise à jour');
    return response.data;
  },

  // Supprimer une offre
  deleteJob: async (id) => {
    await api.delete(`/jobs/${id}`);
    toast.success('Offre supprimée');
  },

  // Récupérer les candidatures
  getApplications: async (jobId) => {
    const response = await api.get(`/jobs/${jobId}/applications`);
    return response.data;
  },

  // Soumettre une candidature
  submitApplication: async (jobId, applicationData) => {
    const formData = new FormData();
    Object.keys(applicationData).forEach(key => {
      formData.append(key, applicationData[key]);
    });
    
    const response = await api.post(`/jobs/${jobId}/apply`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    toast.success('Candidature envoyée avec succès');
    return response.data;
  },



  // Statistiques d'un article
  getArticleStats: async (id) => {
    const response = await api.get(`/blog/articles/${id}/stats`);
    return response.data;
  },

  // Mettre à jour les vues d'un article
  incrementViews: async (id) => {
    const response = await api.post(`/blog/articles/${id}/view`);
    return response.data;
  },

  // Ajouter un commentaire de révision
  addReviewComment: async (id, comment) => {
    const response = await api.post(`/blog/articles/${id}/comments`, {
      content: comment.content,
      blockId: comment.blockId, // Commentaire sur un bloc spécifique
      type: comment.type || 'review'
    });
    return response.data;
  },

  // Récupérer les commentaires d'un article
  getArticleComments: async (id) => {
    const response = await api.get(`/blog/articles/${id}/comments`);
    return response.data;
  },

  // Marquer un commentaire comme résolu
  resolveComment: async (id, commentId) => {
    const response = await api.put(`/blog/articles/${id}/comments/${commentId}/resolve`);
    return response.data;
  }

};

















// ==================== SERVICES NEWSLETTER ====================
export const newsletterService = {
  // S'abonner à la newsletter
  subscribe: async (email) => {
    const response = await api.post('/newsletter/subscribe', { email });
    toast.success('Inscription à la newsletter réussie');
    return response.data;
  },

  // Se désabonner
  unsubscribe: async (token) => {
    const response = await api.post('/newsletter/unsubscribe', { token });
    toast.success('Désabonnement réussi');
    return response.data;
  },

  // Récupérer les abonnés (admin)
  getSubscribers: async (params = {}) => {
    const response = await api.get('/newsletter/subscribers', { params });
    return response.data;
  },

  // Envoyer une newsletter (admin)
  sendNewsletter: async (newsletterData) => {
    const response = await api.post('/newsletter/send', newsletterData);
    toast.success('Newsletter envoyée');
    return response.data;
  }
};

// ==================== SERVICES CONTENU STATIQUE ====================
export const contentService = {
  // Récupérer page par slug
  getPage: async (slug) => {
    const response = await api.get(`/content/pages/${slug}`);
    return response.data;
  },

  // Mettre à jour une page
  updatePage: async (slug, pageData) => {
    const response = await api.put(`/content/pages/${slug}`, pageData);
    toast.success('Page mise à jour');
    return response.data;
  },

  // Récupérer toutes les pages (admin)
  getPages: async () => {
    const response = await api.get('/content/pages');
    return response.data;
  },

  // Upload de média
  uploadMedia: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await api.post('/content/upload-media', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  }
};

// ==================== SERVICES DASHBOARD ====================
export const dashboardService = {
  // Récupérer les statistiques du dashboard
  getStats: async () => {
    const response = await api.get('/dashboard/stats');
    return response.data.data; // ✅ Ajoutez .data pour adapter à votre structure backend
  },

  // Récupérer les activités récentes
  getRecentActivity: async (limit = 10) => {
    const response = await api.get(`/dashboard/activity?limit=${limit}`);
    return response.data.data; // ✅ Ajoutez .data pour adapter à votre structure backend
  },

  // Récupérer les analyses
  getAnalytics: async (period = '30d') => {
    const response = await api.get(`/dashboard/analytics?period=${period}`);
    return response.data.data; // ✅ Ajoutez .data pour adapter à votre structure backend
  }
};

// ==================== QUERY KEYS POUR TANSTACK QUERY ====================
export const queryKeys = {
  // Auth
  currentUser: ['auth', 'currentUser'],
  
  // Blog
  articles: (params = {}) => ['blog', 'articles', params],
  article: (id) => ['blog', 'article', id],
  categories: ['blog', 'categories'],
  
  // Jobs
  jobs: (params = {}) => ['jobs', params],
  job: (id) => ['jobs', id],
  applications: (jobId) => ['jobs', jobId, 'applications'],
  
  // Newsletter
  subscribers: (params = {}) => ['newsletter', 'subscribers', params],
  
  // Content
  pages: ['content', 'pages'],
  page: (slug) => ['content', 'page', slug],
  
  // Dashboard
  stats: ['dashboard', 'stats'],
  activity: (limit) => ['dashboard', 'activity', limit],
  analytics: (period) => ['dashboard', 'analytics', period],

  // Blog - nouvelles clés pour les fonctionnalités avancées
  articleVersions: (id) => ['blog', 'article', id, 'versions'],
  articleComments: (id) => ['blog', 'article', id, 'comments'],
  articleStats: (id) => ['blog', 'article', id, 'stats'],
  autoSavedDraft: (id) => ['blog', 'article', id, 'autosave'],
  
  // Recherche avancée
  searchArticles: (params) => ['blog', 'search', params],
  
  // Filtres par statut
  articlesByStatus: (status) => ['blog', 'articles', 'status', status],
  articlesForReview: ['blog', 'articles', 'pending-review'],
};






// Helper pour valider la structure des blocs côté client
export const validateBlockStructure = (blocks) => {
  if (!Array.isArray(blocks)) return false;
  
  return blocks.every(block => {
    return (
      block.id &&
      block.type &&
      typeof block.order === 'number' &&
      block.content !== undefined
    );
  });
};

// Helper pour nettoyer les blocs avant envoi
export const sanitizeBlocks = (blocks) => {
  return blocks.map((block, index) => ({
    ...block,
    order: index,
    // Retirer les propriétés temporaires côté client
    _isSelected: undefined,
    _isDragging: undefined,
    _tempId: undefined
  })).filter(block => block.type && block.content !== undefined);
};

// Helper pour calculer la taille estimée de l'article
export const calculateArticleSize = (blocks) => {
  let totalSize = 0;
  
  blocks.forEach(block => {
    // Taille du texte
    if (block.content.text) {
      totalSize += new Blob([block.content.text]).size;
    }
    
    // Estimation pour les images (basée sur l'URL)
    if (block.content.src && block.metadata?.size) {
      totalSize += block.metadata.size;
    }
  });
  
  return totalSize;
};

// ==================== WEBSOCKET POUR COLLABORATION (optionnel) ====================

// Si vous voulez ajouter la collaboration en temps réel plus tard
export const blogCollaboration = {
  // Rejoindre une session d'édition
  joinEditSession: async (articleId) => {
    // Implementation WebSocket future
    console.log(`Joining edit session for article ${articleId}`);
  },
  
  // Quitter une session d'édition  
  leaveEditSession: async (articleId) => {
    // Implementation WebSocket future
    console.log(`Leaving edit session for article ${articleId}`);
  }
};

export default api;