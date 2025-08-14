import { query } from '../config/database.js';

export class BlogPost {
  constructor(postData) {
    this.id = postData.id;
    this.title = postData.title;
    this.slug = postData.slug;
    this.content = postData.content;
    this.excerpt = postData.excerpt;
    this.featuredImage = postData.featured_image;
    this.status = postData.status;
    this.language = postData.language;
    this.authorId = postData.author_id;
    this.publishedAt = postData.published_at;
    this.createdAt = postData.created_at;
    this.updatedAt = postData.updated_at;
    this.metaTitle = postData.meta_title;
    this.metaDescription = postData.meta_description;
    this.tags = postData.tags || [];
    this.viewCount = postData.view_count || 0;
    
    // Données relationnelles (si jointes)
    this.author = postData.author || null;
  }

  // Créer un nouveau post
  static async create(postData, authorId) {
    const {
      title,
      content,
      excerpt,
      featuredImage,
      status = 'draft',
      language = 'fr',
      metaTitle,
      metaDescription,
      tags = [],
      publishedAt
    } = postData;

    // Générer le slug depuis le titre
    const slug = await BlogPost.generateUniqueSlug(title, language);

    const result = await query(`
      INSERT INTO blog_posts (
        title, slug, content, excerpt, featured_image, status, language,
        author_id, published_at, meta_title, meta_description, tags
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `, [
      title, slug, content, excerpt, featuredImage, status, language,
      authorId, publishedAt, metaTitle, metaDescription, tags
    ]);

    return new BlogPost(result.rows[0]);
  }

  // Trouver un post par ID
  static async findById(id, includeAuthor = false) {
    let sql = 'SELECT * FROM blog_posts WHERE id = $1';
    
    if (includeAuthor) {
      sql = `
        SELECT bp.*, 
               u.username as author_username,
               u.first_name as author_first_name,
               u.last_name as author_last_name
        FROM blog_posts bp
        LEFT JOIN users u ON bp.author_id = u.id
        WHERE bp.id = $1
      `;
    }

    const result = await query(sql, [id]);
    if (result.rows.length === 0) return null;

    const post = new BlogPost(result.rows[0]);
    
    if (includeAuthor && result.rows[0].author_username) {
      post.author = {
        username: result.rows[0].author_username,
        firstName: result.rows[0].author_first_name,
        lastName: result.rows[0].author_last_name
      };
    }

    return post;
  }

  // Trouver un post par slug
  static async findBySlug(slug, language = 'fr', includeAuthor = false) {
    let sql = 'SELECT * FROM blog_posts WHERE slug = $1 AND language = $2';
    
    if (includeAuthor) {
      sql = `
        SELECT bp.*, 
               u.username as author_username,
               u.first_name as author_first_name,
               u.last_name as author_last_name
        FROM blog_posts bp
        LEFT JOIN users u ON bp.author_id = u.id
        WHERE bp.slug = $1 AND bp.language = $2
      `;
    }

    const result = await query(sql, [slug, language]);
    if (result.rows.length === 0) return null;

    const post = new BlogPost(result.rows[0]);
    
    if (includeAuthor && result.rows[0].author_username) {
      post.author = {
        username: result.rows[0].author_username,
        firstName: result.rows[0].author_first_name,
        lastName: result.rows[0].author_last_name
      };
    }

    return post;
  }

  // Lister les posts avec pagination et filtres
  static async findAll(options = {}) {
    const {
      page = 1,
      limit = 10,
      status,
      language = 'fr',
      authorId,
      tags,
      search,
      sortBy = 'created_at',
      sortOrder = 'DESC',
      includeAuthor = false
    } = options;

    const offset = (page - 1) * limit;
    const conditions = [];
    const values = [];
    let paramCount = 1;

    // Construire les conditions WHERE
    if (status) {
      conditions.push(`bp.status = $${paramCount}`);
      values.push(status);
      paramCount++;
    }

    if (language) {
      conditions.push(`bp.language = $${paramCount}`);
      values.push(language);
      paramCount++;
    }

    if (authorId) {
      conditions.push(`bp.author_id = $${paramCount}`);
      values.push(authorId);
      paramCount++;
    }

    if (tags && tags.length > 0) {
      conditions.push(`bp.tags && $${paramCount}`);
      values.push(tags);
      paramCount++;
    }

    if (search) {
      conditions.push(`(bp.title ILIKE $${paramCount} OR bp.content ILIKE $${paramCount} OR bp.excerpt ILIKE $${paramCount})`);
      values.push(`%${search}%`);
      paramCount++;
    }

    // Base de la requête
    let sql = includeAuthor ? `
      SELECT bp.*, 
             u.username as author_username,
             u.first_name as author_first_name,
             u.last_name as author_last_name
      FROM blog_posts bp
      LEFT JOIN users u ON bp.author_id = u.id
    ` : 'SELECT * FROM blog_posts bp';

    // Ajouter les conditions
    if (conditions.length > 0) {
      sql += ` WHERE ${conditions.join(' AND ')}`;
    }

    // Tri et pagination
    sql += ` ORDER BY bp.${sortBy} ${sortOrder} LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    values.push(limit, offset);

    const result = await query(sql, values);
    
    // Compter le total pour la pagination
    let countSql = 'SELECT COUNT(*) FROM blog_posts bp';
    if (conditions.length > 0) {
      countSql += ` WHERE ${conditions.join(' AND ')}`;
    }
    
    const countResult = await query(countSql, values.slice(0, -2)); // Enlever limit et offset
    const total = parseInt(countResult.rows[0].count);

    const posts = result.rows.map(row => {
      const post = new BlogPost(row);
      
      if (includeAuthor && row.author_username) {
        post.author = {
          username: row.author_username,
          firstName: row.author_first_name,
          lastName: row.author_last_name
        };
      }
      
      return post;
    });

    return {
      posts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    };
  }

  // Mettre à jour un post
  async update(updates) {
    const allowedFields = [
      'title', 'content', 'excerpt', 'featured_image', 'status',
      'language', 'published_at', 'meta_title', 'meta_description', 'tags'
    ];

    const setClause = [];
    const values = [];
    let paramCount = 1;

    // Si le titre change, régénérer le slug
    if (updates.title && updates.title !== this.title) {
      const newSlug = await BlogPost.generateUniqueSlug(updates.title, this.language, this.id);
      updates.slug = newSlug;
      allowedFields.push('slug');
    }

    // Construire la requête UPDATE
    for (const [field, value] of Object.entries(updates)) {
      if (allowedFields.includes(field)) {
        setClause.push(`${field} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    }

    if (setClause.length === 0) {
      throw new Error('Aucun champ valide à mettre à jour');
    }

    values.push(this.id);
    const sql = `UPDATE blog_posts SET ${setClause.join(', ')} WHERE id = $${paramCount} RETURNING *`;
    
    const result = await query(sql, values);
    
    if (result.rows.length > 0) {
      Object.assign(this, new BlogPost(result.rows[0]));
    }

    return this;
  }

  // Supprimer un post
  async delete() {
    await query('DELETE FROM blog_posts WHERE id = $1', [this.id]);
  }

  // Publier un post
  async publish() {
    const publishedAt = new Date();
    await this.update({ 
      status: 'published', 
      published_at: publishedAt 
    });
  }

  // Mettre en brouillon
  async unpublish() {
    await this.update({ 
      status: 'draft', 
      published_at: null 
    });
  }

  // Incrémenter les vues
  async incrementViews() {
    await query('UPDATE blog_posts SET view_count = view_count + 1 WHERE id = $1', [this.id]);
    this.viewCount++;
  }

  // Générer un slug unique
  static async generateUniqueSlug(title, language, excludeId = null) {
    // Créer un slug de base
    let baseSlug = title
      .toLowerCase()
      .replace(/[àáäâ]/g, 'a')
      .replace(/[èéëê]/g, 'e')
      .replace(/[ìíïî]/g, 'i')
      .replace(/[òóöô]/g, 'o')
      .replace(/[ùúüû]/g, 'u')
      .replace(/[ñ]/g, 'n')
      .replace(/[ç]/g, 'c')
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    let slug = baseSlug;
    let counter = 1;

    // Vérifier l'unicité
    while (true) {
      let checkSql = 'SELECT id FROM blog_posts WHERE slug = $1 AND language = $2';
      let checkValues = [slug, language];

      if (excludeId) {
        checkSql += ' AND id != $3';
        checkValues.push(excludeId);
      }

      const existing = await query(checkSql, checkValues);
      
      if (existing.rows.length === 0) {
        break;
      }

      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    return slug;
  }

  // Obtenir les tags populaires
  static async getPopularTags(language = 'fr', limit = 20) {
    const result = await query(`
      SELECT tag, COUNT(*) as count
      FROM (
        SELECT unnest(tags) as tag
        FROM blog_posts
        WHERE language = $1 AND status = 'published'
      ) t
      GROUP BY tag
      ORDER BY count DESC
      LIMIT $2
    `, [language, limit]);

    return result.rows;
  }

  // Recherche full-text
  static async search(searchTerm, language = 'fr', limit = 10) {
    const result = await query(`
      SELECT *, 
             ts_rank(to_tsvector('french', title || ' ' || content), plainto_tsquery('french', $1)) as rank
      FROM blog_posts
      WHERE to_tsvector('french', title || ' ' || content) @@ plainto_tsquery('french', $1)
        AND language = $2
        AND status = 'published'
      ORDER BY rank DESC
      LIMIT $3
    `, [searchTerm, language, limit]);

    return result.rows.map(row => new BlogPost(row));
  }

  // Conversion JSON pour l'API
  toJSON() {
    return {
      id: this.id,
      title: this.title,
      slug: this.slug,
      content: this.content,
      excerpt: this.excerpt,
      featuredImage: this.featuredImage,
      status: this.status,
      language: this.language,
      authorId: this.authorId,
      author: this.author,
      publishedAt: this.publishedAt,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      metaTitle: this.metaTitle,
      metaDescription: this.metaDescription,
      tags: this.tags,
      viewCount: this.viewCount
    };
  }

  // Version publique (sans données sensibles)
  toPublicJSON() {
    return {
      id: this.id,
      title: this.title,
      slug: this.slug,
      content: this.content,
      excerpt: this.excerpt,
      featuredImage: this.featuredImage,
      language: this.language,
      author: this.author,
      publishedAt: this.publishedAt,
      metaTitle: this.metaTitle,
      metaDescription: this.metaDescription,
      tags: this.tags,
      viewCount: this.viewCount
    };
  }
}