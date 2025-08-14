import { BlogPost } from '../models/BlogPost.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Controller pour la gestion des articles de blog
 * Gère CRUD, upload d'images, publication, etc.
 */

// Configuration de multer pour l'upload d'images
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../uploads/blog');
    try {
      await fs.mkdir(uploadPath, { recursive: true });
      cb(null, uploadPath);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, `blog-${uniqueSuffix}${extension}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Type de fichier non autorisé. Utilisez JPG, PNG ou WebP.'), false);
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
  }
});

// Lister tous les posts - GET /api/blog
export const getAllPosts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      language = 'fr',
      authorId,
      tags,
      search,
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = req.query;

    // Convertir les tags en array si fourni
    const tagsArray = tags ? tags.split(',').map(tag => tag.trim()) : null;

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      status,
      language,
      authorId,
      tags: tagsArray,
      search,
      sortBy,
      sortOrder,
      includeAuthor: true
    };

    // Si pas admin/blogadmin, ne montrer que les posts publiés
    if (!req.user?.hasRole('admin') && !req.user?.hasRole('blogadmin')) {
      options.status = 'published';
    }

    const result = await BlogPost.findAll(options);

    res.json({
      success: true,
      data: {
        posts: result.posts.map(post => 
          req.user?.hasRole('admin') || req.user?.hasRole('blogadmin') 
            ? post.toJSON() 
            : post.toPublicJSON()
        ),
        pagination: result.pagination
      }
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des posts:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

// Obtenir un post par ID - GET /api/blog/:id
export const getPostById = async (req, res) => {
  try {
    const { id } = req.params;
    const post = await BlogPost.findById(id, true);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Article non trouvé'
      });
    }

    // Vérifier les permissions pour les brouillons
    if (post.status !== 'published') {
      if (!req.user?.hasRole('admin') && !req.user?.hasRole('blogadmin')) {
        return res.status(403).json({
          success: false,
          message: 'Accès non autorisé'
        });
      }
    } else {
      // Incrémenter les vues pour les posts publiés
      await post.incrementViews();
    }

    res.json({
      success: true,
      data: {
        post: req.user?.hasRole('admin') || req.user?.hasRole('blogadmin') 
          ? post.toJSON() 
          : post.toPublicJSON()
      }
    });

  } catch (error) {
    console.error('Erreur lors de la récupération du post:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

// Obtenir un post par slug - GET /api/blog/slug/:slug
export const getPostBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const { language = 'fr' } = req.query;
    
    const post = await BlogPost.findBySlug(slug, language, true);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Article non trouvé'
      });
    }

    // Vérifier les permissions pour les brouillons
    if (post.status !== 'published') {
      if (!req.user?.hasRole('admin') && !req.user?.hasRole('blogadmin')) {
        return res.status(403).json({
          success: false,
          message: 'Accès non autorisé'
        });
      }
    } else {
      // Incrémenter les vues pour les posts publiés
      await post.incrementViews();
    }

    res.json({
      success: true,
      data: {
        post: req.user?.hasRole('admin') || req.user?.hasRole('blogadmin') 
          ? post.toJSON() 
          : post.toPublicJSON()
      }
    });

  } catch (error) {
    console.error('Erreur lors de la récupération du post:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

// Créer un nouveau post - POST /api/blog
export const createPost = async (req, res) => {
  try {
    const postData = req.body;
    
    // Valider les données requises
    if (!postData.title || !postData.content) {
      return res.status(400).json({
        success: false,
        message: 'Titre et contenu requis'
      });
    }

    // Créer le post
    const post = await BlogPost.create(postData, req.user.id);

    res.status(201).json({
      success: true,
      message: 'Article créé avec succès',
      data: {
        post: post.toJSON()
      }
    });

  } catch (error) {
    console.error('Erreur lors de la création du post:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

// Mettre à jour un post - PUT /api/blog/:id
export const updatePost = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const post = await BlogPost.findById(id);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Article non trouvé'
      });
    }

    // Vérifier les permissions (admin ou auteur du post)
    if (!req.user.hasRole('admin') && post.authorId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Permissions insuffisantes'
      });
    }

    await post.update(updates);

    res.json({
      success: true,
      message: 'Article mis à jour avec succès',
      data: {
        post: post.toJSON()
      }
    });

  } catch (error) {
    console.error('Erreur lors de la mise à jour du post:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

// Supprimer un post - DELETE /api/blog/:id
export const deletePost = async (req, res) => {
  try {
    const { id } = req.params;

    const post = await BlogPost.findById(id);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Article non trouvé'
      });
    }

    // Vérifier les permissions (admin ou auteur du post)
    if (!req.user.hasRole('admin') && post.authorId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Permissions insuffisantes'
      });
    }

    // Supprimer l'image featured si elle existe
    if (post.featuredImage) {
      try {
        const imagePath = path.join(__dirname, '../uploads/blog', path.basename(post.featuredImage));
        await fs.unlink(imagePath);
      } catch (error) {
        console.warn('Impossible de supprimer l\'image:', error.message);
      }
    }

    await post.delete();

    res.json({
      success: true,
      message: 'Article supprimé avec succès'
    });

  } catch (error) {
    console.error('Erreur lors de la suppression du post:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

// Publier un post - POST /api/blog/:id/publish
export const publishPost = async (req, res) => {
  try {
    const { id } = req.params;

    const post = await BlogPost.findById(id);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Article non trouvé'
      });
    }

    // Vérifier les permissions
    if (!req.user.hasRole('admin') && !req.user.hasRole('blogadmin')) {
      return res.status(403).json({
        success: false,
        message: 'Permissions insuffisantes pour publier'
      });
    }

    await post.publish();

    res.json({
      success: true,
      message: 'Article publié avec succès',
      data: {
        post: post.toJSON()
      }
    });

  } catch (error) {
    console.error('Erreur lors de la publication:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

// Mettre en brouillon - POST /api/blog/:id/unpublish
export const unpublishPost = async (req, res) => {
  try {
    const { id } = req.params;

    const post = await BlogPost.findById(id);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Article non trouvé'
      });
    }

    // Vérifier les permissions
    if (!req.user.hasRole('admin') && !req.user.hasRole('blogadmin')) {
      return res.status(403).json({
        success: false,
        message: 'Permissions insuffisantes'
      });
    }

    await post.unpublish();

    res.json({
      success: true,
      message: 'Article dépublié avec succès',
      data: {
        post: post.toJSON()
      }
    });

  } catch (error) {
    console.error('Erreur lors de la dépublication:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

// Upload d'image - POST /api/blog/upload-image
export const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Aucun fichier uploadé'
      });
    }

    const imageUrl = `/uploads/blog/${req.file.filename}`;

    res.json({
      success: true,
      message: 'Image uploadée avec succès',
      data: {
        imageUrl,
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size
      }
    });

  } catch (error) {
    console.error('Erreur lors de l\'upload:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'upload'
    });
  }
};

// Obtenir les tags populaires - GET /api/blog/tags
export const getPopularTags = async (req, res) => {
  try {
    const { language = 'fr', limit = 20 } = req.query;
    
    const tags = await BlogPost.getPopularTags(language, parseInt(limit));

    res.json({
      success: true,
      data: {
        tags
      }
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des tags:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

// Recherche d'articles - GET /api/blog/search
export const searchPosts = async (req, res) => {
  try {
    const { q: searchTerm, language = 'fr', limit = 10 } = req.query;

    if (!searchTerm) {
      return res.status(400).json({
        success: false,
        message: 'Terme de recherche requis'
      });
    }

    const posts = await BlogPost.search(searchTerm, language, parseInt(limit));

    res.json({
      success: true,
      data: {
        posts: posts.map(post => post.toPublicJSON()),
        searchTerm,
        count: posts.length
      }
    });

  } catch (error) {
    console.error('Erreur lors de la recherche:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};