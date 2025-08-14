import { User } from '../models/User.js';
import { generateTemporaryPassword } from '../utils/password.js';

/**
 * Script pour créer un utilisateur administrateur
 * Usage: node scripts/createAdmin.js
 */

async function createAdmin() {
  try {
    console.log('🔧 Création de l\'utilisateur administrateur...');
    
    // Vérifier si un admin existe déjà
    const existingAdmin = await User.findByUsername('admin');
    if (existingAdmin) {
      console.log('⚠️  Un utilisateur admin existe déjà');
      console.log('Voulez-vous le supprimer d\'abord ?');
      return;
    }
    
    // Générer un mot de passe temporaire sécurisé
    const tempPassword = generateTemporaryPassword(12);
    
    // Créer l'admin
    const adminData = {
      username: 'admin',
      email: 'admin@cynergyiq.com',
      password: tempPassword,
      roles: ['admin'],
      firstName: 'Super',
      lastName: 'Admin'
    };
    
    const admin = await User.create(adminData);
    
    console.log('✅ Utilisateur administrateur créé avec succès !');
    console.log('📧 Email:', admin.email);
    console.log('👤 Username:', admin.username);
    console.log('🔑 Mot de passe temporaire:', tempPassword);
    console.log('');
    console.log('⚠️  IMPORTANT: Changez ce mot de passe lors de la première connexion !');
    console.log('🔒 Le mot de passe respecte la politique de sécurité');
    
  } catch (error) {
    console.error('❌ Erreur lors de la création de l\'admin:', error.message);
    process.exit(1);
  }
}

// Fonction pour mettre à jour le mot de passe admin existant
async function updateAdminPassword() {
  try {
    const admin = await User.findByUsername('admin');
    if (!admin) {
      console.log('❌ Aucun utilisateur admin trouvé');
      return;
    }
    
    const newPassword = generateTemporaryPassword(12);
    await admin.changePassword(newPassword);
    
    console.log('✅ Mot de passe admin mis à jour !');
    console.log('🔑 Nouveau mot de passe:', newPassword);
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

// Exécuter selon l'argument passé
const action = process.argv[2];

if (action === 'update-password') {
  updateAdminPassword().then(() => process.exit(0));
} else {
  createAdmin().then(() => process.exit(0));
}

export { createAdmin, updateAdminPassword };