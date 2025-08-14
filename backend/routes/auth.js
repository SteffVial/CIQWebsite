import express from 'express';
import {
  login,
  logout,
  getCurrentUser,
  changePassword,
  refreshToken,
  resetUserPassword,
  verifyToken
} from '../controllers/authController.js';
import {
  authenticateToken,
  requireAdmin,
  rateLimit,
  validateUUID,
  logActivity,
  writeActivityLog
} from '../middleware/auth.js';

const router = express.Router();

// Routes publiques (pas d'authentification requise)

// POST /api/auth/login - Connexion
router.post('/login', 
  rateLimit(5, 15 * 60 * 1000), // 5 tentatives par 15 minutes
  logActivity('login'),
  writeActivityLog,
  login
);

// POST /api/auth/refresh - Rafraîchir le token
router.post('/refresh', 
  rateLimit(10, 15 * 60 * 1000), // 10 refresh par 15 minutes
  refreshToken
);

// Routes protégées (authentification requise)

// POST /api/auth/logout - Déconnexion
router.post('/logout', 
  authenticateToken,
  logActivity('logout'),
  writeActivityLog,
  logout
);

// GET /api/auth/me - Obtenir l'utilisateur actuel
router.get('/me', 
  authenticateToken,
  getCurrentUser
);

// GET /api/auth/verify - Vérifier la validité du token
router.get('/verify', 
  authenticateToken,
  verifyToken
);

// POST /api/auth/change-password - Changer son mot de passe
router.post('/change-password', 
  authenticateToken,
  rateLimit(3, 60 * 60 * 1000), // 3 changements par heure max
  logActivity('change_password'),
  writeActivityLog,
  changePassword
);

// Routes admin uniquement

// POST /api/auth/reset-password/:userId - Réinitialiser le mot de passe d'un utilisateur (admin)
router.post('/reset-password/:userId', 
  authenticateToken,
  requireAdmin,
  validateUUID('userId'),
  rateLimit(10, 60 * 60 * 1000), // 10 resets par heure max
  logActivity('reset_password', 'user'),
  writeActivityLog,
  resetUserPassword
);

// Routes de développement (à supprimer en production)
if (process.env.NODE_ENV === 'development') {
  
  // GET /api/auth/dev/users - Lister tous les utilisateurs (dev only)
  router.get('/dev/users', 
    authenticateToken,
    requireAdmin,
    async (req, res) => {
      try {
        const { User } = await import('../models/User.js');
        const users = await User.findAll({ limit: 50 });
        
        res.json({
          success: true,
          data: {
            users: users.map(user => user.toJSON()),
            count: users.length
          }
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          message: 'Erreur lors de la récupération des utilisateurs'
        });
      }
    }
  );

  // POST /api/auth/dev/create-user - Créer un utilisateur (dev only)
  router.post('/dev/create-user', 
    authenticateToken,
    requireAdmin,
    async (req, res) => {
      try {
        const { User } = await import('../models/User.js');
        const user = await User.create(req.body);
        
        res.status(201).json({
          success: true,
          message: 'Utilisateur créé avec succès',
          data: {
            user: user.toJSON()
          }
        });
      } catch (error) {
        res.status(400).json({
          success: false,
          message: error.message
        });
      }
    }
  );
}

// Route de test de santé pour l'authentification
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Service d\'authentification opérationnel',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Gestion d'erreur pour les routes non trouvées
router.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route d'authentification non trouvée: ${req.method} ${req.originalUrl}`
  });
});

export default router;