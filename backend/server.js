import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Import routes
import authRoutes from './routes/auth.js';
import blogRoutes from './routes/blog.js';
import jobRoutes from './routes/jobs.js';
import newsletterRoutes from './routes/newsletter.js';
// import contentRoutes from './routes/content.js';

// Configuration
dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Servir les fichiers uploadés
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes principales
app.get('/', (req, res) => {
  res.json({ 
    message: 'CynergyIQ Website API',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/blog', blogRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/newsletter', newsletterRoutes);
// app.use('/api/content', contentRoutes);

// Route test database connection
app.get('/api/health', async (req, res) => {
  try {
    const { testConnection } = await import('./config/database.js');
    const dbConnected = await testConnection();
    
    res.json({ 
      status: 'OK', 
      database: dbConnected ? 'Connected' : 'Disconnected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'ERROR', 
      message: error.message 
    });
  }
});

// Gestion des erreurs globales
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  
  if (process.env.NODE_ENV === 'development') {
    res.status(500).json({
      message: err.message,
      stack: err.stack
    });
  } else {
    res.status(500).json({
      message: 'Erreur interne du serveur'
    });
  }
});

// Route 404 - utiliser une fonction plus compatible
app.all('*', (req, res) => {
  res.status(404).json({
    message: 'Route non trouvée'
  });
});

// Démarrage du serveur
app.listen(PORT, () => {
  console.log(`🚀 Serveur CynergyIQ démarré sur le port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 URL: http://localhost:${PORT}`);
  
  if (process.env.NODE_ENV === 'production') {
    console.log('🚂 Railway deployment detected');
  }
});

// Gestion propre de l'arrêt du serveur
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM reçu, arrêt du serveur...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT reçu, arrêt du serveur...');
  process.exit(0);
});