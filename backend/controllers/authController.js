import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { validatePassword, generateTemporaryPassword } from '../utils/password.js';

/**
 * Controller d'authentification pour CynergyIQ
 * Gère login, logout, changement de mot de passe, etc.
 */

// Configuration JWT
const JWT_EXPIRES_IN = '24h';
const JWT_REFRESH_EXPIRES_IN = '7d';

// Générer un token JWT
const generateToken = (userId, expiresIn = JWT_EXPIRES_IN) => {
  return jwt.sign(
    { userId, type: 'access' },
    process.env.JWT_SECRET,
    { expiresIn }
  );
};

// Générer un refresh token
const generateRefreshToken = (userId) => {
  return jwt.sign(
    { userId, type: 'refresh' },
    process.env.JWT_SECRET,
    { expiresIn: JWT_REFRESH_EXPIRES_IN }
  );
};

// Login - POST /api/auth/login
export const login = async (req, res) => {
  try {
    const { username, password, rememberMe = false } = req.body;

    // Validation des données
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username et mot de passe requis'
      });
    }

    // Rechercher l'utilisateur (par username ou email)
    let user = await User.findByUsername(username);
    if (!user) {
      user = await User.findByEmail(username);
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Identifiants invalides'
      });
    }

    // Vérifier le mot de passe
    const isPasswordValid = await user.verifyPassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Identifiants invalides'
      });
    }

    // Vérifier si le compte est actif
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Compte désactivé'
      });
    }

    // Mettre à jour le dernier login
    await user.updateLastLogin();

    // Générer les tokens
    const expiresIn = rememberMe ? '30d' : JWT_EXPIRES_IN;
    const accessToken = generateToken(user.id, expiresIn);
    const refreshToken = generateRefreshToken(user.id);

    // Réponse de succès
    res.json({
      success: true,
      message: 'Connexion réussie',
      data: {
        user: user.toJSON(),
        accessToken,
        refreshToken,
        expiresIn
      }
    });

  } catch (error) {
    console.error('Erreur lors de la connexion:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

// Logout - POST /api/auth/logout
export const logout = async (req, res) => {
  try {
    // Dans une implémentation complète, on pourrait blacklister le token
    // Pour l'instant, on fait juste une réponse de succès
    res.json({
      success: true,
      message: 'Déconnexion réussie'
    });

  } catch (error) {
    console.error('Erreur lors de la déconnexion:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

// Obtenir l'utilisateur actuel - GET /api/auth/me
export const getCurrentUser = async (req, res) => {
  try {
    // L'utilisateur est déjà attaché via le middleware authenticateToken
    res.json({
      success: true,
      data: {
        user: req.user.toJSON()
      }
    });

  } catch (error) {
    console.error('Erreur lors de la récupération de l\'utilisateur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

// Changer le mot de passe - POST /api/auth/change-password
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Validation des données
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Mot de passe actuel et nouveau mot de passe requis'
      });
    }

    // Vérifier le mot de passe actuel
    const isCurrentPasswordValid = await req.user.verifyPassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Mot de passe actuel incorrect'
      });
    }

    // Valider le nouveau mot de passe
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Nouveau mot de passe invalide',
        errors: passwordValidation.errors
      });
    }

    // Changer le mot de passe
    await req.user.changePassword(newPassword);

    res.json({
      success: true,
      message: 'Mot de passe changé avec succès'
    });

  } catch (error) {
    console.error('Erreur lors du changement de mot de passe:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

// Rafraîchir le token - POST /api/auth/refresh
export const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token requis'
      });
    }

    // Vérifier le refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
    
    if (decoded.type !== 'refresh') {
      return res.status(401).json({
        success: false,
        message: 'Token invalide'
      });
    }

    // Récupérer l'utilisateur
    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non trouvé ou inactif'
      });
    }

    // Générer de nouveaux tokens
    const newAccessToken = generateToken(user.id);
    const newRefreshToken = generateRefreshToken(user.id);

    res.json({
      success: true,
      data: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken
      }
    });

  } catch (error) {
    if (error.name === 'TokenExpiredError' || error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Refresh token invalide ou expiré'
      });
    }

    console.error('Erreur lors du rafraîchissement du token:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

// Réinitialiser le mot de passe (admin seulement) - POST /api/auth/reset-password/:userId
export const resetUserPassword = async (req, res) => {
  try {
    const { userId } = req.params;
    const { temporaryPassword } = req.body;

    // Vérifier les permissions admin
    if (!req.user.hasRole('admin')) {
      return res.status(403).json({
        success: false,
        message: 'Permissions administrateur requises'
      });
    }

    // Trouver l'utilisateur
    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    // Générer ou utiliser le mot de passe fourni
    const newPassword = temporaryPassword || generateTemporaryPassword(12);

    // Valider le nouveau mot de passe
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Mot de passe temporaire invalide',
        errors: passwordValidation.errors
      });
    }

    // Changer le mot de passe
    await targetUser.changePassword(newPassword);

    res.json({
      success: true,
      message: 'Mot de passe réinitialisé avec succès',
      data: {
        temporaryPassword: newPassword,
        userId: targetUser.id,
        username: targetUser.username
      }
    });

  } catch (error) {
    console.error('Erreur lors de la réinitialisation du mot de passe:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

// Vérifier le token - GET /api/auth/verify
export const verifyToken = async (req, res) => {
  try {
    // Si on arrive ici, c'est que le token est valide (middleware authenticateToken)
    res.json({
      success: true,
      message: 'Token valide',
      data: {
        user: req.user.toJSON()
      }
    });

  } catch (error) {
    console.error('Erreur lors de la vérification du token:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};