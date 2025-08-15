import { SiteContent } from '../models/SiteContent.js';

/**
 * Controller pour la gestion du contenu statique du site
 * Gère les textes, images, et autres contenus éditables
 */

// ==================== ROUTES PUBLIQUES ====================

// Obtenir la structure complète du site - GET /api/content/site/:language
export const getSiteStructure = async (req, res) => {
  try {
    const { language = 'fr' } = req.params;

    if (!['fr', 'en'].includes(language)) {
      return res.status(400).json({
        success: false,
        message: 'Langue non supportée (fr ou en uniquement)'
      });
    }

    const structure = await SiteContent.getSiteStructure(language);

    res.json({
      success: true,
      data: {
        structure,
        language,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Erreur lors de la récupération de la structure:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

// Obtenir le contenu d'une section - GET /api/content/section/:section
export const getSectionContent = async (req, res) => {
  try {
    const { section } = req.params;
    const { language = 'fr' } = req.query;

    const contents = await SiteContent.findBySection(section);

    if (contents.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Section non trouvée'
      });
    }

    // Formatter pour le public selon la langue
    const formattedContents = {};
    contents.forEach(content => {
      const value = content.getValue(language);
      if (value) {
        formattedContents[content.key] = {
          value,
          type: content.contentType
        };
      }
    });

    res.json({
      success: true,
      data: {
        section,
        language,
        contents: formattedContents
      }
    });

  } catch (error) {
    console.error('Erreur lors de la récupération de la section:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

// Obtenir un contenu spécifique - GET /api/content/:section/:key
export const getContent = async (req, res) => {
  try {
    const { section, key } = req.params;
    const { language = 'fr' } = req.query;

    const content = await SiteContent.findByKey(section, key);

    if (!content) {
      return res.status(404).json({
        success: false,
        message: 'Contenu non trouvé'
      });
    }

    const value = content.getValue(language);
    if (!value) {
      return res.status(404).json({
        success: false,
        message: `Contenu non disponible en ${language}`
      });
    }

    res.json({
      success: true,
      data: {
        section: content.section,
        key: content.key,
        value,
        type: content.contentType,
        language
      }
    });

  } catch (error) {
    console.error('Erreur lors de la récupération du contenu:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

// Rechercher dans le contenu - GET /api/content/search
export const searchContent = async (req, res) => {
  try {
    const { q: searchTerm, language = 'fr', limit = 20 } = req.query;

    if (!searchTerm) {
      return res.status(400).json({
        success: false,
        message: 'Terme de recherche requis'
      });
    }

    const results = await SiteContent.search(searchTerm, language, parseInt(limit));

    res.json({
      success: true,
      data: {
        results: results.map(content => content.toPublicJSON(language)),
        searchTerm,
        language,
        count: results.length
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

// ==================== ROUTES ADMIN ====================

// Lister tous les contenus - GET /api/content/admin/contents
export const getAllContents = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      section,
      contentType,
      search,
      sortBy = 'section',
      sortOrder = 'ASC'
    } = req.query;

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      section,
      contentType,
      search,
      sortBy,
      sortOrder,
      includeUpdater: true
    };

    const result = await SiteContent.findAll(options);

    res.json({
      success: true,
      data: {
        contents: result.contents.map(content => content.toAdminJSON()),
        pagination: result.pagination
      }
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des contenus:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

// Obtenir les sections disponibles - GET /api/content/admin/sections
export const getSections = async (req, res) => {
  try {
    const sections = await SiteContent.getSections();

    res.json({
      success: true,
      data: {
        sections
      }
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des sections:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

// Obtenir un contenu par ID - GET /api/content/admin/contents/:id
export const getContentById = async (req, res) => {
  try {
    const { id } = req.params;

    const content = await SiteContent.findById(id, true);

    if (!content) {
      return res.status(404).json({
        success: false,
        message: 'Contenu non trouvé'
      });
    }

    res.json({
      success: true,
      data: {
        content: content.toAdminJSON()
      }
    });

  } catch (error) {
    console.error('Erreur lors de la récupération du contenu:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

// Créer un nouveau contenu - POST /api/content/admin/contents
export const createContent = async (req, res) => {
  try {
    const contentData = req.body;

    // Valider les données requises
    if (!contentData.section || !contentData.key) {
      return res.status(400).json({
        success: false,
        message: 'Section et clé requis'
      });
    }

    if (!contentData.valueFr && !contentData.valueEn) {
      return res.status(400).json({
        success: false,
        message: 'Au moins une valeur (FR ou EN) requise'
      });
    }

    const content = await SiteContent.create(contentData, req.user.id);

    res.status(201).json({
      success: true,
      message: 'Contenu créé avec succès',
      data: {
        content: content.toAdminJSON()
      }
    });

  } catch (error) {
    console.error('Erreur lors de la création du contenu:', error);
    
    if (error.message.includes('existe déjà')) {
      return res.status(409).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

// Mettre à jour un contenu - PUT /api/content/admin/contents/:id
export const updateContent = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const content = await SiteContent.findById(id);

    if (!content) {
      return res.status(404).json({
        success: false,
        message: 'Contenu non trouvé'
      });
    }

    await content.update(updates, req.user.id);

    res.json({
      success: true,
      message: 'Contenu mis à jour avec succès',
      data: {
        content: content.toAdminJSON()
      }
    });

  } catch (error) {
    console.error('Erreur lors de la mise à jour du contenu:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

// Créer ou mettre à jour un contenu (upsert) - PUT /api/content/admin/upsert
export const upsertContent = async (req, res) => {
  try {
    const { section, key, valueFr, valueEn, contentType } = req.body;

    if (!section || !key) {
      return res.status(400).json({
        success: false,
        message: 'Section et clé requis'
      });
    }

    const content = await SiteContent.upsert(
      section, 
      key, 
      valueFr, 
      valueEn, 
      contentType, 
      req.user.id
    );

    res.json({
      success: true,
      message: 'Contenu sauvegardé avec succès',
      data: {
        content: content.toAdminJSON()
      }
    });

  } catch (error) {
    console.error('Erreur lors de la sauvegarde du contenu:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

// Supprimer un contenu - DELETE /api/content/admin/contents/:id
export const deleteContent = async (req, res) => {
  try {
    const { id } = req.params;

    const content = await SiteContent.findById(id);

    if (!content) {
      return res.status(404).json({
        success: false,
        message: 'Contenu non trouvé'
      });
    }

    await content.delete();

    res.json({
      success: true,
      message: 'Contenu supprimé avec succès'
    });

  } catch (error) {
    console.error('Erreur lors de la suppression du contenu:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

// Dupliquer une section - POST /api/content/admin/duplicate-section
export const duplicateSection = async (req, res) => {
  try {
    const { sourceSection, targetSection } = req.body;

    if (!sourceSection || !targetSection) {
      return res.status(400).json({
        success: false,
        message: 'Section source et section cible requises'
      });
    }

    const duplicated = await SiteContent.duplicateSection(
      sourceSection, 
      targetSection, 
      req.user.id
    );

    res.json({
      success: true,
      message: `Section ${sourceSection} dupliquée vers ${targetSection}`,
      data: {
        sourceSection,
        targetSection,
        duplicatedCount: duplicated.length,
        contents: duplicated.map(content => content.toAdminJSON())
      }
    });

  } catch (error) {
    console.error('Erreur lors de la duplication de section:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

// Exporter tout le contenu - GET /api/content/admin/export
export const exportContent = async (req, res) => {
  try {
    const { format = 'json' } = req.query;

    const exportData = await SiteContent.exportAll(format);

    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="site-content.csv"');
      res.send(exportData);
    } else {
      res.json({
        success: true,
        data: {
          contents: exportData,
          count: exportData.length,
          exportedAt: new Date().toISOString()
        }
      });
    }

  } catch (error) {
    console.error('Erreur lors de l\'export:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'export'
    });
  }
};

// Rechercher des contenus (admin) - GET /api/content/admin/search
export const searchContentAdmin = async (req, res) => {
  try {
    const { q: searchTerm, language = 'fr', limit = 50 } = req.query;

    if (!searchTerm) {
      return res.status(400).json({
        success: false,
        message: 'Terme de recherche requis'
      });
    }

    const results = await SiteContent.search(searchTerm, language, parseInt(limit));

    res.json({
      success: true,
      data: {
        results: results.map(content => content.toAdminJSON()),
        searchTerm,
        language,
        count: results.length
      }
    });

  } catch (error) {
    console.error('Erreur lors de la recherche admin:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

// Mettre à jour plusieurs contenus en lot - PUT /api/content/admin/bulk-update
export const bulkUpdateContent = async (req, res) => {
  try {
    const { updates } = req.body; // Array d'objets {id, valueFr, valueEn, contentType}

    if (!Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Array de mises à jour requis'
      });
    }

    const results = [];
    const errors = [];

    for (const update of updates) {
      try {
        const { id, ...updateData } = update;
        const content = await SiteContent.findById(id);
        
        if (content) {
          await content.update(updateData, req.user.id);
          results.push(content.toAdminJSON());
        } else {
          errors.push(`Contenu ${id} non trouvé`);
        }
      } catch (error) {
        errors.push(`Erreur ${update.id}: ${error.message}`);
      }
    }

    res.json({
      success: true,
      message: `${results.length} contenus mis à jour`,
      data: {
        updated: results,
        errors: errors.length > 0 ? errors : undefined
      }
    });

  } catch (error) {
    console.error('Erreur lors de la mise à jour en lot:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

// Obtenir les statistiques du contenu - GET /api/content/admin/stats
export const getContentStats = async (req, res) => {
  try {
    const { query } = await import('../config/database.js');
    
    const stats = await query(`
      SELECT 
        COUNT(*) as total_contents,
        COUNT(DISTINCT section) as total_sections,
        COUNT(*) FILTER (WHERE content_type = 'text') as text_contents,
        COUNT(*) FILTER (WHERE content_type = 'html') as html_contents,
        COUNT(*) FILTER (WHERE content_type = 'image') as image_contents,
        COUNT(*) FILTER (WHERE content_type = 'url') as url_contents,
        COUNT(*) FILTER (WHERE value_fr IS NOT NULL AND value_en IS NOT NULL) as translated_contents,
        COUNT(*) FILTER (WHERE value_fr IS NOT NULL AND value_en IS NULL) as fr_only_contents,
        COUNT(*) FILTER (WHERE value_fr IS NULL AND value_en IS NOT NULL) as en_only_contents,
        COUNT(*) FILTER (WHERE updated_at >= CURRENT_DATE - INTERVAL '7 days') as updated_last_7_days,
        COUNT(*) FILTER (WHERE updated_at >= CURRENT_DATE - INTERVAL '30 days') as updated_last_30_days
      FROM site_content
    `);

    const sectionStats = await query(`
      SELECT section, COUNT(*) as count
      FROM site_content
      GROUP BY section
      ORDER BY count DESC
    `);

    const recentUpdates = await query(`
      SELECT sc.section, sc.key, sc.updated_at, u.username as updated_by_username
      FROM site_content sc
      LEFT JOIN users u ON sc.updated_by = u.id
      ORDER BY sc.updated_at DESC
      LIMIT 10
    `);

    res.json({
      success: true,
      data: {
        stats: stats.rows[0],
        sectionStats: sectionStats.rows,
        recentUpdates: recentUpdates.rows
      }
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};