import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';

/**
 * Middleware d'authentification JWT pour CynergyIQ
 * Gère les tokens, les rôles et les permissions
 */

// Middleware pour vérifier le token JWT
export const authenticateToken = async (req, res, next) => {
  try {
    // Récupérer le token depuis l'header Authorization
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token d\'accès requis'
      });
    }

    // Vérifier et décoder le token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Récupérer l'utilisateur depuis la base de données
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Compte utilisateur désactivé'
      });
    }

    // Attacher l'utilisateur à la requête
    req.user = user;
    next();

  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expiré'
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Token invalide'
      });
    }

    console.error('Erreur middleware auth:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

// Middleware pour vérifier les rôles spécifiques
export const requireRole = (requiredRoles) => {
  return (req, res, next) => {
    // S'assurer que l'utilisateur est authentifié
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentification requise'
      });
    }

    // Convertir en array si ce n'est pas déjà le cas
    const rolesArray = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
    
    // Vérifier si l'utilisateur a au moins un des rôles requis
    const hasRequiredRole = rolesArray.some(role => req.user.hasRole(role));
    
    if (!hasRequiredRole) {
      return res.status(403).json({
        success: false,
        message: 'Permissions insuffisantes',
        requiredRoles: rolesArray,
        userRoles: req.user.roles
      });
    }

    next();
  };
};

// Middleware pour vérifier les permissions admin
export const requireAdmin = requireRole('admin');

// Middleware pour vérifier les permissions blog
export const requireBlogAdmin = requireRole(['admin', 'blogadmin']);

// Middleware pour vérifier les permissions carrières
export const requireCareerAdmin = requireRole(['admin', 'careeradmin']);

// Middleware pour vérifier les permissions contenu
export const requireContentAdmin = requireRole(['admin', 'contentadmin']);

// Middleware optionnel - n'échoue pas si pas de token
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId);
      
      if (user && user.isActive) {
        req.user = user;
      }
    }
    
    // Continue même sans token valide
    next();

  } catch (error) {
    // Continue même en cas d'erreur (token optionnel)
    next();
  }
};

// Middleware pour logger les activités (audit trail)
export const logActivity = (action, entityType = null) => {
  return async (req, res, next) => {
    // Stocker les infos pour le log après la réponse
    req.activityLog = {
      action,
      entityType,
      userId: req.user?.id || null,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent')
    };
    
    next();
  };
};

// Middleware pour écrire les logs d'activité après la réponse
export const writeActivityLog = async (req, res, next) => {
  // Exécuter le middleware suivant d'abord
  next();
  
  // Écrire le log après la réponse (si configuré)
  if (req.activityLog && res.statusCode < 400) {
    try {
      const { query } = await import('../config/database.js');
      
      await query(`
        INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details, ip_address)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [
        req.activityLog.userId,
        req.activityLog.action,
        req.activityLog.entityType,
        req.params.id || null,
        JSON.stringify({
          method: req.method,
          url: req.originalUrl,
          userAgent: req.activityLog.userAgent,
          statusCode: res.statusCode
        }),
        req.activityLog.ipAddress
      ]);
    } catch (error) {
      console.error('Erreur lors de l\'écriture du log d\'activité:', error);
    }
  }
};

// Middleware pour valider les IDs UUID
export const validateUUID = (paramName = 'id') => {
  return (req, res, next) => {
    const uuid = req.params[paramName];
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    
    if (!uuid || !uuidRegex.test(uuid)) {
      return res.status(400).json({
        success: false,
        message: `ID invalide: ${paramName}`
      });
    }
    
    next();
  };
};

// Middleware pour limiter le taux de requêtes (simple)
const requestCounts = new Map();

export const rateLimit = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
  return (req, res, next) => {
    const clientId = req.ip || 'unknown';
    const now = Date.now();
    const windowStart = now - windowMs;
    
    // Nettoyer les anciennes entrées
    if (requestCounts.has(clientId)) {
      const requests = requestCounts.get(clientId).filter(time => time > windowStart);
      requestCounts.set(clientId, requests);
    } else {
      requestCounts.set(clientId, []);
    }
    
    const currentRequests = requestCounts.get(clientId);
    
    if (currentRequests.length >= maxRequests) {
      return res.status(429).json({
        success: false,
        message: 'Trop de requêtes, réessayez plus tard',
        retryAfter: Math.ceil(windowMs / 1000)
      });
    }
    
    currentRequests.push(now);
    next();
  };
};