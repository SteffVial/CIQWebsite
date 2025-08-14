import express from 'express';
import {
  getAllPosts,
  getPostById,
  getPostBySlug,
  createPost,
  updatePost,
  deletePost,
  publishPost,
  unpublishPost,
  uploadImage,
  upload,
  getPopularTags,
  searchPosts
} from '../controllers/blogController.js';
import {
  authenticateToken,
  requireBlogAdmin,
  optionalAuth,
  rateLimit,
  validateUUID,
  logActivity,
  writeActivityLog
} from '../middleware/auth.js';

const router = express.Router();

// Routes publiques (lecture)

// GET /api/blog - Lister tous les posts (publics ou tous si admin)
router.get('/',
  optionalAuth, // Auth optionnelle pour différencier public/admin
  rateLimit(60, 15 * 60 * 1000), // 60 requêtes par 15 minutes
  getAllPosts
);

// GET /api/blog/search - Rechercher des articles
router.get('/search',
  rateLimit(30, 15 * 60 * 1000), // 30 recherches par 15 minutes
  searchPosts
);

// GET /api/blog/tags - Obtenir les tags populaires
router.get('/tags',
  rateLimit(30, 15 * 60 * 1000),
  getPopularTags
);

// GET /api/blog/slug/:slug - Obtenir un post par son slug
router.get('/slug/:slug',
  optionalAuth,
  rateLimit(100, 15 * 60 * 1000),
  getPostBySlug
);

// GET /api/blog/:id - Obtenir un post par ID
router.get('/:id',
  optionalAuth,
  validateUUID('id'),
  rateLimit(100, 15 * 60 * 1000),
  getPostById
);

// Routes protégées (écriture - nécessitent l'authentification)

// POST /api/blog/upload-image - Upload d'image pour le blog
router.post('/upload-image',
  authenticateToken,
  requireBlogAdmin,
  rateLimit(20, 60 * 60 * 1000), // 20 uploads par heure
  upload.single('image'), // Middleware multer pour l'upload
  logActivity('upload_image', 'blog'),
  writeActivityLog,
  uploadImage
);

// POST /api/blog - Créer un nouveau post
router.post('/',
  authenticateToken,
  requireBlogAdmin,
  rateLimit(10, 60 * 60 * 1000), // 10 créations par heure
  logActivity('create', 'blog_post'),
  writeActivityLog,
  createPost
);

// PUT /api/blog/:id - Mettre à jour un post
router.put('/:id',
  authenticateToken,
  requireBlogAdmin,
  validateUUID('id'),
  rateLimit(20, 60 * 60 * 1000), // 20 mises à jour par heure
  logActivity('update', 'blog_post'),
  writeActivityLog,
  updatePost
);

// DELETE /api/blog/:id - Supprimer un post
router.delete('/:id',
  authenticateToken,
  requireBlogAdmin,
  validateUUID('id'),
  rateLimit(5, 60 * 60 * 1000), // 5 suppressions par heure
  logActivity('delete', 'blog_post'),
  writeActivityLog,
  deletePost
);

// POST /api/blog/:id/publish - Publier un post
router.post('/:id/publish',
  authenticateToken,
  requireBlogAdmin,
  validateUUID('id'),
  rateLimit(20, 60 * 60 * 1000),
  logActivity('publish', 'blog_post'),
  writeActivityLog,
  publishPost
);

// POST /api/blog/:id/unpublish - Dépublier un post (remettre en brouillon)
router.post('/:id/unpublish',
  authenticateToken,
  requireBlogAdmin,
  validateUUID('id'),
  rateLimit(20, 60 * 60 * 1000),
  logActivity('unpublish', 'blog_post'),
  writeActivityLog,
  unpublishPost
);

// Routes de développement (dev mode uniquement)
if (process.env.NODE_ENV === 'development') {
  
  // GET /api/blog/dev/stats - Statistiques du blog (dev only)
  router.get('/dev/stats',
    authenticateToken,
    requireBlogAdmin,
    async (req, res) => {
      try {
        const { query } = await import('../config/database.js');
        
        const stats = await query(`
          SELECT 
            COUNT(*) as total_posts,
            COUNT(*) FILTER (WHERE status = 'published') as published_posts,
            COUNT(*) FILTER (WHERE status = 'draft') as draft_posts,
            COUNT(DISTINCT author_id) as unique_authors,
            AVG(view_count) as avg_views,
            MAX(view_count) as max_views
          FROM blog_posts
        `);

        const recentPosts = await query(`
          SELECT title, status, created_at, view_count
          FROM blog_posts
          ORDER BY created_at DESC
          LIMIT 5
        `);

        res.json({
          success: true,
          data: {
            stats: stats.rows[0],
            recentPosts: recentPosts.rows
          }
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          message: 'Erreur lors de la récupération des statistiques'
        });
      }
    }
  );

  // POST /api/blog/dev/bulk-create - Créer des posts de test (dev only)
  router.post('/dev/bulk-create',
    authenticateToken,
    requireBlogAdmin,
    async (req, res) => {
      try {
        const { count = 5, language = 'fr' } = req.body;
        const { BlogPost } = await import('../models/BlogPost.js');
        
        const createdPosts = [];
        
        for (let i = 1; i <= count; i++) {
          const postData = {
            title: `Article de test ${i}`,
            content: `<p>Ceci est le contenu de l'article de test numéro ${i}. Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>`,
            excerpt: `Extrait de l'article de test ${i}`,
            status: i % 2 === 0 ? 'published' : 'draft',
            language,
            tags: ['test', 'demo', `tag${i}`],
            metaTitle: `Test Article ${i}`,
            metaDescription: `Description de l'article de test ${i}`
          };
          
          const post = await BlogPost.create(postData, req.user.id);
          createdPosts.push(post.toJSON());
        }
        
        res.status(201).json({
          success: true,
          message: `${count} articles de test créés`,
          data: {
            posts: createdPosts
          }
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          message: 'Erreur lors de la création des posts de test'
        });
      }
    }
  );
}

// Route de santé pour le blog
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Service blog opérationnel',
    timestamp: new Date().toISOString(),
    features: [
      'CRUD articles',
      'Upload images',
      'Système de tags',
      'Recherche full-text',
      'Gestion des brouillons',
      'Système de slugs',
      'Support multilingue'
    ]
  });
});

// Middleware de gestion d'erreur pour multer (upload)
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'Fichier trop volumineux (max 5MB)'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Trop de fichiers'
      });
    }
  }
  
  if (error.message.includes('Type de fichier non autorisé')) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
  
  next(error);
});

// Gestion des routes non trouvées
router.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route de blog non trouvée: ${req.method} ${req.originalUrl}`
  });
});

export default router;