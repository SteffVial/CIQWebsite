import { query } from '../config/database.js';

export class SiteContent {
  constructor(contentData) {
    this.id = contentData.id;
    this.section = contentData.section;
    this.key = contentData.key;
    this.valueFr = contentData.value_fr;
    this.valueEn = contentData.value_en;
    this.contentType = contentData.content_type;
    this.updatedBy = contentData.updated_by;
    this.updatedAt = contentData.updated_at;
    
    // Données relationnelles (si jointes)
    this.updater = contentData.updater || null;
  }

  // Créer un nouveau contenu
  static async create(contentData, updatedBy) {
    const {
      section,
      key,
      valueFr,
      valueEn,
      contentType = 'text'
    } = contentData;

    // Validation des données requises
    if (!section || !key) {
      throw new Error('Section et clé requis');
    }

    if (!valueFr && !valueEn) {
      throw new Error('Au moins une valeur (FR ou EN) requise');
    }

    // Vérifier que la combinaison section/key n'existe pas déjà
    const existing = await this.findByKey(section, key);
    if (existing) {
      throw new Error(`Le contenu ${section}.${key} existe déjà`);
    }

    const result = await query(`
      INSERT INTO site_content (section, key, value_fr, value_en, content_type, updated_by)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [section, key, valueFr, valueEn, contentType, updatedBy]);

    return new SiteContent(result.rows[0]);
  }

  // Trouver un contenu par section et clé
  static async findByKey(section, key, includeUpdater = false) {
    let sql = 'SELECT sc.*';
    let joins = '';

    if (includeUpdater) {
      sql += `, u.username as updater_username, u.first_name as updater_first_name, u.last_name as updater_last_name`;
      joins = ' LEFT JOIN users u ON sc.updated_by = u.id';
    }

    sql += ` FROM site_content sc${joins} WHERE sc.section = $1 AND sc.key = $2`;

    const result = await query(sql, [section, key]);
    if (result.rows.length === 0) return null;

    const content = new SiteContent(result.rows[0]);

    if (includeUpdater && result.rows[0].updater_username) {
      content.updater = {
        username: result.rows[0].updater_username,
        firstName: result.rows[0].updater_first_name,
        lastName: result.rows[0].updater_last_name
      };
    }

    return content;
  }

  // Trouver un contenu par ID
  static async findById(id, includeUpdater = false) {
    let sql = 'SELECT sc.*';
    let joins = '';

    if (includeUpdater) {
      sql += `, u.username as updater_username, u.first_name as updater_first_name, u.last_name as updater_last_name`;
      joins = ' LEFT JOIN users u ON sc.updated_by = u.id';
    }

    sql += ` FROM site_content sc${joins} WHERE sc.id = $1`;

    const result = await query(sql, [id]);
    if (result.rows.length === 0) return null;

    const content = new SiteContent(result.rows[0]);

    if (includeUpdater && result.rows[0].updater_username) {
      content.updater = {
        username: result.rows[0].updater_username,
        firstName: result.rows[0].updater_first_name,
        lastName: result.rows[0].updater_last_name
      };
    }

    return content;
  }

  // Obtenir tous les contenus d'une section
  static async findBySection(section, includeUpdater = false) {
    let sql = 'SELECT sc.*';
    let joins = '';

    if (includeUpdater) {
      sql += `, u.username as updater_username, u.first_name as updater_first_name, u.last_name as updater_last_name`;
      joins = ' LEFT JOIN users u ON sc.updated_by = u.id';
    }

    sql += ` FROM site_content sc${joins} WHERE sc.section = $1 ORDER BY sc.key`;

    const result = await query(sql, [section]);

    return result.rows.map(row => {
      const content = new SiteContent(row);

      if (includeUpdater && row.updater_username) {
        content.updater = {
          username: row.updater_username,
          firstName: row.updater_first_name,
          lastName: row.updater_last_name
        };
      }

      return content;
    });
  }

  // Lister tous les contenus avec pagination et filtres
  static async findAll(options = {}) {
    const {
      page = 1,
      limit = 50,
      section,
      contentType,
      search,
      sortBy = 'section',
      sortOrder = 'ASC',
      includeUpdater = false
    } = options;

    const offset = (page - 1) * limit;
    const conditions = [];
    const values = [];
    let paramCount = 1;

    // Construire les conditions WHERE
    if (section) {
      conditions.push(`sc.section = $${paramCount}`);
      values.push(section);
      paramCount++;
    }

    if (contentType) {
      conditions.push(`sc.content_type = $${paramCount}`);
      values.push(contentType);
      paramCount++;
    }

    if (search) {
      conditions.push(`(sc.section ILIKE $${paramCount} OR sc.key ILIKE $${paramCount} OR sc.value_fr ILIKE $${paramCount} OR sc.value_en ILIKE $${paramCount})`);
      values.push(`%${search}%`);
      paramCount++;
    }

    // Base de la requête
    let sql = 'SELECT sc.*';
    let joins = '';

    if (includeUpdater) {
      sql += `, u.username as updater_username, u.first_name as updater_first_name, u.last_name as updater_last_name`;
      joins = ' LEFT JOIN users u ON sc.updated_by = u.id';
    }

    sql += ` FROM site_content sc${joins}`;

    // Ajouter les conditions
    if (conditions.length > 0) {
      sql += ` WHERE ${conditions.join(' AND ')}`;
    }

    // Tri et pagination
    sql += ` ORDER BY sc.${sortBy} ${sortOrder} LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    values.push(limit, offset);

    const result = await query(sql, values);

    // Compter le total pour la pagination
    let countSql = 'SELECT COUNT(*) FROM site_content sc';
    if (conditions.length > 0) {
      countSql += ` WHERE ${conditions.join(' AND ')}`;
    }

    const countResult = await query(countSql, values.slice(0, -2));
    const total = parseInt(countResult.rows[0].count);

    const contents = result.rows.map(row => {
      const content = new SiteContent(row);

      if (includeUpdater && row.updater_username) {
        content.updater = {
          username: row.updater_username,
          firstName: row.updater_first_name,
          lastName: row.updater_last_name
        };
      }

      return content;
    });

    return {
      contents,
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

  // Mettre à jour un contenu
  async update(updates, updatedBy) {
    const allowedFields = ['value_fr', 'value_en', 'content_type'];
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

    // Ajouter updated_by et updated_at
    setClause.push(`updated_by = $${paramCount}`, `updated_at = CURRENT_TIMESTAMP`);
    values.push(updatedBy);
    paramCount++;

    values.push(this.id);
    const sql = `UPDATE site_content SET ${setClause.join(', ')} WHERE id = $${paramCount} RETURNING *`;

    const result = await query(sql, values);

    if (result.rows.length > 0) {
      Object.assign(this, new SiteContent(result.rows[0]));
    }

    return this;
  }

  // Supprimer un contenu
  async delete() {
    await query('DELETE FROM site_content WHERE id = $1', [this.id]);
  }

  // Obtenir toutes les sections disponibles
  static async getSections() {
    const result = await query(`
      SELECT section, 
             COUNT(*) as content_count,
             MAX(updated_at) as last_updated
      FROM site_content 
      GROUP BY section 
      ORDER BY section
    `);

    return result.rows.map(row => ({
      section: row.section,
      contentCount: parseInt(row.content_count),
      lastUpdated: row.last_updated
    }));
  }

  // Obtenir la structure complète du site pour une langue
  static async getSiteStructure(language = 'fr') {
    const valueColumn = language === 'en' ? 'value_en' : 'value_fr';
    
    const result = await query(`
      SELECT section, key, ${valueColumn} as value, content_type
      FROM site_content 
      WHERE ${valueColumn} IS NOT NULL
      ORDER BY section, key
    `);

    // Organiser par sections
    const structure = {};
    result.rows.forEach(row => {
      if (!structure[row.section]) {
        structure[row.section] = {};
      }
      structure[row.section][row.key] = {
        value: row.value,
        type: row.content_type
      };
    });

    return structure;
  }

  // Rechercher dans le contenu
  static async search(searchTerm, language = 'fr', limit = 20) {
    const valueColumn = language === 'en' ? 'value_en' : 'value_fr';
    
    const result = await query(`
      SELECT section, key, ${valueColumn} as value, content_type
      FROM site_content 
      WHERE ${valueColumn} ILIKE $1
      ORDER BY section, key
      LIMIT $2
    `, [`%${searchTerm}%`, limit]);

    return result.rows.map(row => new SiteContent({
      section: row.section,
      key: row.key,
      [language === 'en' ? 'value_en' : 'value_fr']: row.value,
      content_type: row.content_type
    }));
  }

  // Créer ou mettre à jour un contenu (upsert)
  static async upsert(section, key, valueFr, valueEn, contentType = 'text', updatedBy) {
    const existing = await this.findByKey(section, key);
    
    if (existing) {
      // Mettre à jour
      const updates = {};
      if (valueFr !== undefined) updates.value_fr = valueFr;
      if (valueEn !== undefined) updates.value_en = valueEn;
      if (contentType !== undefined) updates.content_type = contentType;
      
      return await existing.update(updates, updatedBy);
    } else {
      // Créer
      return await this.create({
        section,
        key,
        valueFr,
        valueEn,
        contentType
      }, updatedBy);
    }
  }

  // Dupliquer une section pour une nouvelle langue
  static async duplicateSection(sourceSection, targetSection, updatedBy) {
    const contents = await this.findBySection(sourceSection);
    const duplicated = [];

    for (const content of contents) {
      try {
        const newContent = await this.create({
          section: targetSection,
          key: content.key,
          valueFr: content.valueFr,
          valueEn: content.valueEn,
          contentType: content.contentType
        }, updatedBy);
        
        duplicated.push(newContent);
      } catch (error) {
        console.warn(`Erreur duplication ${content.key}:`, error.message);
      }
    }

    return duplicated;
  }

  // Exporter tout le contenu
  static async exportAll(format = 'json') {
    const result = await query(`
      SELECT section, key, value_fr, value_en, content_type, updated_at
      FROM site_content 
      ORDER BY section, key
    `);

    if (format === 'csv') {
      const header = 'section,key,value_fr,value_en,content_type,updated_at\n';
      const csv = result.rows.map(row => 
        `"${row.section}","${row.key}","${row.value_fr || ''}","${row.value_en || ''}","${row.content_type}","${row.updated_at}"`
      ).join('\n');
      
      return header + csv;
    }

    return result.rows;
  }

  // Obtenir la valeur dans la langue spécifiée
  getValue(language = 'fr') {
    return language === 'en' ? this.valueEn : this.valueFr;
  }

  // Définir la valeur dans la langue spécifiée
  setValue(value, language = 'fr') {
    if (language === 'en') {
      this.valueEn = value;
    } else {
      this.valueFr = value;
    }
  }

  // Vérifier si le contenu est traduit
  isTranslated() {
    return !!(this.valueFr && this.valueEn);
  }

  // Conversion JSON pour l'API
  toJSON() {
    return {
      id: this.id,
      section: this.section,
      key: this.key,
      valueFr: this.valueFr,
      valueEn: this.valueEn,
      contentType: this.contentType,
      updatedBy: this.updatedBy,
      updater: this.updater,
      updatedAt: this.updatedAt,
      isTranslated: this.isTranslated()
    };
  }

  // Version publique (pour le frontend)
  toPublicJSON(language = 'fr') {
    return {
      section: this.section,
      key: this.key,
      value: this.getValue(language),
      type: this.contentType
    };
  }

  // Version pour l'admin
  toAdminJSON() {
    return {
      id: this.id,
      section: this.section,
      key: this.key,
      valueFr: this.valueFr,
      valueEn: this.valueEn,
      contentType: this.contentType,
      updatedBy: this.updatedBy,
      updater: this.updater,
      updatedAt: this.updatedAt,
      isTranslated: this.isTranslated()
    };
  }
}