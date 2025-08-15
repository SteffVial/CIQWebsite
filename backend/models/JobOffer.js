import { query } from '../config/database.js';

export class JobOffer {
  constructor(jobData) {
    this.id = jobData.id;
    this.title = jobData.title;
    this.department = jobData.department;
    this.location = jobData.location;
    this.employmentType = jobData.employment_type;
    this.experienceLevel = jobData.experience_level;
    this.description = jobData.description;
    this.requirements = jobData.requirements;
    this.benefits = jobData.benefits;
    this.salaryRange = jobData.salary_range;
    this.status = jobData.status;
    this.language = jobData.language;
    this.createdBy = jobData.created_by;
    this.applicationDeadline = jobData.application_deadline;
    this.createdAt = jobData.created_at;
    this.updatedAt = jobData.updated_at;
    
    // Données relationnelles (si jointes)
    this.creator = jobData.creator || null;
    this.applicationsCount = jobData.applications_count || 0;
  }

  // Créer une nouvelle offre d'emploi
  static async create(jobData, createdBy) {
    const {
      title,
      department,
      location,
      employmentType,
      experienceLevel,
      description,
      requirements,
      benefits,
      salaryRange,
      status = 'active',
      language = 'fr',
      applicationDeadline
    } = jobData;

    // Validation des données requises
    if (!title || !description) {
      throw new Error('Titre et description requis');
    }

    const result = await query(`
      INSERT INTO job_offers (
        title, department, location, employment_type, experience_level,
        description, requirements, benefits, salary_range, status,
        language, created_by, application_deadline
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `, [
      title, department, location, employmentType, experienceLevel,
      description, requirements, benefits, salaryRange, status,
      language, createdBy, applicationDeadline
    ]);

    return new JobOffer(result.rows[0]);
  }

  // Trouver une offre par ID
  static async findById(id, includeCreator = false) {
    let sql = 'SELECT * FROM job_offers WHERE id = $1';
    
    if (includeCreator) {
      sql = `
        SELECT jo.*, 
               u.username as creator_username,
               u.first_name as creator_first_name,
               u.last_name as creator_last_name,
               COUNT(ja.id) as applications_count
        FROM job_offers jo
        LEFT JOIN users u ON jo.created_by = u.id
        LEFT JOIN job_applications ja ON jo.id = ja.job_offer_id
        WHERE jo.id = $1
        GROUP BY jo.id, u.username, u.first_name, u.last_name
      `;
    }

    const result = await query(sql, [id]);
    if (result.rows.length === 0) return null;

    const job = new JobOffer(result.rows[0]);
    
    if (includeCreator && result.rows[0].creator_username) {
      job.creator = {
        username: result.rows[0].creator_username,
        firstName: result.rows[0].creator_first_name,
        lastName: result.rows[0].creator_last_name
      };
      job.applicationsCount = parseInt(result.rows[0].applications_count) || 0;
    }

    return job;
  }

  // Lister les offres avec pagination et filtres
  static async findAll(options = {}) {
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
      sortOrder = 'DESC',
      includeCreator = false,
      includeApplicationsCount = false
    } = options;

    const offset = (page - 1) * limit;
    const conditions = [];
    const values = [];
    let paramCount = 1;

    // Construire les conditions WHERE
    if (status) {
      conditions.push(`jo.status = $${paramCount}`);
      values.push(status);
      paramCount++;
    }

    if (language) {
      conditions.push(`jo.language = $${paramCount}`);
      values.push(language);
      paramCount++;
    }

    if (department) {
      conditions.push(`jo.department = $${paramCount}`);
      values.push(department);
      paramCount++;
    }

    if (employmentType) {
      conditions.push(`jo.employment_type = $${paramCount}`);
      values.push(employmentType);
      paramCount++;
    }

    if (experienceLevel) {
      conditions.push(`jo.experience_level = $${paramCount}`);
      values.push(experienceLevel);
      paramCount++;
    }

    if (location) {
      conditions.push(`jo.location ILIKE $${paramCount}`);
      values.push(`%${location}%`);
      paramCount++;
    }

    if (search) {
      conditions.push(`(jo.title ILIKE $${paramCount} OR jo.description ILIKE $${paramCount} OR jo.department ILIKE $${paramCount})`);
      values.push(`%${search}%`);
      paramCount++;
    }

    // Exclure les offres expirées par défaut pour les non-admins
    if (!options.includeExpired) {
      conditions.push(`(jo.application_deadline IS NULL OR jo.application_deadline >= CURRENT_DATE)`);
    }

    // Base de la requête
    let sql = 'SELECT jo.*';
    
    if (includeCreator) {
      sql += `, u.username as creator_username, u.first_name as creator_first_name, u.last_name as creator_last_name`;
    }
    
    if (includeApplicationsCount) {
      sql += `, COUNT(ja.id) as applications_count`;
    }
    
    sql += ` FROM job_offers jo`;
    
    if (includeCreator) {
      sql += ` LEFT JOIN users u ON jo.created_by = u.id`;
    }
    
    if (includeApplicationsCount) {
      sql += ` LEFT JOIN job_applications ja ON jo.id = ja.job_offer_id`;
    }

    // Ajouter les conditions
    if (conditions.length > 0) {
      sql += ` WHERE ${conditions.join(' AND ')}`;
    }

    // Groupement si nécessaire
    if (includeApplicationsCount) {
      sql += ` GROUP BY jo.id`;
      if (includeCreator) {
        sql += `, u.username, u.first_name, u.last_name`;
      }
    }

    // Tri et pagination
    sql += ` ORDER BY jo.${sortBy} ${sortOrder} LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    values.push(limit, offset);

    const result = await query(sql, values);
    
    // Compter le total pour la pagination
    let countSql = 'SELECT COUNT(*) FROM job_offers jo';
    if (conditions.length > 0) {
      countSql += ` WHERE ${conditions.join(' AND ')}`;
    }
    
    const countResult = await query(countSql, values.slice(0, -2)); // Enlever limit et offset
    const total = parseInt(countResult.rows[0].count);

    const jobs = result.rows.map(row => {
      const job = new JobOffer(row);
      
      if (includeCreator && row.creator_username) {
        job.creator = {
          username: row.creator_username,
          firstName: row.creator_first_name,
          lastName: row.creator_last_name
        };
      }
      
      if (includeApplicationsCount) {
        job.applicationsCount = parseInt(row.applications_count) || 0;
      }
      
      return job;
    });

    return {
      jobs,
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

  // Mettre à jour une offre
  async update(updates) {
    const allowedFields = [
      'title', 'department', 'location', 'employment_type', 'experience_level',
      'description', 'requirements', 'benefits', 'salary_range', 'status',
      'language', 'application_deadline'
    ];

    const setClause = [];
    const values = [];
    let paramCount = 1;

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
    const sql = `UPDATE job_offers SET ${setClause.join(', ')} WHERE id = $${paramCount} RETURNING *`;
    
    const result = await query(sql, values);
    
    if (result.rows.length > 0) {
      Object.assign(this, new JobOffer(result.rows[0]));
    }

    return this;
  }

  // Supprimer une offre
  async delete() {
    // Supprimer d'abord les candidatures associées
    await query('DELETE FROM job_applications WHERE job_offer_id = $1', [this.id]);
    
    // Puis supprimer l'offre
    await query('DELETE FROM job_offers WHERE id = $1', [this.id]);
  }

  // Activer une offre
  async activate() {
    await this.update({ status: 'active' });
  }

  // Mettre en pause une offre
  async pause() {
    await this.update({ status: 'paused' });
  }

  // Fermer une offre
  async close() {
    await this.update({ status: 'closed' });
  }

  // Vérifier si l'offre est encore ouverte aux candidatures
  isOpenForApplications() {
    if (this.status !== 'active') return false;
    if (this.applicationDeadline && new Date(this.applicationDeadline) < new Date()) return false;
    return true;
  }

  // Obtenir les statistiques par département
  static async getDepartmentStats(language = 'fr') {
    const result = await query(`
      SELECT 
        department,
        COUNT(*) as total_offers,
        COUNT(*) FILTER (WHERE status = 'active') as active_offers,
        COUNT(*) FILTER (WHERE status = 'paused') as paused_offers,
        COUNT(*) FILTER (WHERE status = 'closed') as closed_offers
      FROM job_offers
      WHERE language = $1
      GROUP BY department
      ORDER BY total_offers DESC
    `, [language]);

    return result.rows;
  }

  // Obtenir les offres populaires (avec le plus de candidatures)
  static async getPopularJobs(language = 'fr', limit = 5) {
    const result = await query(`
      SELECT jo.*, COUNT(ja.id) as applications_count
      FROM job_offers jo
      LEFT JOIN job_applications ja ON jo.id = ja.job_offer_id
      WHERE jo.language = $1 AND jo.status = 'active'
      GROUP BY jo.id
      ORDER BY applications_count DESC, jo.created_at DESC
      LIMIT $2
    `, [language, limit]);

    return result.rows.map(row => {
      const job = new JobOffer(row);
      job.applicationsCount = parseInt(row.applications_count) || 0;
      return job;
    });
  }

  // Rechercher des offres
  static async search(searchTerm, filters = {}) {
    const {
      language = 'fr',
      department,
      employmentType,
      experienceLevel,
      location,
      limit = 20
    } = filters;

    const conditions = [`jo.language = $1`];
    const values = [language];
    let paramCount = 2;

    // Recherche textuelle
    if (searchTerm) {
      conditions.push(`(jo.title ILIKE $${paramCount} OR jo.description ILIKE $${paramCount} OR jo.department ILIKE $${paramCount})`);
      values.push(`%${searchTerm}%`);
      paramCount++;
    }

    // Filtres additionnels
    if (department) {
      conditions.push(`jo.department = $${paramCount}`);
      values.push(department);
      paramCount++;
    }

    if (employmentType) {
      conditions.push(`jo.employment_type = $${paramCount}`);
      values.push(employmentType);
      paramCount++;
    }

    if (experienceLevel) {
      conditions.push(`jo.experience_level = $${paramCount}`);
      values.push(experienceLevel);
      paramCount++;
    }

    if (location) {
      conditions.push(`jo.location ILIKE $${paramCount}`);
      values.push(`%${location}%`);
      paramCount++;
    }

    // Seulement les offres actives et non expirées
    conditions.push(`jo.status = 'active'`);
    conditions.push(`(jo.application_deadline IS NULL OR jo.application_deadline >= CURRENT_DATE)`);

    values.push(limit);

    const sql = `
      SELECT jo.*, COUNT(ja.id) as applications_count
      FROM job_offers jo
      LEFT JOIN job_applications ja ON jo.id = ja.job_offer_id
      WHERE ${conditions.join(' AND ')}
      GROUP BY jo.id
      ORDER BY jo.created_at DESC
      LIMIT $${paramCount}
    `;

    const result = await query(sql, values);

    return result.rows.map(row => {
      const job = new JobOffer(row);
      job.applicationsCount = parseInt(row.applications_count) || 0;
      return job;
    });
  }

  // Conversion JSON pour l'API
  toJSON() {
    return {
      id: this.id,
      title: this.title,
      department: this.department,
      location: this.location,
      employmentType: this.employmentType,
      experienceLevel: this.experienceLevel,
      description: this.description,
      requirements: this.requirements,
      benefits: this.benefits,
      salaryRange: this.salaryRange,
      status: this.status,
      language: this.language,
      createdBy: this.createdBy,
      creator: this.creator,
      applicationDeadline: this.applicationDeadline,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      applicationsCount: this.applicationsCount,
      isOpenForApplications: this.isOpenForApplications()
    };
  }

  // Version publique (sans données sensibles)
  toPublicJSON() {
    return {
      id: this.id,
      title: this.title,
      department: this.department,
      location: this.location,
      employmentType: this.employmentType,
      experienceLevel: this.experienceLevel,
      description: this.description,
      requirements: this.requirements,
      benefits: this.benefits,
      salaryRange: this.salaryRange,
      language: this.language,
      applicationDeadline: this.applicationDeadline,
      createdAt: this.createdAt,
      applicationsCount: this.applicationsCount,
      isOpenForApplications: this.isOpenForApplications()
    };
  }
}