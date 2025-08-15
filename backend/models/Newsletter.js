import { query } from '../config/database.js';
import crypto from 'crypto';

export class NewsletterSubscriber {
  constructor(subscriberData) {
    this.id = subscriberData.id;
    this.email = subscriberData.email;
    this.firstName = subscriberData.first_name;
    this.lastName = subscriberData.last_name;
    this.language = subscriberData.language;
    this.isActive = subscriberData.is_active;
    this.confirmedAt = subscriberData.confirmed_at;
    this.subscribedAt = subscriberData.subscribed_at;
    this.unsubscribedAt = subscriberData.unsubscribed_at;
    this.unsubscribeToken = subscriberData.unsubscribe_token;
  }

  // Créer un nouvel abonné
  static async create(subscriberData) {
    const {
      email,
      firstName,
      lastName,
      language = 'fr'
    } = subscriberData;

    // Validation de l'email
    if (!email || !this.isValidEmail(email)) {
      throw new Error('Email valide requis');
    }

    // Vérifier si l'email existe déjà
    const existing = await this.findByEmail(email);
    if (existing) {
      if (existing.isActive) {
        throw new Error('Cet email est déjà abonné à la newsletter');
      } else {
        // Réactiver l'abonnement existant
        return await existing.resubscribe();
      }
    }

    // Générer un token unique pour la désinscription
    const unsubscribeToken = this.generateUnsubscribeToken();

    const result = await query(`
      INSERT INTO newsletter_subscribers (
        email, first_name, last_name, language, unsubscribe_token, is_active
      ) VALUES ($1, $2, $3, $4, $5, true)
      RETURNING *
    `, [email, firstName, lastName, language, unsubscribeToken]);

    return new NewsletterSubscriber(result.rows[0]);
  }

  // Trouver un abonné par email
  static async findByEmail(email) {
    const result = await query(
      'SELECT * FROM newsletter_subscribers WHERE email = $1',
      [email]
    );
    return result.rows.length > 0 ? new NewsletterSubscriber(result.rows[0]) : null;
  }

  // Trouver un abonné par ID
  static async findById(id) {
    const result = await query(
      'SELECT * FROM newsletter_subscribers WHERE id = $1',
      [id]
    );
    return result.rows.length > 0 ? new NewsletterSubscriber(result.rows[0]) : null;
  }

  // Trouver un abonné par token de désinscription
  static async findByUnsubscribeToken(token) {
    const result = await query(
      'SELECT * FROM newsletter_subscribers WHERE unsubscribe_token = $1',
      [token]
    );
    return result.rows.length > 0 ? new NewsletterSubscriber(result.rows[0]) : null;
  }

  // Lister tous les abonnés avec pagination et filtres
  static async findAll(options = {}) {
    const {
      page = 1,
      limit = 50,
      isActive,
      language,
      search,
      sortBy = 'subscribed_at',
      sortOrder = 'DESC'
    } = options;

    const offset = (page - 1) * limit;
    const conditions = [];
    const values = [];
    let paramCount = 1;

    // Construire les conditions WHERE
    if (isActive !== undefined) {
      conditions.push(`is_active = $${paramCount}`);
      values.push(isActive);
      paramCount++;
    }

    if (language) {
      conditions.push(`language = $${paramCount}`);
      values.push(language);
      paramCount++;
    }

    if (search) {
      conditions.push(`(email ILIKE $${paramCount} OR first_name ILIKE $${paramCount} OR last_name ILIKE $${paramCount})`);
      values.push(`%${search}%`);
      paramCount++;
    }

    // Construire la requête
    let sql = 'SELECT * FROM newsletter_subscribers';
    if (conditions.length > 0) {
      sql += ` WHERE ${conditions.join(' AND ')}`;
    }

    sql += ` ORDER BY ${sortBy} ${sortOrder} LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    values.push(limit, offset);

    const result = await query(sql, values);

    // Compter le total
    let countSql = 'SELECT COUNT(*) FROM newsletter_subscribers';
    if (conditions.length > 0) {
      countSql += ` WHERE ${conditions.join(' AND ')}`;
    }

    const countResult = await query(countSql, values.slice(0, -2));
    const total = parseInt(countResult.rows[0].count);

    const subscribers = result.rows.map(row => new NewsletterSubscriber(row));

    return {
      subscribers,
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

  // Mettre à jour les informations d'un abonné
  async update(updates) {
    const allowedFields = ['first_name', 'last_name', 'language'];
    const setClause = [];
    const values = [];
    let paramCount = 1;

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
    const sql = `UPDATE newsletter_subscribers SET ${setClause.join(', ')} WHERE id = $${paramCount} RETURNING *`;

    const result = await query(sql, values);

    if (result.rows.length > 0) {
      Object.assign(this, new NewsletterSubscriber(result.rows[0]));
    }

    return this;
  }

  // Confirmer l'abonnement (double opt-in)
  async confirm() {
    await query(
      'UPDATE newsletter_subscribers SET confirmed_at = CURRENT_TIMESTAMP WHERE id = $1',
      [this.id]
    );
    this.confirmedAt = new Date();
    return this;
  }

  // Se désabonner
  async unsubscribe() {
    await query(`
      UPDATE newsletter_subscribers 
      SET is_active = false, unsubscribed_at = CURRENT_TIMESTAMP 
      WHERE id = $1
    `, [this.id]);

    this.isActive = false;
    this.unsubscribedAt = new Date();
    return this;
  }

  // Se réabonner
  async resubscribe() {
    await query(`
      UPDATE newsletter_subscribers 
      SET is_active = true, unsubscribed_at = NULL, subscribed_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `, [this.id]);

    this.isActive = true;
    this.unsubscribedAt = null;
    this.subscribedAt = new Date();
    return this;
  }

  // Supprimer définitivement (RGPD)
  async delete() {
    await query('DELETE FROM newsletter_subscribers WHERE id = $1', [this.id]);
  }

  // Obtenir les statistiques des abonnés
  static async getStats() {
    const result = await query(`
      SELECT 
        COUNT(*) as total_subscribers,
        COUNT(*) FILTER (WHERE is_active = true) as active_subscribers,
        COUNT(*) FILTER (WHERE is_active = false) as inactive_subscribers,
        COUNT(*) FILTER (WHERE confirmed_at IS NOT NULL) as confirmed_subscribers,
        COUNT(*) FILTER (WHERE language = 'fr') as french_subscribers,
        COUNT(*) FILTER (WHERE language = 'en') as english_subscribers,
        COUNT(*) FILTER (WHERE subscribed_at >= CURRENT_DATE - INTERVAL '30 days') as new_last_30_days,
        COUNT(*) FILTER (WHERE subscribed_at >= CURRENT_DATE - INTERVAL '7 days') as new_last_7_days
      FROM newsletter_subscribers
    `);

    return result.rows[0];
  }

  // Obtenir les abonnés actifs par langue
  static async getActiveSubscribersByLanguage(language = 'fr') {
    const result = await query(`
      SELECT email, first_name, last_name 
      FROM newsletter_subscribers 
      WHERE is_active = true AND language = $1 
      ORDER BY subscribed_at DESC
    `, [language]);

    return result.rows;
  }

  // Rechercher des abonnés
  static async search(searchTerm, options = {}) {
    const { language, isActive = true, limit = 20 } = options;

    const conditions = [`is_active = $1`];
    const values = [isActive];
    let paramCount = 2;

    if (language) {
      conditions.push(`language = $${paramCount}`);
      values.push(language);
      paramCount++;
    }

    if (searchTerm) {
      conditions.push(`(email ILIKE $${paramCount} OR first_name ILIKE $${paramCount} OR last_name ILIKE $${paramCount})`);
      values.push(`%${searchTerm}%`);
      paramCount++;
    }

    values.push(limit);

    const sql = `
      SELECT * FROM newsletter_subscribers 
      WHERE ${conditions.join(' AND ')}
      ORDER BY subscribed_at DESC 
      LIMIT $${paramCount}
    `;

    const result = await query(sql, values);
    return result.rows.map(row => new NewsletterSubscriber(row));
  }

  // Générer un token de désinscription unique
  static generateUnsubscribeToken() {
    // Utiliser la même méthode que PostgreSQL pour la cohérence
    const randomStr = Math.random().toString() + Date.now().toString() + Math.random().toString();
    return crypto.createHash('md5').update(randomStr).digest('hex');
  }

  // Valider un email
  static isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Obtenir l'URL de désinscription
  getUnsubscribeUrl(baseUrl = process.env.CLIENT_URL) {
    return `${baseUrl}/unsubscribe/${this.unsubscribeToken}`;
  }

  // Export pour mailing (format pour services comme SendGrid)
  static async exportForMailing(language = 'fr') {
    const subscribers = await this.getActiveSubscribersByLanguage(language);
    
    return subscribers.map(sub => ({
      email: sub.email,
      first_name: sub.first_name,
      last_name: sub.last_name,
      full_name: `${sub.first_name || ''} ${sub.last_name || ''}`.trim() || 'Abonné'
    }));
  }

  // Nettoyer les anciens abonnés inactifs (RGPD - après X mois)
  static async cleanupOldUnsubscribed(monthsOld = 24) {
    const result = await query(`
      DELETE FROM newsletter_subscribers 
      WHERE is_active = false 
      AND unsubscribed_at < CURRENT_DATE - INTERVAL '${monthsOld} months'
      RETURNING count(*)
    `);

    return parseInt(result.rowCount) || 0;
  }

  // Conversion JSON pour l'API
  toJSON() {
    return {
      id: this.id,
      email: this.email,
      firstName: this.firstName,
      lastName: this.lastName,
      language: this.language,
      isActive: this.isActive,
      confirmedAt: this.confirmedAt,
      subscribedAt: this.subscribedAt,
      unsubscribedAt: this.unsubscribedAt
    };
  }

  // Version publique (sans données sensibles)
  toPublicJSON() {
    return {
      email: this.email,
      firstName: this.firstName,
      language: this.language,
      isActive: this.isActive,
      subscribedAt: this.subscribedAt
    };
  }

  // Version pour l'admin
  toAdminJSON() {
    return {
      id: this.id,
      email: this.email,
      firstName: this.firstName,
      lastName: this.lastName,
      language: this.language,
      isActive: this.isActive,
      confirmedAt: this.confirmedAt,
      subscribedAt: this.subscribedAt,
      unsubscribedAt: this.unsubscribedAt,
      unsubscribeUrl: this.getUnsubscribeUrl()
    };
  }
}