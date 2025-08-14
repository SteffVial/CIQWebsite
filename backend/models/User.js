import { query } from '../config/database.js';
import { hashPassword, verifyPassword, validatePassword } from '../utils/password.js';

export class User {
  constructor(userData) {
    this.id = userData.id;
    this.username = userData.username;
    this.email = userData.email;
    this.passwordHash = userData.password_hash;
    this.roles = userData.role || [];
    this.firstName = userData.first_name;
    this.lastName = userData.last_name;
    this.isActive = userData.is_active;
    this.createdAt = userData.created_at;
    this.updatedAt = userData.updated_at;
    this.lastLogin = userData.last_login;
  }

  // Créer un nouvel utilisateur
  static async create(userData) {
    const { username, email, password, roles, firstName, lastName } = userData;
    
    // Valider et hasher le mot de passe
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      throw new Error(`Mot de passe invalide: ${passwordValidation.errors.join(', ')}`);
    }
    
    const passwordHash = await hashPassword(password);
    
    // Valider les rôles
    const validRoles = ['admin', 'blogadmin', 'careeradmin', 'contentadmin'];
    const userRoles = Array.isArray(roles) ? roles : [roles];
    
    for (const role of userRoles) {
      if (!validRoles.includes(role)) {
        throw new Error(`Rôle invalide: ${role}`);
      }
    }

    const result = await query(`
      INSERT INTO users (username, email, password_hash, role, first_name, last_name)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [username, email, passwordHash, userRoles, firstName, lastName]);

    return new User(result.rows[0]);
  }

  // Trouver un utilisateur par ID
  static async findById(id) {
    const result = await query('SELECT * FROM users WHERE id = $1 AND is_active = true', [id]);
    return result.rows.length > 0 ? new User(result.rows[0]) : null;
  }

  // Trouver un utilisateur par email
  static async findByEmail(email) {
    const result = await query('SELECT * FROM users WHERE email = $1 AND is_active = true', [email]);
    return result.rows.length > 0 ? new User(result.rows[0]) : null;
  }

  // Trouver un utilisateur par username
  static async findByUsername(username) {
    const result = await query('SELECT * FROM users WHERE username = $1 AND is_active = true', [username]);
    return result.rows.length > 0 ? new User(result.rows[0]) : null;
  }

  // Vérifier le mot de passe
  async verifyPassword(password) {
    return await verifyPassword(password, this.passwordHash);
  }

  // Vérifier si l'utilisateur a un rôle spécifique
  hasRole(roleToCheck) {
    // Admin a tous les droits
    if (this.roles.includes('admin')) {
      return true;
    }
    return this.roles.includes(roleToCheck);
  }

  // Vérifier si l'utilisateur peut accéder à une ressource
  canAccess(requiredRole) {
    return this.hasRole(requiredRole);
  }

  // Ajouter un rôle
  async addRole(newRole) {
    const validRoles = ['admin', 'blogadmin', 'careeradmin', 'contentadmin'];
    if (!validRoles.includes(newRole)) {
      throw new Error(`Rôle invalide: ${newRole}`);
    }

    if (!this.roles.includes(newRole)) {
      const updatedRoles = [...this.roles, newRole];
      await query('UPDATE users SET role = $1 WHERE id = $2', [updatedRoles, this.id]);
      this.roles = updatedRoles;
    }
  }

  // Retirer un rôle
  async removeRole(roleToRemove) {
    // Ne pas permettre de retirer le dernier rôle
    if (this.roles.length <= 1) {
      throw new Error('Un utilisateur doit avoir au moins un rôle');
    }

    const updatedRoles = this.roles.filter(role => role !== roleToRemove);
    await query('UPDATE users SET role = $1 WHERE id = $2', [updatedRoles, this.id]);
    this.roles = updatedRoles;
  }

  // Mettre à jour le dernier login
  async updateLastLogin() {
    await query('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1', [this.id]);
    this.lastLogin = new Date();
  }

  // Mettre à jour les informations utilisateur
  async update(updates) {
    const allowedFields = ['email', 'first_name', 'last_name'];
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

    if (setClause.length > 0) {
      values.push(this.id);
      const sql = `UPDATE users SET ${setClause.join(', ')} WHERE id = $${paramCount} RETURNING *`;
      const result = await query(sql, values);
      
      if (result.rows.length > 0) {
        Object.assign(this, result.rows[0]);
      }
    }
  }

  // Changer le mot de passe
  async changePassword(newPassword) {
    const newPasswordHash = await hashPassword(newPassword);
    
    await query('UPDATE users SET password_hash = $1 WHERE id = $2', [newPasswordHash, this.id]);
    this.passwordHash = newPasswordHash;
  }

  // Désactiver l'utilisateur
  async deactivate() {
    await query('UPDATE users SET is_active = false WHERE id = $1', [this.id]);
    this.isActive = false;
  }

  // Obtenir tous les utilisateurs
  static async findAll(options = {}) {
    let sql = 'SELECT * FROM users WHERE is_active = true';
    const values = [];

    if (options.role) {
      sql += ' AND $1 = ANY(role)';
      values.push(options.role);
    }

    sql += ' ORDER BY created_at DESC';

    if (options.limit) {
      sql += ` LIMIT ${parseInt(options.limit)}`;
    }

    const result = await query(sql, values);
    return result.rows.map(row => new User(row));
  }

  // Représentation JSON (sans mot de passe)
  toJSON() {
    return {
      id: this.id,
      username: this.username,
      email: this.email,
      roles: this.roles,
      firstName: this.firstName,
      lastName: this.lastName,
      isActive: this.isActive,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      lastLogin: this.lastLogin
    };
  }
}