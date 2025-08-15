import { JobOffer } from '../models/JobOffer.js';
import { JobApplication } from '../models/JobApplication.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Controller pour la gestion des offres d'emploi et candidatures
 */

// Configuration de multer pour l'upload de CV
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../uploads/resumes');
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
    const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, `resume-${uniqueSuffix}-${sanitizedName}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Type de fichier non autorisé. Utilisez PDF, DOC ou DOCX.'), false);
  }
};

export const uploadResume = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
  }
});

// ==================== GESTION DES OFFRES D'EMPLOI ====================

// Lister toutes les offres - GET /api/jobs
export const getAllJobs = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      language = 'fr',
      department,
      employmentType,
      experienceLevel,
      location,
      search,
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = req.query;

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      status,
      language,
      department,
      employmentType,
      experienceLevel,
      location,
      search,
      sortBy,
      sortOrder,
      includeCreator: req.user?.hasRole('admin') || req.user?.hasRole('careeradmin'),
      includeApplicationsCount: req.user?.hasRole('admin') || req.user?.hasRole('careeradmin'),
      includeExpired: req.user?.hasRole('admin') || req.user?.hasRole('careeradmin')
    };

    // Si pas admin/careeradmin, ne montrer que les offres actives
    if (!req.user?.hasRole('admin') && !req.user?.hasRole('careeradmin')) {
      options.status = 'active';
    }

    const result = await JobOffer.findAll(options);

    res.json({
      success: true,
      data: {
        jobs: result.jobs.map(job => 
          req.user?.hasRole('admin') || req.user?.hasRole('careeradmin')
            ? job.toJSON() 
            : job.toPublicJSON()
        ),
        pagination: result.pagination
      }
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des offres:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

// Obtenir une offre par ID - GET /api/jobs/:id
export const getJobById = async (req, res) => {
  try {
    const { id } = req.params;
    const includeDetails = req.user?.hasRole('admin') || req.user?.hasRole('careeradmin');
    
    const job = await JobOffer.findById(id, includeDetails);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Offre d\'emploi non trouvée'
      });
    }

    // Vérifier si l'offre est visible pour le public
    if (!includeDetails && job.status !== 'active') {
      return res.status(404).json({
        success: false,
        message: 'Offre d\'emploi non trouvée'
      });
    }

    res.json({
      success: true,
      data: {
        job: includeDetails ? job.toJSON() : job.toPublicJSON()
      }
    });

  } catch (error) {
    console.error('Erreur lors de la récupération de l\'offre:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

// Créer une nouvelle offre - POST /api/jobs
export const createJob = async (req, res) => {
  try {
    const jobData = req.body;
    
    // Valider les données requises
    if (!jobData.title || !jobData.description) {
      return res.status(400).json({
        success: false,
        message: 'Titre et description requis'
      });
    }

    // Créer l'offre
    const job = await JobOffer.create(jobData, req.user.id);

    res.status(201).json({
      success: true,
      message: 'Offre d\'emploi créée avec succès',
      data: {
        job: job.toJSON()
      }
    });

  } catch (error) {
    console.error('Erreur lors de la création de l\'offre:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erreur interne du serveur'
    });
  }
};

// Mettre à jour une offre - PUT /api/jobs/:id
export const updateJob = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const job = await JobOffer.findById(id);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Offre d\'emploi non trouvée'
      });
    }

    await job.update(updates);

    res.json({
      success: true,
      message: 'Offre d\'emploi mise à jour avec succès',
      data: {
        job: job.toJSON()
      }
    });

  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'offre:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

// Supprimer une offre - DELETE /api/jobs/:id
export const deleteJob = async (req, res) => {
  try {
    const { id } = req.params;

    const job = await JobOffer.findById(id);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Offre d\'emploi non trouvée'
      });
    }

    await job.delete();

    res.json({
      success: true,
      message: 'Offre d\'emploi supprimée avec succès'
    });

  } catch (error) {
    console.error('Erreur lors de la suppression de l\'offre:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

// Changer le statut d'une offre - POST /api/jobs/:id/status
export const updateJobStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['active', 'paused', 'closed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Statut invalide'
      });
    }

    const job = await JobOffer.findById(id);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Offre d\'emploi non trouvée'
      });
    }

    await job.update({ status });

    res.json({
      success: true,
      message: `Offre ${status === 'active' ? 'activée' : status === 'paused' ? 'mise en pause' : 'fermée'} avec succès`,
      data: {
        job: job.toJSON()
      }
    });

  } catch (error) {
    console.error('Erreur lors du changement de statut:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

// Rechercher des offres - GET /api/jobs/search
export const searchJobs = async (req, res) => {
  try {
    const { q: searchTerm, language = 'fr', department, employmentType, experienceLevel, location, limit = 20 } = req.query;

    if (!searchTerm) {
      return res.status(400).json({
        success: false,
        message: 'Terme de recherche requis'
      });
    }

    const filters = {
      language,
      department,
      employmentType,
      experienceLevel,
      location,
      limit: parseInt(limit)
    };

    const jobs = await JobOffer.search(searchTerm, filters);

    res.json({
      success: true,
      data: {
        jobs: jobs.map(job => job.toPublicJSON()),
        searchTerm,
        count: jobs.length
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

// Obtenir les statistiques par département - GET /api/jobs/stats/departments
export const getDepartmentStats = async (req, res) => {
  try {
    const { language = 'fr' } = req.query;
    const stats = await JobOffer.getDepartmentStats(language);

    res.json({
      success: true,
      data: {
        departments: stats
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

// ==================== GESTION DES CANDIDATURES ====================

// Postuler à une offre - POST /api/jobs/:id/apply
export const applyToJob = async (req, res) => {
  try {
    const { id: jobOfferId } = req.params;
    const applicationData = {
      ...req.body,
      jobOfferId
    };

    // Si un fichier CV a été uploadé, ajouter l'URL
    if (req.file) {
      applicationData.resumeUrl = `/uploads/resumes/${req.file.filename}`;
    }

    const application = await JobApplication.create(applicationData);

    res.status(201).json({
      success: true,
      message: 'Candidature soumise avec succès',
      data: {
        application: application.toPublicJSON()
      }
    });

  } catch (error) {
    console.error('Erreur lors de la candidature:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Erreur lors de la candidature'
    });
  }
};

// Lister les candidatures d'une offre - GET /api/jobs/:id/applications
export const getJobApplications = async (req, res) => {
  try {
    const { id: jobOfferId } = req.params;
    const {
      page = 1,
      limit = 10,
      status,
      sortBy = 'applied_at',
      sortOrder = 'DESC'
    } = req.query;

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      jobOfferId,
      status,
      sortBy,
      sortOrder,
      includeJobOffer: true,
      includeReviewer: true
    };

    const result = await JobApplication.findAll(options);

    res.json({
      success: true,
      data: {
        applications: result.applications.map(app => app.toHRJSON()),
        pagination: result.pagination
      }
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des candidatures:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

// Obtenir une candidature par ID - GET /api/jobs/applications/:applicationId
export const getApplicationById = async (req, res) => {
  try {
    const { applicationId } = req.params;
    
    const application = await JobApplication.findById(applicationId, true, true);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Candidature non trouvée'
      });
    }

    res.json({
      success: true,
      data: {
        application: application.toJSON()
      }
    });

  } catch (error) {
    console.error('Erreur lors de la récupération de la candidature:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

// Mettre à jour le statut d'une candidature - PUT /api/jobs/applications/:applicationId/status
export const updateApplicationStatus = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { status, notes } = req.body;

    const application = await JobApplication.findById(applicationId);
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Candidature non trouvée'
      });
    }

    await application.updateStatus(status, req.user.id, notes);

    res.json({
      success: true,
      message: 'Statut de la candidature mis à jour avec succès',
      data: {
        application: application.toHRJSON()
      }
    });

  } catch (error) {
    console.error('Erreur lors de la mise à jour du statut:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Erreur interne du serveur'
    });
  }
};

// Lister toutes les candidatures (admin/HR) - GET /api/jobs/applications
export const getAllApplications = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      email,
      sortBy = 'applied_at',
      sortOrder = 'DESC'
    } = req.query;

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      status,
      email,
      sortBy,
      sortOrder,
      includeJobOffer: true,
      includeReviewer: true
    };

    const result = await JobApplication.findAll(options);

    res.json({
      success: true,
      data: {
        applications: result.applications.map(app => app.toHRJSON()),
        pagination: result.pagination
      }
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des candidatures:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

// Obtenir les statistiques des candidatures - GET /api/jobs/stats/applications
export const getApplicationsStats = async (req, res) => {
  try {
    const { jobOfferId } = req.query;

    if (jobOfferId) {
      // Stats pour une offre spécifique
      const stats = await JobApplication.getStatsByJobOffer(jobOfferId);
      res.json({
        success: true,
        data: {
          jobOfferId,
          stats
        }
      });
    } else {
      // Stats générales
      const recentApplications = await JobApplication.getRecentApplications(10);
      res.json({
        success: true,
        data: {
          recentApplications: recentApplications.map(app => app.toHRJSON())
        }
      });
    }

  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};