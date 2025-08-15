import express from 'express';
import {
  getAllJobs,
  getJobById,
  createJob,
  updateJob,
  deleteJob,
  updateJobStatus,
  searchJobs,
  getDepartmentStats,
  applyToJob,
  getJobApplications,
  getApplicationById,
  updateApplicationStatus,
  getAllApplications,
  getApplicationsStats,
  uploadResume
} from '../controllers/jobsController.js';
import {
  authenticateToken,
  requireCareerAdmin,
  optionalAuth,
  rateLimit,
  validateUUID,
  logActivity,
  writeActivityLog
} from '../middleware/auth.js';

const router = express.Router();

// ==================== ROUTES PUBLIQUES (OFFRES D'EMPLOI) ====================

// GET /api/jobs/health - Santé du service
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Service carrières opérationnel',
    timestamp: new Date().toISOString(),
    features: [
      'CRUD offres d\'emploi',
      'Système de candidatures',
      'Upload de CV',
      'Gestion des statuts',
      'Recherche et filtres',
      'Statistiques RH',
      'Support multilingue'
    ]
  });
});

// GET /api/jobs/search - Rechercher des offres
router.get('/search',
  rateLimit(30, 15 * 60 * 1000), // 30 recherches par 15 minutes
  searchJobs
);

// GET /api/jobs/stats/departments - Statistiques par département
router.get('/stats/departments',
  rateLimit(10, 15 * 60 * 1000),
  getDepartmentStats
);

// GET /api/jobs - Lister toutes les offres (publiques ou toutes si admin)
router.get('/',
  optionalAuth, // Auth optionnelle pour différencier public/admin
  rateLimit(60, 15 * 60 * 1000), // 60 requêtes par 15 minutes
  getAllJobs
);

// GET /api/jobs/:id - Obtenir une offre par ID
router.get('/:id',
  optionalAuth,
  validateUUID('id'),
  rateLimit(100, 15 * 60 * 1000),
  getJobById
);

// POST /api/jobs/:id/apply - Postuler à une offre (public)
router.post('/:id/apply',
  validateUUID('id'),
  rateLimit(3, 60 * 60 * 1000), // 3 candidatures par heure max
  uploadResume.single('resume'), // Middleware multer pour l'upload de CV
  logActivity('apply', 'job_application'),
  writeActivityLog,
  applyToJob
);

// ==================== ROUTES PROTÉGÉES (GESTION DES OFFRES) ====================

// POST /api/jobs - Créer une nouvelle offre
router.post('/',
  authenticateToken,
  requireCareerAdmin,
  rateLimit(10, 60 * 60 * 1000), // 10 créations par heure
  logActivity('create', 'job_offer'),
  writeActivityLog,
  createJob
);

// PUT /api/jobs/:id - Mettre à jour une offre
router.put('/:id',
  authenticateToken,
  requireCareerAdmin,
  validateUUID('id'),
  rateLimit(20, 60 * 60 * 1000), // 20 mises à jour par heure
  logActivity('update', 'job_offer'),
  writeActivityLog,
  updateJob
);

// DELETE /api/jobs/:id - Supprimer une offre
router.delete('/:id',
  authenticateToken,
  requireCareerAdmin,
  validateUUID('id'),
  rateLimit(5, 60 * 60 * 1000), // 5 suppressions par heure
  logActivity('delete', 'job_offer'),
  writeActivityLog,
  deleteJob
);

// POST /api/jobs/:id/status - Changer le statut d'une offre
router.post('/:id/status',
  authenticateToken,
  requireCareerAdmin,
  validateUUID('id'),
  rateLimit(20, 60 * 60 * 1000),
  logActivity('update_status', 'job_offer'),
  writeActivityLog,
  updateJobStatus
);

// ==================== ROUTES PROTÉGÉES (GESTION DES CANDIDATURES) ====================

// GET /api/jobs/applications - Lister toutes les candidatures (admin/HR)
router.get('/applications/all',
  authenticateToken,
  requireCareerAdmin,
  rateLimit(30, 15 * 60 * 1000),
  getAllApplications
);

// GET /api/jobs/applications/stats - Statistiques des candidatures
router.get('/applications/stats',
  authenticateToken,
  requireCareerAdmin,
  rateLimit(20, 15 * 60 * 1000),
  getApplicationsStats
);

// GET /api/jobs/applications/:applicationId - Obtenir une candidature par ID
router.get('/applications/:applicationId',
  authenticateToken,
  requireCareerAdmin,
  validateUUID('applicationId'),
  rateLimit(50, 15 * 60 * 1000),
  getApplicationById
);

// PUT /api/jobs/applications/:applicationId/status - Mettre à jour le statut d'une candidature
router.put('/applications/:applicationId/status',
  authenticateToken,
  requireCareerAdmin,
  validateUUID('applicationId'),
  rateLimit(30, 60 * 60 * 1000),
  logActivity('update_status', 'job_application'),
  writeActivityLog,
  updateApplicationStatus
);

// GET /api/jobs/:id/applications - Lister les candidatures d'une offre spécifique
router.get('/:id/applications',
  authenticateToken,
  requireCareerAdmin,
  validateUUID('id'),
  rateLimit(30, 15 * 60 * 1000),
  getJobApplications
);

// ==================== ROUTES DE DÉVELOPPEMENT ====================

if (process.env.NODE_ENV === 'development') {
  
  // POST /api/jobs/dev/bulk-create - Créer des offres de test (dev only)
  router.post('/dev/bulk-create',
    authenticateToken,
    requireCareerAdmin,
    async (req, res) => {
      try {
        const { count = 5, language = 'fr' } = req.body;
        const { JobOffer } = await import('../models/JobOffer.js');
        
        const createdJobs = [];
        const departments = ['Cybersécurité', 'Développement', 'Consulting', 'Support', 'RH'];
        const locations = ['Montréal', 'Toronto', 'Vancouver', 'Télétravail'];
        const employmentTypes = ['full-time', 'part-time', 'contract'];
        const experienceLevels = ['entry', 'mid', 'senior'];
        
        for (let i = 1; i <= count; i++) {
          const jobData = {
            title: `${departments[i % departments.length]} Specialist ${i}`,
            department: departments[i % departments.length],
            location: locations[i % locations.length],
            employmentType: employmentTypes[i % employmentTypes.length],
            experienceLevel: experienceLevels[i % experienceLevels.length],
            description: `<p>Nous recherchons un spécialiste en ${departments[i % departments.length]} pour rejoindre notre équipe dynamique.</p><p>Vous serez responsable de...</p>`,
            requirements: `<ul><li>Diplôme en informatique ou équivalent</li><li>Expérience pertinente</li><li>Excellentes compétences en communication</li></ul>`,
            benefits: `<ul><li>Assurance santé complète</li><li>Télétravail flexible</li><li>Formation continue</li></ul>`,
            salaryRange: '50,000$ - 80,000$ CAD',
            status: i % 3 === 0 ? 'paused' : 'active',
            language,
            applicationDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 jours
          };
          
          const job = await JobOffer.create(jobData, req.user.id);
          createdJobs.push(job.toJSON());
        }
        
        res.status(201).json({
          success: true,
          message: `${count} offres d'emploi de test créées`,
          data: {
            jobs: createdJobs
          }
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          message: 'Erreur lors de la création des offres de test'
        });
      }
    }
  );

  // POST /api/jobs/dev/bulk-applications - Créer des candidatures de test
  router.post('/dev/bulk-applications',
    authenticateToken,
    requireCareerAdmin,
    async (req, res) => {
      try {
        const { jobId, count = 3 } = req.body;
        const { JobApplication } = await import('../models/JobApplication.js');
        
        if (!jobId) {
          return res.status(400).json({
            success: false,
            message: 'jobId requis'
          });
        }
        
        const createdApplications = [];
        const firstNames = ['Jean', 'Marie', 'Pierre', 'Sophie', 'Alexandre'];
        const lastNames = ['Dupont', 'Martin', 'Bernard', 'Dubois', 'Thomas'];
        
        for (let i = 1; i <= count; i++) {
          const applicationData = {
            jobOfferId: jobId,
            firstName: firstNames[i % firstNames.length],
            lastName: lastNames[i % lastNames.length],
            email: `candidat${i}@example.com`,
            phone: `+1-514-555-${String(1000 + i).slice(-4)}`,
            coverLetter: `Madame, Monsieur,\n\nJe vous écris pour exprimer mon intérêt pour le poste proposé. Mon expérience et mes compétences correspondent parfaitement aux exigences...\n\nCordialement,\n${firstNames[i % firstNames.length]} ${lastNames[i % lastNames.length]}`,
            availabilityDate: new Date(Date.now() + Math.random() * 60 * 24 * 60 * 60 * 1000), // 0-60 jours
            salaryExpectation: `${40000 + Math.floor(Math.random() * 40000)}$ CAD`
          };
          
          const application = await JobApplication.create(applicationData);
          createdApplications.push(application.toJSON());
        }
        
        res.status(201).json({
          success: true,
          message: `${count} candidatures de test créées`,
          data: {
            applications: createdApplications
          }
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          message: error.message || 'Erreur lors de la création des candidatures de test'
        });
      }
    }
  );

  // GET /api/jobs/dev/stats - Statistiques générales (dev only)
  router.get('/dev/stats',
    authenticateToken,
    requireCareerAdmin,
    async (req, res) => {
      try {
        const { query } = await import('../config/database.js');
        
        const jobStats = await query(`
          SELECT 
            COUNT(*) as total_jobs,
            COUNT(*) FILTER (WHERE status = 'active') as active_jobs,
            COUNT(*) FILTER (WHERE status = 'paused') as paused_jobs,
            COUNT(*) FILTER (WHERE status = 'closed') as closed_jobs,
            COUNT(DISTINCT department) as unique_departments,
            COUNT(DISTINCT location) as unique_locations
          FROM job_offers
        `);

        const applicationStats = await query(`
          SELECT 
            COUNT(*) as total_applications,
            COUNT(*) FILTER (WHERE status = 'pending') as pending_applications,
            COUNT(*) FILTER (WHERE status = 'reviewed') as reviewed_applications,
            COUNT(*) FILTER (WHERE status = 'hired') as hired_applications,
            COUNT(*) FILTER (WHERE status = 'rejected') as rejected_applications,
            AVG(EXTRACT(DAY FROM (COALESCE(reviewed_at, CURRENT_TIMESTAMP) - applied_at))) as avg_review_time_days
          FROM job_applications
        `);

        const topDepartments = await query(`
          SELECT department, COUNT(*) as job_count
          FROM job_offers
          WHERE status = 'active'
          GROUP BY department
          ORDER BY job_count DESC
          LIMIT 5
        `);

        res.json({
          success: true,
          data: {
            jobs: jobStats.rows[0],
            applications: applicationStats.rows[0],
            topDepartments: topDepartments.rows
          }
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          message: 'Erreur lors de la récupération des statistiques'
        });
      }
    }
  );
}

// ==================== MIDDLEWARE DE GESTION D'ERREURS ====================

// Middleware de gestion d'erreur pour multer (upload de CV)
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'Fichier trop volumineux (max 10MB)'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Trop de fichiers'
      });
    }
  }
  
  if (error.message.includes('Type de fichier non autorisé')) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
  
  next(error);
});

// Gestion des routes non trouvées
router.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route de carrières non trouvée: ${req.method} ${req.originalUrl}`
  });
});

export default router;