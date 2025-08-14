#!/usr/bin/env node
import bcrypt from 'bcryptjs';

/**
 * Script ultra-simple pour hasher des mots de passe
 * Usage: node hashpassword-simple.js "monmotdepasse"
 */

async function hashPasswordSimple() {
  const password = process.argv[2];
  
  if (!password) {
    console.log('❌ Usage: node hashpassword-simple.js "votre_mot_de_passe"');
    console.log('');
    console.log('Exemple: node hashpassword-simple.js "Fidouda*12"');
    process.exit(1);
  }

  try {
    console.log('🔐 Hachage du mot de passe...');
    console.log('');
    
    // Générer le hash avec bcrypt (12 rounds)
    const hash = await bcrypt.hash(password, 12);
    
    console.log('📝 Résultats:');
    console.log('─'.repeat(70));
    console.log('Mot de passe:', password);
    console.log('Hash bcrypt:', hash);
    console.log('');
    console.log('📋 SQL pour insérer en base:');
    console.log(`UPDATE users SET password_hash = '${hash}' WHERE username = 'admin';`);
    console.log('');
    console.log('✅ Hash généré avec succès !');
    
  } catch (error) {
    console.error('❌ Erreur lors du hachage:', error.message);
    process.exit(1);
  }
}

hashPasswordSimple().then(() => process.exit(0));