import bcrypt from 'bcryptjs';

/**
 * Module de gestion des mots de passe avec bcrypt
 * Configuration sécurisée pour CynergyIQ
 */

// Configuration des rounds de hachage
// Plus le nombre est élevé, plus c'est sécurisé mais plus lent
// 12 est un bon compromis en 2024 (environ 250ms par hash)
const SALT_ROUNDS = 12;

// Politique de mots de passe
const PASSWORD_POLICY = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: false, // Optionnel pour l'UX
  forbiddenPatterns: [
    'password', 'motdepasse', '123456', 'azerty', 'qwerty',
    'admin', 'cynergyiq', 'cynergie'
  ]
};

/**
 * Valider un mot de passe selon la politique de sécurité
 * @param {string} password - Le mot de passe à valider
 * @returns {Object} - {isValid: boolean, errors: string[]}
 */
export function validatePassword(password) {
  const errors = [];
  
  if (!password || typeof password !== 'string') {
    return { isValid: false, errors: ['Le mot de passe est requis'] };
  }

  // Longueur minimale
  if (password.length < PASSWORD_POLICY.minLength) {
    errors.push(`Le mot de passe doit contenir au moins ${PASSWORD_POLICY.minLength} caractères`);
  }

  // Majuscules requises
  if (PASSWORD_POLICY.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Le mot de passe doit contenir au moins une majuscule');
  }

  // Minuscules requises
  if (PASSWORD_POLICY.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Le mot de passe doit contenir au moins une minuscule');
  }

  // Chiffres requis
  if (PASSWORD_POLICY.requireNumbers && !/\d/.test(password)) {
    errors.push('Le mot de passe doit contenir au moins un chiffre');
  }

  // Caractères spéciaux (optionnel)
  if (PASSWORD_POLICY.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Le mot de passe doit contenir au moins un caractère spécial');
  }

  // Patterns interdits
  const lowerPassword = password.toLowerCase();
  for (const pattern of PASSWORD_POLICY.forbiddenPatterns) {
    if (lowerPassword.includes(pattern)) {
      errors.push('Le mot de passe contient des termes interdits');
      break;
    }
  }

  return {
    isValid: errors.length === 0,
    errors: errors
  };
}

/**
 * Hasher un mot de passe avec bcrypt
 * @param {string} password - Le mot de passe en clair
 * @returns {Promise<string>} - Le hash du mot de passe
 */
export async function hashPassword(password) {
  try {
    // Valider le mot de passe d'abord
    const validation = validatePassword(password);
    if (!validation.isValid) {
      throw new Error(`Mot de passe invalide: ${validation.errors.join(', ')}`);
    }

    // Générer le salt et hasher
    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    return hashedPassword;
  } catch (error) {
    console.error('Erreur lors du hachage du mot de passe:', error);
    throw new Error('Erreur lors du traitement du mot de passe');
  }
}

/**
 * Vérifier un mot de passe contre son hash
 * @param {string} password - Le mot de passe en clair
 * @param {string} hashedPassword - Le hash stocké en base
 * @returns {Promise<boolean>} - true si le mot de passe correspond
 */
export async function verifyPassword(password, hashedPassword) {
  try {
    if (!password || !hashedPassword) {
      return false;
    }

    const isMatch = await bcrypt.compare(password, hashedPassword);
    return isMatch;
  } catch (error) {
    console.error('Erreur lors de la vérification du mot de passe:', error);
    return false;
  }
}

/**
 * Générer un mot de passe temporaire sécurisé
 * @param {number} length - Longueur du mot de passe (défaut: 12)
 * @returns {string} - Mot de passe temporaire
 */
export function generateTemporaryPassword(length = 12) {
  const uppercaseChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercaseChars = 'abcdefghijklmnopqrstuvwxyz';
  const numberChars = '0123456789';
  const specialChars = '!@#$%^&*';
  
  let password = '';
  
  // Garantir au moins un caractère de chaque type requis
  password += uppercaseChars[Math.floor(Math.random() * uppercaseChars.length)];
  password += lowercaseChars[Math.floor(Math.random() * lowercaseChars.length)];
  password += numberChars[Math.floor(Math.random() * numberChars.length)];
  
  // Compléter avec des caractères aléatoires
  const allChars = uppercaseChars + lowercaseChars + numberChars + specialChars;
  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  // Mélanger les caractères
  return password.split('').sort(() => 0.5 - Math.random()).join('');
}

/**
 * Vérifier si un mot de passe doit être changé (âge, etc.)
 * @param {Date} lastPasswordChange - Date du dernier changement
 * @param {number} maxAgeInDays - Âge maximum en jours (défaut: 90)
 * @returns {boolean} - true si le mot de passe doit être changé
 */
export function shouldChangePassword(lastPasswordChange, maxAgeInDays = 90) {
  if (!lastPasswordChange) {
    return true; // Forcer le changement si pas de date
  }
  
  const now = new Date();
  const daysSinceChange = (now - new Date(lastPasswordChange)) / (1000 * 60 * 60 * 24);
  
  return daysSinceChange >= maxAgeInDays;
}

/**
 * Calculer la force d'un mot de passe
 * @param {string} password - Le mot de passe à évaluer
 * @returns {Object} - {strength: 'weak'|'medium'|'strong', score: number}
 */
export function calculatePasswordStrength(password) {
  let score = 0;
  
  if (!password) {
    return { strength: 'weak', score: 0 };
  }
  
  // Longueur
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (password.length >= 16) score += 1;
  
  // Types de caractères
  if (/[a-z]/.test(password)) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 1;
  
  // Diversité
  const uniqueChars = new Set(password).size;
  if (uniqueChars >= password.length * 0.7) score += 1;
  
  // Pas de patterns répétitifs
  if (!/(.)\1{2,}/.test(password)) score += 1;
  
  let strength;
  if (score <= 3) strength = 'weak';
  else if (score <= 6) strength = 'medium';
  else strength = 'strong';
  
  return { strength, score };
}

// Exporter la configuration pour les tests
export { PASSWORD_POLICY, SALT_ROUNDS };