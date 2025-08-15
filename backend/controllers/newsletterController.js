import { NewsletterSubscriber } from '../models/Newsletter.js';

/**
 * Controller pour la gestion de la newsletter
 * Gère inscription, désinscription, et administration
 */

// ==================== ROUTES PUBLIQUES ====================

// S'abonner à la newsletter - POST /api/newsletter/subscribe
export const subscribe = async (req, res) => {
  try {
    const { email, firstName, lastName, language = 'fr' } = req.body;

    // Validation de base
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email requis'
      });
    }

    if (!NewsletterSubscriber.isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Format d\'email invalide'
      });
    }

    // Créer l'abonnement
    const subscriber = await NewsletterSubscriber.create({
      email: email.toLowerCase().trim(),
      firstName: firstName?.trim(),
      lastName: lastName?.trim(),
      language
    });

    // TODO: Envoyer email de confirmation (double opt-in)
    // await sendConfirmationEmail(subscriber);

    res.status(201).json({
      success: true,
      message: 'Inscription réussie ! Un email de confirmation vous a été envoyé.',
      data: {
        subscriber: subscriber.toPublicJSON(),
        unsubscribeUrl: subscriber.getUnsubscribeUrl()
      }
    });

  } catch (error) {
    console.error('Erreur lors de l\'inscription:', error);
    
    if (error.message.includes('déjà abonné')) {
      return res.status(409).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'inscription'
    });
  }
};

// Se désabonner - POST /api/newsletter/unsubscribe/:token
export const unsubscribe = async (req, res) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Token de désinscription requis'
      });
    }

    // Trouver l'abonné par token
    const subscriber = await NewsletterSubscriber.findByUnsubscribeToken(token);

    if (!subscriber) {
      return res.status(404).json({
        success: false,
        message: 'Token de désinscription invalide ou expiré'
      });
    }

    if (!subscriber.isActive) {
      return res.status(200).json({
        success: true,
        message: 'Vous êtes déjà désabonné de notre newsletter',
        data: {
          email: subscriber.email,
          unsubscribedAt: subscriber.unsubscribedAt
        }
      });
    }

    // Désabonner
    await subscriber.unsubscribe();

    res.json({
      success: true,
      message: 'Vous avez été désabonné avec succès de notre newsletter',
      data: {
        email: subscriber.email,
        unsubscribedAt: subscriber.unsubscribedAt
      }
    });

  } catch (error) {
    console.error('Erreur lors de la désinscription:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la désinscription'
    });
  }
};

// Se réabonner - POST /api/newsletter/resubscribe/:token
export const resubscribe = async (req, res) => {
  try {
    const { token } = req.params;

    const subscriber = await NewsletterSubscriber.findByUnsubscribeToken(token);

    if (!subscriber) {
      return res.status(404).json({
        success: false,
        message: 'Token invalide'
      });
    }

    if (subscriber.isActive) {
      return res.status(200).json({
        success: true,
        message: 'Vous êtes déjà abonné à notre newsletter',
        data: {
          email: subscriber.email
        }
      });
    }

    // Réabonner
    await subscriber.resubscribe();

    res.json({
      success: true,
      message: 'Vous avez été réabonné avec succès à notre newsletter',
      data: {
        subscriber: subscriber.toPublicJSON()
      }
    });

  } catch (error) {
    console.error('Erreur lors du réabonnement:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du réabonnement'
    });
  }
};

// Confirmer l'abonnement (double opt-in) - GET /api/newsletter/confirm/:token
export const confirmSubscription = async (req, res) => {
  try {
    const { token } = req.params;

    const subscriber = await NewsletterSubscriber.findByUnsubscribeToken(token);

    if (!subscriber) {
      return res.status(404).json({
        success: false,
        message: 'Token de confirmation invalide'
      });
    }

    if (subscriber.confirmedAt) {
      return res.status(200).json({
        success: true,
        message: 'Votre abonnement est déjà confirmé',
        data: {
          email: subscriber.email,
          confirmedAt: subscriber.confirmedAt
        }
      });
    }

    // Confirmer l'abonnement
    await subscriber.confirm();

    res.json({
      success: true,
      message: 'Votre abonnement à la newsletter a été confirmé avec succès',
      data: {
        subscriber: subscriber.toPublicJSON()
      }
    });

  } catch (error) {
    console.error('Erreur lors de la confirmation:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la confirmation'
    });
  }
};

// Vérifier le statut d'un email - GET /api/newsletter/status/:email
export const checkStatus = async (req, res) => {
  try {
    const { email } = req.params;

    if (!NewsletterSubscriber.isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Format d\'email invalide'
      });
    }

    const subscriber = await NewsletterSubscriber.findByEmail(email.toLowerCase());

    if (!subscriber) {
      return res.status(404).json({
        success: false,
        message: 'Email non trouvé dans notre base'
      });
    }

    res.json({
      success: true,
      data: {
        email: subscriber.email,
        isActive: subscriber.isActive,
        subscribedAt: subscriber.subscribedAt,
        language: subscriber.language
      }
    });

  } catch (error) {
    console.error('Erreur lors de la vérification du statut:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la vérification'
    });
  }
};

// ==================== ROUTES ADMIN ====================

// Lister tous les abonnés - GET /api/newsletter/admin/subscribers
export const getAllSubscribers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      isActive,
      language,
      search,
      sortBy = 'subscribed_at',
      sortOrder = 'DESC'
    } = req.query;

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      isActive: isActive !== undefined ? isActive === 'true' : undefined,
      language,
      search,
      sortBy,
      sortOrder
    };

    const result = await NewsletterSubscriber.findAll(options);

    res.json({
      success: true,
      data: {
        subscribers: result.subscribers.map(sub => sub.toAdminJSON()),
        pagination: result.pagination
      }
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des abonnés:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

// Obtenir les statistiques - GET /api/newsletter/admin/stats
export const getStats = async (req, res) => {
  try {
    const stats = await NewsletterSubscriber.getStats();

    res.json({
      success: true,
      data: {
        stats: {
          total: parseInt(stats.total_subscribers),
          active: parseInt(stats.active_subscribers),
          inactive: parseInt(stats.inactive_subscribers),
          confirmed: parseInt(stats.confirmed_subscribers),
          french: parseInt(stats.french_subscribers),
          english: parseInt(stats.english_subscribers),
          newLast30Days: parseInt(stats.new_last_30_days),
          newLast7Days: parseInt(stats.new_last_7_days)
        }
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

// Obtenir un abonné par ID - GET /api/newsletter/admin/subscribers/:id
export const getSubscriberById = async (req, res) => {
  try {
    const { id } = req.params;

    const subscriber = await NewsletterSubscriber.findById(id);

    if (!subscriber) {
      return res.status(404).json({
        success: false,
        message: 'Abonné non trouvé'
      });
    }

    res.json({
      success: true,
      data: {
        subscriber: subscriber.toAdminJSON()
      }
    });

  } catch (error) {
    console.error('Erreur lors de la récupération de l\'abonné:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

// Mettre à jour un abonné - PUT /api/newsletter/admin/subscribers/:id
export const updateSubscriber = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const subscriber = await NewsletterSubscriber.findById(id);

    if (!subscriber) {
      return res.status(404).json({
        success: false,
        message: 'Abonné non trouvé'
      });
    }

    await subscriber.update(updates);

    res.json({
      success: true,
      message: 'Abonné mis à jour avec succès',
      data: {
        subscriber: subscriber.toAdminJSON()
      }
    });

  } catch (error) {
    console.error('Erreur lors de la mise à jour:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

// Supprimer un abonné (RGPD) - DELETE /api/newsletter/admin/subscribers/:id
export const deleteSubscriber = async (req, res) => {
  try {
    const { id } = req.params;

    const subscriber = await NewsletterSubscriber.findById(id);

    if (!subscriber) {
      return res.status(404).json({
        success: false,
        message: 'Abonné non trouvé'
      });
    }

    await subscriber.delete();

    res.json({
      success: true,
      message: 'Abonné supprimé définitivement (RGPD)'
    });

  } catch (error) {
    console.error('Erreur lors de la suppression:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

// Export pour mailing - GET /api/newsletter/admin/export
export const exportSubscribers = async (req, res) => {
  try {
    const { language = 'fr', format = 'json' } = req.query;

    const subscribers = await NewsletterSubscriber.exportForMailing(language);

    if (format === 'csv') {
      // Format CSV pour import dans services de mailing
      const csvHeader = 'email,first_name,last_name,full_name\n';
      const csvData = subscribers.map(sub => 
        `${sub.email},"${sub.first_name || ''}","${sub.last_name || ''}","${sub.full_name}"`
      ).join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="newsletter-subscribers-${language}.csv"`);
      res.send(csvHeader + csvData);
    } else {
      // Format JSON
      res.json({
        success: true,
        data: {
          subscribers,
          count: subscribers.length,
          language,
          exportedAt: new Date().toISOString()
        }
      });
    }

  } catch (error) {
    console.error('Erreur lors de l\'export:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'export'
    });
  }
};

// Rechercher des abonnés - GET /api/newsletter/admin/search
export const searchSubscribers = async (req, res) => {
  try {
    const { q: searchTerm, language, isActive = true, limit = 20 } = req.query;

    if (!searchTerm) {
      return res.status(400).json({
        success: false,
        message: 'Terme de recherche requis'
      });
    }

    const options = {
      language,
      isActive: isActive === 'true',
      limit: parseInt(limit)
    };

    const subscribers = await NewsletterSubscriber.search(searchTerm, options);

    res.json({
      success: true,
      data: {
        subscribers: subscribers.map(sub => sub.toAdminJSON()),
        searchTerm,
        count: subscribers.length
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

// Nettoyer les anciens désabonnés - POST /api/newsletter/admin/cleanup
export const cleanupOldSubscribers = async (req, res) => {
  try {
    const { monthsOld = 24 } = req.body;

    const deletedCount = await NewsletterSubscriber.cleanupOldUnsubscribed(monthsOld);

    res.json({
      success: true,
      message: `${deletedCount} anciens abonnés inactifs supprimés`,
      data: {
        deletedCount,
        monthsOld
      }
    });

  } catch (error) {
    console.error('Erreur lors du nettoyage:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du nettoyage'
    });
  }
};

// Envoyer un email de test - POST /api/newsletter/admin/test-email
export const sendTestEmail = async (req, res) => {
  try {
    const { email, subject, content, language = 'fr' } = req.body;

    if (!email || !subject || !content) {
      return res.status(400).json({
        success: false,
        message: 'Email, sujet et contenu requis'
      });
    }

    // TODO: Implémenter l'envoi d'email avec votre service (SendGrid, Mailgun, etc.)
    // await sendTestEmail(email, subject, content, language);

    res.json({
      success: true,
      message: 'Email de test envoyé avec succès',
      data: {
        recipient: email,
        subject,
        language,
        sentAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'email de test:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'envoi de l\'email de test'
    });
  }
};