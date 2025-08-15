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
      const { token, user } = response.data;
      
      Cookies.set('auth_token', token, { expires: 7, secure: true, sameSite: 'lax' });
      Cookies.set('user', JSON.stringify(user), { expires: 7, secure: true, sameSite: 'lax' });
      
      toast.success(`Bienvenue ${user.username}!`);
      return response.data;
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
    return response.data;
  },

  // Récupérer un article par ID
  getArticle: async (id) => {
    const response = await api.get(`/blog/articles/${id}`);
    return response.data;
  },

  // Créer un article
  createArticle: async (articleData) => {
    const response = await api.post('/blog/articles', articleData);
    toast.success('Article créé avec succès');
    return response.data;
  },

  // Mettre à jour un article
  updateArticle: async (id, articleData) => {
    const response = await api.put(`/blog/articles/${id}`, articleData);
    toast.success('Article mis à jour');
    return response.data;
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
    return response.data;
  }
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
    return response.data;
  },

  // Récupérer les activités récentes
  getRecentActivity: async (limit = 10) => {
    const response = await api.get(`/dashboard/activity?limit=${limit}`);
    return response.data;
  },

  // Récupérer les analyses
  getAnalytics: async (period = '30d') => {
    const response = await api.get(`/dashboard/analytics?period=${period}`);
    return response.data;
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
  analytics: (period) => ['dashboard', 'analytics', period]
};

export default api;