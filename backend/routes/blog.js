// backend/routes/blog.js
import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { authenticateToken, requireRole, requireBlogAdmin, logActivity } from '../middleware/auth.js';
import { query } from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration multer pour l'upload d'images
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/blog/');
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Type de fichier non autorisé. Utilisez JPG, PNG, GIF ou WebP.'));
    }
  }
});

// ==================== ARTICLES ====================

// GET /api/blog/articles - Récupérer tous les articles avec filtres
router.get('/articles', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      search,
      category,
      author
    } = req.query;

    const offset = (page - 1) * limit;
    let whereConditions = [];
    let queryParams = [];

    // Construire les conditions WHERE
    if (status && req.user?.roles?.includes('admin')) {
      whereConditions.push(`a.status = $${queryParams.length + 1}`);
      queryParams.push(status);
    } else if (!req.user || !req.user.roles?.includes('admin')) {
      // Public ne voit que les articles publiés
      whereConditions.push(`a.status = $${queryParams.length + 1}`);
      queryParams.push('published');
    }

    if (search) {
      whereConditions.push(`(a.title ILIKE $${queryParams.length + 1} OR a.excerpt ILIKE $${queryParams.length + 1})`);
      queryParams.push(`%${search}%`);
    }

    if (category) {
      whereConditions.push(`c.slug = $${queryParams.length + 1}`);
      queryParams.push(category);
    }

    if (author) {
      whereConditions.push(`u.username = $${queryParams.length + 1}`);
      queryParams.push(author);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Ajouter LIMIT et OFFSET
    const limitPlaceholder = queryParams.length + 1;
    const offsetPlaceholder = queryParams.length + 2;
    queryParams.push(parseInt(limit), parseInt(offset));

    // Requête principale
    const articlesQuery = `
      SELECT 
        a.id,
        a.title,
        a.slug,
        a.excerpt,
        a.blocks,
        a.status,
        a.created_at,
        a.updated_at,
        a.published_at,
        u.id as author_id,
        u.username as author_username,
        u.email as author_email,
        c.id as category_id,
        c.name as category_name,
        c.slug as category_slug
      FROM articles a
      LEFT JOIN users u ON a.author_id = u.id
      LEFT JOIN categories c ON a.category_id = c.id
      ${whereClause}
      ORDER BY a.updated_at DESC
      LIMIT $${limitPlaceholder} OFFSET $${offsetPlaceholder}
    `;

    console.log('🔍 SQL:', articlesQuery);
    console.log('🔍 Params:', queryParams);

    const articlesResult = await query(articlesQuery, queryParams);

    // Traitement des résultats
    const articles = articlesResult.rows.map(article => ({
      id: article.id,
      title: article.title,
      slug: article.slug,
      excerpt: article.excerpt,
      blocks: article.blocks || [],
      status: article.status,
      createdAt: article.created_at,
      updatedAt: article.updated_at,
      publishedAt: article.published_at,
      author: {
        id: article.author_id,
        username: article.author_username,
        email: article.author_email
      },
      category: article.category_name ? {
        id: article.category_id,
        name: article.category_name,
        slug: article.category_slug
      } : null,
      tags: [], // On ajoutera les tags plus tard
      stats: {
        views: 0,
        readTime: 1
      }
    }));

    // Compter le total (sans LIMIT/OFFSET)
    const countParams = queryParams.slice(0, -2); // Enlever LIMIT et OFFSET
    const countQuery = `
      SELECT COUNT(*) as total
      FROM articles a
      LEFT JOIN users u ON a.author_id = u.id
      LEFT JOIN categories c ON a.category_id = c.id
      ${whereClause}
    `;

    const countResult = await query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].total);

    res.json({
      success: true,
      data: articles,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Erreur récupération articles:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/blog/articles/:id - Récupérer un article par ID
router.get('/articles/:id', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const articleResult = await query(`
      SELECT 
        a.*,
        u.username as author_username,
        u.email as author_email,
        c.name as category_name,
        c.slug as category_slug
      FROM articles a
      LEFT JOIN users u ON a.author_id = u.id
      LEFT JOIN categories c ON a.category_id = c.id
      WHERE a.id = $1
    `, [id]);

    if (articleResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Article non trouvé' });
    }

    const article = articleResult.rows[0];

    // Vérifier les permissions de lecture
    if (article.status !== 'published' && (!req.user || !req.user.roles?.includes('admin'))) {
      return res.status(403).json({ success: false, message: 'Accès refusé' });
    }

    // Récupérer les tags
    const tagsResult = await query(`
      SELECT t.id, t.name, t.slug
      FROM tags t
      JOIN article_tags at ON t.id = at.tag_id
      WHERE at.article_id = $1
    `, [id]);

    // Structurer la réponse
    article.tags = tagsResult.rows;
    article.author = {
      id: article.author_id,
      username: article.author_username,
      email: article.author_email
    };
    article.category = article.category_name ? {
      id: article.category_id,
      name: article.category_name,
      slug: article.category_slug
    } : null;

    // Incrémenter les vues (si public et publié)
    if (article.status === 'published') {
      await query(`
        INSERT INTO article_views (article_id, ip_address, user_id)
        VALUES ($1, $2, $3)
      `, [id, req.ip, req.user?.id || null]);
    }

    res.json({ success: true, data: article });

  } catch (error) {
    console.error('Erreur récupération article:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// POST /api/blog/articles - Créer un nouvel article
router.post('/articles', authenticateToken, requireBlogAdmin, async (req, res) => {
  try {
    const {
      title,
      slug,
      excerpt,
      blocks = [],
      status = 'draft',
      categoryId,
      tags = [],
      seo = {}
    } = req.body;

    // Validation de base
    if (!title?.trim()) {
      return res.status(400).json({ success: false, message: 'Le titre est requis' });
    }

    // Générer un slug si non fourni
    const articleSlug = slug || generateSlug(title);

    // Vérifier l'unicité du slug
    const existingSlug = await query('SELECT id FROM articles WHERE slug = $1', [articleSlug]);
    if (existingSlug.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'Ce slug existe déjà' });
    }

    const articleId = uuidv4();

    // Insérer l'article
    await query(`
      INSERT INTO articles (
        id, title, slug, excerpt, blocks, status, author_id, category_id, seo,
        created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `, [
      articleId,
      title.trim(),
      articleSlug,
      excerpt?.trim() || null,
      JSON.stringify(blocks),
      status,
      req.user.id,
      categoryId || null,
      JSON.stringify(seo)
    ]);

    // Gérer les tags
    if (tags.length > 0) {
      await handleArticleTags(articleId, tags);
    }

    // Récupérer l'article créé
    const newArticle = await query(`
      SELECT a.*, u.username as author_username
      FROM articles a
      JOIN users u ON a.author_id = u.id
      WHERE a.id = $1
    `, [articleId]);

    res.status(201).json({
      success: true,
      message: 'Article créé avec succès',
      data: newArticle.rows[0]
    });

  } catch (error) {
    console.error('Erreur création article:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// PUT /api/blog/articles/:id - Mettre à jour un article
router.put('/articles/:id', authenticateToken, requireBlogAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      slug,
      excerpt,
      blocks,
      status,
      categoryId,
      tags,
      seo
    } = req.body;

    // Vérifier que l'article existe
    const existingArticle = await query('SELECT * FROM articles WHERE id = $1', [id]);
    if (existingArticle.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Article non trouvé' });
    }

    // Vérifier les permissions (admin ou propriétaire)
    const article = existingArticle.rows[0];
    if (!req.user.roles.includes('admin') && article.author_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Accès refusé' });
    }

    // Construire la requête de mise à jour
    const updates = [];
    const params = [];
    let paramIndex = 1;

    if (title !== undefined) {
      updates.push(`title = $${paramIndex}`);
      params.push(title.trim());
      paramIndex++;
    }

    if (slug !== undefined) {
      // Vérifier l'unicité du slug (sauf pour l'article actuel)
      const existingSlug = await query('SELECT id FROM articles WHERE slug = $1 AND id != $2', [slug, id]);
      if (existingSlug.rows.length > 0) {
        return res.status(400).json({ success: false, message: 'Ce slug existe déjà' });
      }
      updates.push(`slug = $${paramIndex}`);
      params.push(slug);
      paramIndex++;
    }

    if (excerpt !== undefined) {
      updates.push(`excerpt = $${paramIndex}`);
      params.push(excerpt?.trim() || null);
      paramIndex++;
    }

    if (blocks !== undefined) {
      updates.push(`blocks = $${paramIndex}`);
      params.push(JSON.stringify(blocks));
      paramIndex++;
    }

    if (status !== undefined) {
      updates.push(`status = $${paramIndex}`);
      params.push(status);
      paramIndex++;

      // Si publication, définir la date
      if (status === 'published' && article.published_at === null) {
        updates.push(`published_at = CURRENT_TIMESTAMP`);
      }
    }

    if (categoryId !== undefined) {
      updates.push(`category_id = $${paramIndex}`);
      params.push(categoryId);
      paramIndex++;
    }

    if (seo !== undefined) {
      updates.push(`seo = $${paramIndex}`);
      params.push(JSON.stringify(seo));
      paramIndex++;
    }

    if (updates.length > 0) {
      updates.push(`updated_at = CURRENT_TIMESTAMP`);
      params.push(id);

      const updateQuery = `
        UPDATE articles 
        SET ${updates.join(', ')}
        WHERE id = $${paramIndex}
      `;

      await query(updateQuery, params);
    }

    // Gérer les tags si fournis
    if (tags !== undefined) {
      await handleArticleTags(id, tags);
    }

    // Récupérer l'article mis à jour
    const updatedArticle = await query(`
      SELECT a.*, u.username as author_username
      FROM articles a
      JOIN users u ON a.author_id = u.id
      WHERE a.id = $1
    `, [id]);

    res.json({
      success: true,
      message: 'Article mis à jour avec succès',
      data: updatedArticle.rows[0]
    });

  } catch (error) {
    console.error('Erreur mise à jour article:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// DELETE /api/blog/articles/:id - Supprimer un article
router.delete('/articles/:id', authenticateToken, requireBlogAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Vérifier que l'article existe
    const existingArticle = await query('SELECT * FROM articles WHERE id = $1', [id]);
    if (existingArticle.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Article non trouvé' });
    }

    // Vérifier les permissions
    const article = existingArticle.rows[0];
    if (!req.user.roles.includes('admin') && article.author_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Accès refusé' });
    }

    // Supprimer les relations tags
    await query('DELETE FROM article_tags WHERE article_id = $1', [id]);

    // Supprimer les vues
    await query('DELETE FROM article_views WHERE article_id = $1', [id]);

    // Supprimer l'article
    await query('DELETE FROM articles WHERE id = $1', [id]);

    res.json({
      success: true,
      message: 'Article supprimé avec succès'
    });

  } catch (error) {
    console.error('Erreur suppression article:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// ==================== UPLOAD D'IMAGES ====================

// POST /api/blog/upload-block-image - Upload d'image pour les blocs
router.post('/upload-block-image', authenticateToken, requireBlogAdmin, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Aucun fichier fourni' });
    }

    const imageUrl = `/uploads/blog/${req.file.filename}`;

    res.json({
      success: true,
      message: 'Image uploadée avec succès',
      data: {
        url: imageUrl,
        originalName: req.file.originalname,
        size: req.file.size,
        dimensions: null // À implémenter avec sharp si nécessaire
      }
    });

  } catch (error) {
    console.error('Erreur upload image:', error);
    res.status(500).json({ success: false, message: 'Erreur lors de l\'upload' });
  }
});

// ==================== CATÉGORIES ====================

// GET /api/blog/categories - Récupérer toutes les catégories
router.get('/categories', async (req, res) => {
  try {
    const categories = await query(`
      SELECT 
        c.*,
        COUNT(a.id)::int as article_count
      FROM categories c
      LEFT JOIN articles a ON c.id = a.category_id AND a.status = 'published'
      GROUP BY c.id
      ORDER BY c.name
    `);

    res.json({ success: true, data: categories.rows });

  } catch (error) {
    console.error('Erreur récupération catégories:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// ==================== FONCTIONS UTILITAIRES ====================

// Générer un slug à partir du titre
function generateSlug(title) {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Supprimer les accents
    .replace(/[^a-z0-9\s-]/g, '') // Garder seulement lettres, chiffres, espaces et tirets
    .replace(/\s+/g, '-') // Remplacer espaces par tirets
    .replace(/-+/g, '-') // Éviter les tirets multiples
    .trim('-'); // Supprimer tirets en début/fin
}

// Calculer le temps de lecture approximatif
function calculateReadTime(blocks) {
  const wordsPerMinute = 200;
  let totalWords = 0;

  blocks.forEach(block => {
    if (block.type === 'paragraph' || block.type === 'heading') {
      totalWords += (block.content.text || '').split(' ').filter(w => w).length;
    } else if (block.type === 'list') {
      totalWords += (block.content.items || []).join(' ').split(' ').filter(w => w).length;
    } else if (block.type === 'quote') {
      totalWords += (block.content.text || '').split(' ').filter(w => w).length;
    }
  });

  return Math.max(1, Math.ceil(totalWords / wordsPerMinute));
}

// Gérer les tags d'un article
async function handleArticleTags(articleId, tags) {
  // Supprimer les anciennes associations
  await query('DELETE FROM article_tags WHERE article_id = $1', [articleId]);

  if (tags.length === 0) return;

  for (const tag of tags) {
    let tagId = tag.id;

    // Si le tag n'a pas d'ID, le créer
    if (!tagId || tagId.startsWith('temp-')) {
      const slug = generateSlug(tag.name);
      tagId = uuidv4();

      await query(`
        INSERT INTO tags (id, name, slug) 
        VALUES ($1, $2, $3) 
        ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
        RETURNING id
      `, [tagId, tag.name, slug]);
    }

    // Associer le tag à l'article
    await query(`
      INSERT INTO article_tags (article_id, tag_id)
      VALUES ($1, $2)
      ON CONFLICT DO NOTHING
    `, [articleId, tagId]);
  }
}

// Middleware d'authentification optionnelle
async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const jwt = await import('jsonwebtoken');
      const { User } = await import('../models/User.js');

      const decoded = jwt.default.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId);

      if (user && user.isActive) {
        req.user = user;
      }
    }

    next();
  } catch (error) {
    // Continue même en cas d'erreur (auth optionnelle)
    next();
  }
}

export default router;