import { query } from '../config/database.js';

export class JobApplication {
  constructor(applicationData) {
    this.id = applicationData.id;
    this.jobOfferId = applicationData.job_offer_id;
    this.firstName = applicationData.first_name;
    this.lastName = applicationData.last_name;
    this.email = applicationData.email;
    this.phone = applicationData.phone;
    this.coverLetter = applicationData.cover_letter;
    this.resumeUrl = applicationData.resume_url;
    this.portfolioUrl = applicationData.portfolio_url;
    this.linkedinUrl = applicationData.linkedin_url;
    this.availabilityDate = applicationData.availability_date;
    this.salaryExpectation = applicationData.salary_expectation;
    this.status = applicationData.status;
    this.notes = applicationData.notes;
    this.reviewedBy = applicationData.reviewed_by;
    this.reviewedAt = applicationData.reviewed_at;
    this.appliedAt = applicationData.applied_at;
    this.updatedAt = applicationData.updated_at;
    
    // Données relationnelles (si jointes)
    this.jobOffer = applicationData.job_offer || null;
    this.reviewer = applicationData.reviewer || null;
  }

  // Créer une nouvelle candidature
  static async create(applicationData) {
    const {
      jobOfferId,
      firstName,
      lastName,
      email,
      phone,
      coverLetter,
      resumeUrl,
      portfolioUrl,
      linkedinUrl,
      availabilityDate,
      salaryExpectation
    } = applicationData;

    // Validation des données requises
    if (!jobOfferId || !firstName || !lastName || !email) {
      throw new Error('Offre d\'emploi, prénom, nom et email requis');
    }

    // Vérifier que l'offre existe et est ouverte
    const jobCheck = await query(`
      SELECT id, status, application_deadline 
      FROM job_offers 
      WHERE id = $1
    `, [jobOfferId]);

    if (jobCheck.rows.length === 0) {
      throw new Error('Offre d\'emploi non trouvée');
    }

    const job = jobCheck.rows[0];
    if (job.status !== 'active') {
      throw new Error('Cette offre n\'est plus ouverte aux candidatures');
    }

    if (job.application_deadline && new Date(job.application_deadline) < new Date()) {
      throw new Error('La date limite de candidature est dépassée');
    }

    // Vérifier si la personne n'a pas déjà candidaté
    const existingApplication = await query(`
      SELECT id FROM job_applications 
      WHERE job_offer_id = $1 AND email = $2
    `, [jobOfferId, email]);

    if (existingApplication.rows.length > 0) {
      throw new Error('Vous avez déjà candidaté pour cette offre');
    }

    const result = await query(`
      INSERT INTO job_applications (
        job_offer_id, first_name, last_name, email, phone,
        cover_letter, resume_url, portfolio_url, linkedin_url,
        availability_date, salary_expectation, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'pending')
      RETURNING *
    `, [
      jobOfferId, firstName, lastName, email, phone,
      coverLetter, resumeUrl, portfolioUrl, linkedinUrl,
      availabilityDate, salaryExpectation
    ]);

    return new JobApplication(result.rows[0]);
  }

  // Trouver une candidature par ID
  static async findById(id, includeJobOffer = false, includeReviewer = false) {
    let sql = 'SELECT ja.*';
    let joins = '';

    if (includeJobOffer) {
      sql += `, jo.title as job_title, jo.department as job_department, jo.location as job_location`;
      joins += ' LEFT JOIN job_offers jo ON ja.job_offer_id = jo.id';
    }

    if (includeReviewer) {
      sql += `, u.username as reviewer_username, u.first_name as reviewer_first_name, u.last_name as reviewer_last_name`;
      joins += ' LEFT JOIN users u ON ja.reviewed_by = u.id';
    }

    sql += ` FROM job_applications ja${joins} WHERE ja.id = $1`;

    const result = await query(sql, [id]);
    if (result.rows.length === 0) return null;

    const application = new JobApplication(result.rows[0]);

    if (includeJobOffer && result.rows[0].job_title) {
      application.jobOffer = {
        title: result.rows[0].job_title,
        department: result.rows[0].job_department,
        location: result.rows[0].job_location
      };
    }

    if (includeReviewer && result.rows[0].reviewer_username) {
      application.reviewer = {
        username: result.rows[0].reviewer_username,
        firstName: result.rows[0].reviewer_first_name,
        lastName: result.rows[0].reviewer_last_name
      };
    }

    return application;
  }

  // Lister les candidatures avec pagination et filtres
  static async findAll(options = {}) {
    const {
      page = 1,
      limit = 10,
      jobOfferId,
      status,
      email,
      sortBy = 'applied_at',
      sortOrder = 'DESC',
      includeJobOffer = false,
      includeReviewer = false
    } = options;

    const offset = (page - 1) * limit;
    const conditions = [];
    const values = [];
    let paramCount = 1;

    // Construire les conditions WHERE
    if (jobOfferId) {
      conditions.push(`ja.job_offer_id = $${paramCount}`);
      values.push(jobOfferId);
      paramCount++;
    }

    if (status) {
      conditions.push(`ja.status = $${paramCount}`);
      values.push(status);
      paramCount++;
    }

    if (email) {
      conditions.push(`ja.email ILIKE $${paramCount}`);
      values.push(`%${email}%`);
      paramCount++;
    }

    // Base de la requête
    let sql = 'SELECT ja.*';
    let joins = '';

    if (includeJobOffer) {
      sql += `, jo.title as job_title, jo.department as job_department, jo.location as job_location`;
      joins += ' LEFT JOIN job_offers jo ON ja.job_offer_id = jo.id';
    }

    if (includeReviewer) {
      sql += `, u.username as reviewer_username, u.first_name as reviewer_first_name, u.last_name as reviewer_last_name`;
      joins += ' LEFT JOIN users u ON ja.reviewed_by = u.id';
    }

    sql += ` FROM job_applications ja${joins}`;

    // Ajouter les conditions
    if (conditions.length > 0) {
      sql += ` WHERE ${conditions.join(' AND ')}`;
    }

    // Tri et pagination
    sql += ` ORDER BY ja.${sortBy} ${sortOrder} LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    values.push(limit, offset);

    const result = await query(sql, values);

    // Compter le total pour la pagination
    let countSql = 'SELECT COUNT(*) FROM job_applications ja';
    if (conditions.length > 0) {
      countSql += ` WHERE ${conditions.join(' AND ')}`;
    }

    const countResult = await query(countSql, values.slice(0, -2));
    const total = parseInt(countResult.rows[0].count);

    const applications = result.rows.map(row => {
      const application = new JobApplication(row);

      if (includeJobOffer && row.job_title) {
        application.jobOffer = {
          title: row.job_title,
          department: row.job_department,
          location: row.job_location
        };
      }

      if (includeReviewer && row.reviewer_username) {
        application.reviewer = {
          username: row.reviewer_username,
          firstName: row.reviewer_first_name,
          lastName: row.reviewer_last_name
        };
      }

      return application;
    });

    return {
      applications,
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

  // Mettre à jour une candidature
  async update(updates, reviewedBy = null) {
    const allowedFields = [
      'first_name', 'last_name', 'email', 'phone', 'cover_letter',
      'resume_url', 'portfolio_url', 'linkedin_url', 'availability_date',
      'salary_expectation', 'status', 'notes'
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

    // Si le statut change, mettre à jour reviewed_by et reviewed_at
    if (updates.status && updates.status !== this.status && reviewedBy) {
      setClause.push(`reviewed_by = $${paramCount}`, `reviewed_at = CURRENT_TIMESTAMP`);
      values.push(reviewedBy);
      paramCount++;
    }

    values.push(this.id);
    const sql = `UPDATE job_applications SET ${setClause.join(', ')} WHERE id = $${paramCount} RETURNING *`;

    const result = await query(sql, values);

    if (result.rows.length > 0) {
      Object.assign(this, new JobApplication(result.rows[0]));
    }

    return this;
  }

  // Supprimer une candidature
  async delete() {
    await query('DELETE FROM job_applications WHERE id = $1', [this.id]);
  }

  // Changer le statut de la candidature
  async updateStatus(newStatus, reviewedBy, notes = null) {
    const validStatuses = ['pending', 'reviewed', 'shortlisted', 'interviewed', 'offered', 'hired', 'rejected'];
    
    if (!validStatuses.includes(newStatus)) {
      throw new Error(`Statut invalide: ${newStatus}`);
    }

    const updates = { status: newStatus };
    if (notes) {
      updates.notes = notes;
    }

    return await this.update(updates, reviewedBy);
  }

  // Accepter une candidature
  async accept(reviewedBy, notes = null) {
    return await this.updateStatus('shortlisted', reviewedBy, notes);
  }

  // Rejeter une candidature
  async reject(reviewedBy, notes = null) {
    return await this.updateStatus('rejected', reviewedBy, notes);
  }

  // Marquer comme entretien programmé
  async scheduleInterview(reviewedBy, notes = null) {
    return await this.updateStatus('interviewed', reviewedBy, notes);
  }

  // Faire une offre
  async makeOffer(reviewedBy, notes = null) {
    return await this.updateStatus('offered', reviewedBy, notes);
  }

  // Embaucher
  async hire(reviewedBy, notes = null) {
    return await this.updateStatus('hired', reviewedBy, notes);
  }

  // Obtenir les statistiques des candidatures par offre
  static async getStatsByJobOffer(jobOfferId) {
    const result = await query(`
      SELECT 
        status,
        COUNT(*) as count
      FROM job_applications
      WHERE job_offer_id = $1
      GROUP BY status
      ORDER BY 
        CASE status
          WHEN 'pending' THEN 1
          WHEN 'reviewed' THEN 2
          WHEN 'shortlisted' THEN 3
          WHEN 'interviewed' THEN 4
          WHEN 'offered' THEN 5
          WHEN 'hired' THEN 6
          WHEN 'rejected' THEN 7
        END
    `, [jobOfferId]);

    const stats = {
      total: 0,
      pending: 0,
      reviewed: 0,
      shortlisted: 0,
      interviewed: 0,
      offered: 0,
      hired: 0,
      rejected: 0
    };

    result.rows.forEach(row => {
      stats[row.status] = parseInt(row.count);
      stats.total += parseInt(row.count);
    });

    return stats;
  }

  // Obtenir les candidatures récentes
  static async getRecentApplications(limit = 10) {
    const result = await query(`
      SELECT ja.*, jo.title as job_title, jo.department as job_department
      FROM job_applications ja
      LEFT JOIN job_offers jo ON ja.job_offer_id = jo.id
      ORDER BY ja.applied_at DESC
      LIMIT $1
    `, [limit]);

    return result.rows.map(row => {
      const application = new JobApplication(row);
      if (row.job_title) {
        application.jobOffer = {
          title: row.job_title,
          department: row.job_department
        };
      }
      return application;
    });
  }

  // Conversion JSON pour l'API
  toJSON() {
    return {
      id: this.id,
      jobOfferId: this.jobOfferId,
      jobOffer: this.jobOffer,
      firstName: this.firstName,
      lastName: this.lastName,
      email: this.email,
      phone: this.phone,
      coverLetter: this.coverLetter,
      resumeUrl: this.resumeUrl,
      portfolioUrl: this.portfolioUrl,
      linkedinUrl: this.linkedinUrl,
      availabilityDate: this.availabilityDate,
      salaryExpectation: this.salaryExpectation,
      status: this.status,
      notes: this.notes,
      reviewedBy: this.reviewedBy,
      reviewer: this.reviewer,
      reviewedAt: this.reviewedAt,
      appliedAt: this.appliedAt,
      updatedAt: this.updatedAt
    };
  }

  // Version publique (pour confirmation de candidature)
  toPublicJSON() {
    return {
      id: this.id,
      jobOfferId: this.jobOfferId,
      jobOffer: this.jobOffer,
      firstName: this.firstName,
      lastName: this.lastName,
      email: this.email,
      status: this.status,
      appliedAt: this.appliedAt
    };
  }

  // Version pour les RH (sans données personnelles sensibles)
  toHRJSON() {
    return {
      id: this.id,
      jobOfferId: this.jobOfferId,
      jobOffer: this.jobOffer,
      firstName: this.firstName,
      lastName: this.lastName,
      email: this.email,
      phone: this.phone,
      resumeUrl: this.resumeUrl,
      portfolioUrl: this.portfolioUrl,
      linkedinUrl: this.linkedinUrl,
      availabilityDate: this.availabilityDate,
      salaryExpectation: this.salaryExpectation,
      status: this.status,
      notes: this.notes,
      reviewedBy: this.reviewedBy,
      reviewer: this.reviewer,
      reviewedAt: this.reviewedAt,
      appliedAt: this.appliedAt
    };
  }
}