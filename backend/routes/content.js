import express from 'express';
import {
  getSiteStructure,
  getSectionContent,
  getContent,
  searchContent,
  getAllContents,
  getSections,
  getContentById,
  createContent,
  updateContent,
  upsertContent,
  deleteContent,
  duplicateSection,
  exportContent,
  searchContentAdmin,
  bulkUpdateContent,
  getContentStats
} from '../controllers/contentController.js';
import {
  authenticateToken,
  requireContentAdmin,
  requireAdmin,
  rateLimit,
  validateUUID,
  logActivity,
  writeActivityLog
} from '../middleware/auth.js';

const router = express.Router();

// ==================== ROUTES PUBLIQUES ====================

// GET /api/content/health - Santé du service (DOIT être en premier)
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Service contenu statique opérationnel',
    timestamp: new Date().toISOString(),
    features: [
      'Gestion contenu multilingue',
      'Structure de site dynamique',
      'Types de contenu variés',
      'Interface contentadmin',
      'Recherche et filtres',
      'Export/Import',
      'Versioning des modifications'
    ]
  });
});

// GET /api/content/site/:language - Structure complète du site
router.get('/site/:language',
  rateLimit(60, 15 * 60 * 1000), // 60 requêtes par 15 minutes
  getSiteStructure
);

// GET /api/content/section/:section - Contenu d'une section
router.get('/section/:section',
  rateLimit(100, 15 * 60 * 1000), // 100 requêtes par 15 minutes
  getSectionContent
);

// GET /api/content/search - Rechercher dans le contenu
router.get('/search',
  rateLimit(30, 15 * 60 * 1000), // 30 recherches par 15 minutes
  searchContent
);

// ==================== ROUTES PROTÉGÉES (CONTENTADMIN) - AVANT LES ROUTES GÉNÉRIQUES ====================

// GET /api/content/admin/contents - Lister tous les contenus
router.get('/admin/contents',
  authenticateToken,
  requireContentAdmin,
  rateLimit(50, 15 * 60 * 1000),
  getAllContents
);

// GET /api/content/admin/sections - Obtenir les sections disponibles
router.get('/admin/sections',
  authenticateToken,
  requireContentAdmin,
  rateLimit(30, 15 * 60 * 1000),
  getSections
);

// GET /api/content/admin/stats - Statistiques du contenu
router.get('/admin/stats',
  authenticateToken,
  requireContentAdmin,
  rateLimit(20, 15 * 60 * 1000),
  getContentStats
);

// GET /api/content/admin/search - Rechercher des contenus (admin)
router.get('/admin/search',
  authenticateToken,
  requireContentAdmin,
  rateLimit(30, 15 * 60 * 1000),
  searchContentAdmin
);

// GET /api/content/admin/export - Exporter tout le contenu
router.get('/admin/export',
  authenticateToken,
  requireContentAdmin,
  rateLimit(5, 60 * 60 * 1000), // 5 exports par heure
  logActivity('export', 'site_content'),
  writeActivityLog,
  exportContent
);

// GET /api/content/admin/contents/:id - Obtenir un contenu par ID
router.get('/admin/contents/:id',
  authenticateToken,
  requireContentAdmin,
  validateUUID('id'),
  rateLimit(100, 15 * 60 * 1000),
  getContentById
);

// POST /api/content/admin/contents - Créer un nouveau contenu
router.post('/admin/contents',
  authenticateToken,
  requireContentAdmin,
  rateLimit(20, 60 * 60 * 1000), // 20 créations par heure
  logActivity('create', 'site_content'),
  writeActivityLog,
  createContent
);

// PUT /api/content/admin/contents/:id - Mettre à jour un contenu
router.put('/admin/contents/:id',
  authenticateToken,
  requireContentAdmin,
  validateUUID('id'),
  rateLimit(50, 60 * 60 * 1000), // 50 mises à jour par heure
  logActivity('update', 'site_content'),
  writeActivityLog,
  updateContent
);

// PUT /api/content/admin/upsert - Créer ou mettre à jour un contenu
router.put('/admin/upsert',
  authenticateToken,
  requireContentAdmin,
  rateLimit(30, 60 * 60 * 1000), // 30 upserts par heure
  logActivity('upsert', 'site_content'),
  writeActivityLog,
  upsertContent
);

// PUT /api/content/admin/bulk-update - Mettre à jour plusieurs contenus
router.put('/admin/bulk-update',
  authenticateToken,
  requireContentAdmin,
  rateLimit(10, 60 * 60 * 1000), // 10 mises à jour en lot par heure
  logActivity('bulk_update', 'site_content'),
  writeActivityLog,
  bulkUpdateContent
);

// DELETE /api/content/admin/contents/:id - Supprimer un contenu
router.delete('/admin/contents/:id',
  authenticateToken,
  requireContentAdmin,
  validateUUID('id'),
  rateLimit(10, 60 * 60 * 1000), // 10 suppressions par heure
  logActivity('delete', 'site_content'),
  writeActivityLog,
  deleteContent
);

// POST /api/content/admin/duplicate-section - Dupliquer une section
router.post('/admin/duplicate-section',
  authenticateToken,
  requireContentAdmin,
  rateLimit(5, 60 * 60 * 1000), // 5 duplications par heure
  logActivity('duplicate_section', 'site_content'),
  writeActivityLog,
  duplicateSection
);

// ==================== ROUTES ADMIN AVANCÉES ====================

// Routes réservées aux admins complets
router.use('/admin/advanced/*', authenticateToken, requireAdmin);

// ==================== ROUTES DE DÉVELOPPEMENT ====================

if (process.env.NODE_ENV === 'development') {
  
  // POST /api/content/dev/seed - Créer du contenu de test
  router.post('/dev/seed',
    authenticateToken,
    requireContentAdmin,
    async (req, res) => {
      try {
        const { SiteContent } = await import('../models/SiteContent.js');
        
        const sampleContents = [
          // Section Hero
          {
            section: 'hero',
            key: 'title',
            valueFr: 'La synergie au cœur de la transformation cyber',
            valueEn: 'Synergy at the heart of cyber transformation',
            contentType: 'text'
          },
          {
            section: 'hero',
            key: 'subtitle',
            valueFr: 'La cybermenace mondiale est bien présente',
            valueEn: 'The global cyber threat is very present',
            contentType: 'text'
          },
          {
            section: 'hero',
            key: 'cta_text',
            valueFr: 'Demander un rendez-vous',
            valueEn: 'Request a meeting',
            contentType: 'text'
          },
          
          // Section About
          {
            section: 'about',
            key: 'title',
            valueFr: 'À propos de CynergyIQ',
            valueEn: 'About CynergyIQ',
            contentType: 'text'
          },
          {
            section: 'about',
            key: 'description',
            valueFr: '<p>CynergyIQ a été fondé par des gens d\'expérience pour répondre à cette demande grandissante des entreprises à se préparer à une cybermenace.</p>',
            valueEn: '<p>CynergyIQ was founded by experienced people to respond to this growing demand from companies to prepare for cyber threats.</p>',
            contentType: 'html'
          },
          
          // Section Services
          {
            section: 'services',
            key: 'title',
            valueFr: 'ON VOUS ACCOMPAGNE',
            valueEn: 'WE SUPPORT YOU',
            contentType: 'text'
          },
          {
            section: 'services',
            key: 'service1_title',
            valueFr: 'Services Conseils',
            valueEn: 'Advisory Services',
            contentType: 'text'
          },
          {
            section: 'services',
            key: 'service2_title',
            valueFr: 'Résilience et Sensibilisation',
            valueEn: 'Resilience and Awareness',
            contentType: 'text'
          },
          {
            section: 'services',
            key: 'service3_title',
            valueFr: 'Maturité et Stratégie',
            valueEn: 'Maturity and Strategy',
            contentType: 'text'
          },
          {
            section: 'services',
            key: 'service4_title',
            valueFr: 'Compétences et Transformation',
            valueEn: 'Skills and Transformation',
            contentType: 'text'
          },
          
          // Section Contact
          {
            section: 'contact',
            key: 'title',
            valueFr: 'Contactez-nous',
            valueEn: 'Contact us',
            contentType: 'text'
          },
          {
            section: 'contact',
            key: 'address_montreal',
            valueFr: '2001 Boulevard Robert Bourassa, Montréal',
            valueEn: '2001 Boulevard Robert Bourassa, Montreal',
            contentType: 'text'
          },
          {
            section: 'contact',
            key: 'address_marseille',
            valueFr: '49 quai de Lazaret, 13002 Marseille',
            valueEn: '49 quai de Lazaret, 13002 Marseille',
            contentType: 'text'
          },
          {
            section: 'contact',
            key: 'phone',
            valueFr: '514.667.0149',
            valueEn: '514.667.0149',
            contentType: 'text'
          },
          {
            section: 'contact',
            key: 'phone_fr',
            valueFr: '07.44.83.62.5',
            valueEn: '07.44.83.62.5',
            contentType: 'text'
          },
          
          // Section Footer
          {
            section: 'footer',
            key: 'copyright',
            valueFr: '© 2024 CynergyIQ. Tous droits réservés.',
            valueEn: '© 2024 CynergyIQ. All rights reserved.',
            contentType: 'text'
          }
        ];
        
        const created = [];
        const errors = [];
        
        for (const content of sampleContents) {
          try {
            const newContent = await SiteContent.create(content, req.user.id);
            created.push(newContent.toAdminJSON());
          } catch (error) {
            if (error.message.includes('existe déjà')) {
              // Mettre à jour si existe déjà
              try {
                const updated = await SiteContent.upsert(
                  content.section,
                  content.key,
                  content.valueFr,
                  content.valueEn,
                  content.contentType,
                  req.user.id
                );
                created.push(updated.toAdminJSON());
              } catch (updateError) {
                errors.push(`${content.section}.${content.key}: ${updateError.message}`);
              }
            } else {
              errors.push(`${content.section}.${content.key}: ${error.message}`);
            }
          }
        }
        
        res.status(201).json({
          success: true,
          message: `${created.length} contenus de test créés/mis à jour`,
          data: {
            contents: created,
            errors: errors.length > 0 ? errors : undefined
          }
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          message: 'Erreur lors de la création du contenu de test'
        });
      }
    }
  );

  // GET /api/content/dev/preview - Prévisualisation du site
  router.get('/dev/preview',
    async (req, res) => {
      try {
        const { language = 'fr' } = req.query;
        const { SiteContent } = await import('../models/SiteContent.js');
        
        const structure = await SiteContent.getSiteStructure(language);
        
        res.json({
          success: true,
          message: `Prévisualisation du site en ${language}`,
          data: {
            structure,
            language,
            timestamp: new Date().toISOString()
          }
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          message: 'Erreur lors de la prévisualisation'
        });
      }
    }
  );
}

// GET /api/content/:section/:key - Contenu spécifique (DOIT être EN DERNIER)
router.get('/:section/:key',
  rateLimit(200, 15 * 60 * 1000), // 200 requêtes par 15 minutes
  getContent
);

// ==================== GESTION D'ERREURS ====================

// Gestion des routes non trouvées
router.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route de contenu non trouvée: ${req.method} ${req.originalUrl}`
  });
});

export default router;