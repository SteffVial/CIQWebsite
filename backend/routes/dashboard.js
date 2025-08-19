// backend/routes/dashboard.js - VERSION CORRIGÉE
import express from 'express';
import { authenticateToken, requireRole } from '../middleware/auth.js'; // ✅ requireRole au lieu de requireRoles

const router = express.Router();

// GET /api/dashboard/stats
router.get('/stats', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    // Simuler des stats pour l'instant
    const stats = {
      totalArticles: 12,
      totalJobs: 5,
      totalSubscribers: 247,
      totalViews: 1840,
      articlesThisMonth: 3,
      jobsThisMonth: 1,
      subscribersThisMonth: 34,
      viewsThisMonth: 420
    };

    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Erreur récupération stats dashboard:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// GET /api/dashboard/activity
router.get('/activity', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    
    // Simuler des activités pour l'instant
    const activities = [
      {
        id: 1,
        type: 'blog',
        action: 'Article publié',
        title: 'Les tendances cybersécurité 2025',
        user: 'Admin',
        timestamp: new Date().toISOString()
      },
      {
        id: 2,
        type: 'job',
        action: 'Nouvelle offre',
        title: 'Développeur Full Stack',
        user: 'HR Manager',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 3,
        type: 'newsletter',
        action: 'Campagne envoyée',
        title: 'Newsletter mensuelle',
        user: 'Marketing',
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      }
    ].slice(0, limit);

    res.json({ success: true, data: activities });
  } catch (error) {
    console.error('Erreur récupération activités:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// GET /api/dashboard/analytics
router.get('/analytics', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const period = req.query.period || '30d';
    
    // Simuler des analytics
    const analytics = {
      period,
      pageViews: 1840,
      uniqueVisitors: 456,
      bounceRate: 0.34,
      avgSessionDuration: 245
    };

    res.json({ success: true, data: analytics });
  } catch (error) {
    console.error('Erreur récupération analytics:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

export default router;