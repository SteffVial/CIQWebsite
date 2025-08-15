import express from 'express';
import {
  subscribe,
  unsubscribe,
  resubscribe,
  confirmSubscription,
  checkStatus,
  getAllSubscribers,
  getStats,
  getSubscriberById,
  updateSubscriber,
  deleteSubscriber,
  exportSubscribers,
  searchSubscribers,
  cleanupOldSubscribers,
  sendTestEmail
} from '../controllers/newsletterController.js';
import {
  authenticateToken,
  requireAdmin,
  rateLimit,
  validateUUID,
  logActivity,
  writeActivityLog
} from '../middleware/auth.js';

const router = express.Router();

// ==================== ROUTES PUBLIQUES ====================

// GET /api/newsletter/health - Santé du service
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Service newsletter opérationnel',
    timestamp: new Date().toISOString(),
    features: [
      'Inscription newsletter',
      'Désinscription en un clic',
      'Double opt-in',
      'Gestion RGPD',
      'Support multilingue',
      'Statistiques admin',
      'Export CSV/JSON'
    ]
  });
});

// POST /api/newsletter/subscribe - S'abonner à la newsletter
router.post('/subscribe',
  rateLimit(5, 15 * 60 * 1000), // 5 inscriptions par 15 minutes par IP
  logActivity('subscribe', 'newsletter'),
  writeActivityLog,
  subscribe
);

// POST /api/newsletter/unsubscribe/:token - Se désabonner (un clic)
router.post('/unsubscribe/:token',
  rateLimit(10, 60 * 60 * 1000), // 10 désinscriptions par heure
  logActivity('unsubscribe', 'newsletter'),
  writeActivityLog,
  unsubscribe
);

// GET /api/newsletter/unsubscribe/:token - Page de désinscription (pour liens email)
router.get('/unsubscribe/:token', 
  rateLimit(20, 60 * 60 * 1000),
  async (req, res) => {
    try {
      // Pour les liens dans les emails, on peut renvoyer une page HTML
      // ou rediriger vers le frontend avec le token
      const { token } = req.params;
      
      // Option 1: Redirection vers le frontend
      const frontendUrl = process.env.CLIENT_URL || 'http://localhost:3000';
      res.redirect(`${frontendUrl}/unsubscribe/${token}`);
      
      // Option 2: Page HTML simple (décommenter si préféré)
      /*
      res.send(`
        <html>
          <head><title>Désinscription Newsletter - CynergyIQ</title></head>
          <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
            <h2>Désinscription Newsletter</h2>
            <p>Cliquez sur le bouton ci-dessous pour vous désabonner de notre newsletter.</p>
            <form method="POST" action="/api/newsletter/unsubscribe/${token}">
              <button type="submit" style="background: #dc2626; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer;">
                Se désabonner
              </button>
            </form>
            <p><small>CynergyIQ - Respect de votre vie privée</small></p>
          </body>
        </html>
      `);
      */
    } catch (error) {
      res.status(500).send('Erreur lors de la désinscription');
    }
  }
);

// POST /api/newsletter/resubscribe/:token - Se réabonner
router.post('/resubscribe/:token',
  rateLimit(5, 60 * 60 * 1000), // 5 réabonnements par heure
  logActivity('resubscribe', 'newsletter'),
  writeActivityLog,
  resubscribe
);

// GET /api/newsletter/confirm/:token - Confirmer l'abonnement (double opt-in)
router.get('/confirm/:token',
  rateLimit(10, 60 * 60 * 1000),
  logActivity('confirm', 'newsletter'),
  writeActivityLog,
  confirmSubscription
);

// GET /api/newsletter/status/:email - Vérifier le statut d'un email
router.get('/status/:email',
  rateLimit(10, 15 * 60 * 1000), // 10 vérifications par 15 minutes
  checkStatus
);

// ==================== ROUTES ADMIN ====================

// GET /api/newsletter/admin/subscribers - Lister tous les abonnés
router.get('/admin/subscribers',
  authenticateToken,
  requireAdmin,
  rateLimit(30, 15 * 60 * 1000),
  getAllSubscribers
);

// GET /api/newsletter/admin/stats - Statistiques de la newsletter
router.get('/admin/stats',
  authenticateToken,
  requireAdmin,
  rateLimit(20, 15 * 60 * 1000),
  getStats
);

// GET /api/newsletter/admin/search - Rechercher des abonnés
router.get('/admin/search',
  authenticateToken,
  requireAdmin,
  rateLimit(20, 15 * 60 * 1000),
  searchSubscribers
);

// GET /api/newsletter/admin/export - Exporter les abonnés
router.get('/admin/export',
  authenticateToken,
  requireAdmin,
  rateLimit(5, 60 * 60 * 1000), // 5 exports par heure
  logActivity('export', 'newsletter'),
  writeActivityLog,
  exportSubscribers
);

// GET /api/newsletter/admin/subscribers/:id - Obtenir un abonné par ID
router.get('/admin/subscribers/:id',
  authenticateToken,
  requireAdmin,
  validateUUID('id'),
  rateLimit(50, 15 * 60 * 1000),
  getSubscriberById
);

// PUT /api/newsletter/admin/subscribers/:id - Mettre à jour un abonné
router.put('/admin/subscribers/:id',
  authenticateToken,
  requireAdmin,
  validateUUID('id'),
  rateLimit(20, 60 * 60 * 1000),
  logActivity('update', 'newsletter_subscriber'),
  writeActivityLog,
  updateSubscriber
);

// DELETE /api/newsletter/admin/subscribers/:id - Supprimer un abonné (RGPD)
router.delete('/admin/subscribers/:id',
  authenticateToken,
  requireAdmin,
  validateUUID('id'),
  rateLimit(10, 60 * 60 * 1000), // 10 suppressions par heure
  logActivity('delete_gdpr', 'newsletter_subscriber'),
  writeActivityLog,
  deleteSubscriber
);

// POST /api/newsletter/admin/cleanup - Nettoyer les anciens désabonnés
router.post('/admin/cleanup',
  authenticateToken,
  requireAdmin,
  rateLimit(2, 24 * 60 * 60 * 1000), // 2 nettoyages par jour max
  logActivity('cleanup', 'newsletter'),
  writeActivityLog,
  cleanupOldSubscribers
);

// POST /api/newsletter/admin/test-email - Envoyer un email de test
router.post('/admin/test-email',
  authenticateToken,
  requireAdmin,
  rateLimit(10, 60 * 60 * 1000), // 10 emails de test par heure
  logActivity('test_email', 'newsletter'),
  writeActivityLog,
  sendTestEmail
);

// ==================== ROUTES DE DÉVELOPPEMENT ====================

if (process.env.NODE_ENV === 'development') {
  
  // POST /api/newsletter/dev/bulk-subscribe - Créer des abonnés de test
  router.post('/dev/bulk-subscribe',
    authenticateToken,
    requireAdmin,
    async (req, res) => {
      try {
        const { count = 10, language = 'fr' } = req.body;
        const { NewsletterSubscriber } = await import('../models/Newsletter.js');
        
        const createdSubscribers = [];
        const domains = ['example.com', 'test.fr', 'demo.ca'];
        const firstNames = ['Jean', 'Marie', 'Pierre', 'Sophie', 'Alexandre', 'Julie', 'Marc', 'Isabelle'];
        const lastNames = ['Dupont', 'Martin', 'Bernard', 'Dubois', 'Thomas', 'Robert', 'Petit', 'Durand'];
        
        for (let i = 1; i <= count; i++) {
          const firstName = firstNames[i % firstNames.length];
          const lastName = lastNames[i % lastNames.length];
          const domain = domains[i % domains.length];
          
          const subscriberData = {
            email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@${domain}`,
            firstName,
            lastName,
            language
          };
          
          try {
            const subscriber = await NewsletterSubscriber.create(subscriberData);
            
            // Confirmer quelques abonnements aléatoirement
            if (Math.random() > 0.3) {
              await subscriber.confirm();
            }
            
            createdSubscribers.push(subscriber.toAdminJSON());
          } catch (error) {
            console.warn(`Erreur création abonné ${subscriberData.email}:`, error.message);
          }
        }
        
        res.status(201).json({
          success: true,
          message: `${createdSubscribers.length} abonnés de test créés`,
          data: {
            subscribers: createdSubscribers,
            count: createdSubscribers.length
          }
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          message: 'Erreur lors de la création des abonnés de test'
        });
      }
    }
  );

  // GET /api/newsletter/dev/test-tokens - Obtenir des tokens de test
  router.get('/dev/test-tokens',
    authenticateToken,
    requireAdmin,
    async (req, res) => {
      try {
        const { NewsletterSubscriber } = await import('../models/Newsletter.js');
        
        const subscribers = await NewsletterSubscriber.findAll({ limit: 5 });
        
        const tokens = subscribers.subscribers.map(sub => ({
          email: sub.email,
          unsubscribeToken: sub.unsubscribeToken,
          unsubscribeUrl: sub.getUnsubscribeUrl(),
          confirmUrl: `${process.env.CLIENT_URL || 'http://localhost:3000'}/newsletter/confirm/${sub.unsubscribeToken}`
        }));
        
        res.json({
          success: true,
          message: 'Tokens de test pour développement',
          data: {
            tokens,
            note: 'Utilisez ces tokens pour tester la désinscription et confirmation'
          }
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          message: 'Erreur lors de la récupération des tokens'
        });
      }
    }
  );
}

// ==================== GESTION D'ERREURS ====================

// Gestion des routes non trouvées
router.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route de newsletter non trouvée: ${req.method} ${req.originalUrl}`
  });
});

export default router;