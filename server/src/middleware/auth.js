/**
 * Middleware d'authentification JWT
 */
const jwt = require('jsonwebtoken');
const db = require('../config/database');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_in_production';

/**
 * Vérifie le token JWT et attache l'utilisateur à la requête
 */
const authenticate = async (req, res, next) => {
  try {
    // Récupérer le token du header Authorization
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Token d\'authentification requis'
      });
    }
    
    const token = authHeader.substring(7);
    
    // Vérifier le token
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
          error: 'Token expiré',
          code: 'TOKEN_EXPIRED'
        });
      }
      return res.status(401).json({
        error: 'Token invalide'
      });
    }
    
    // Vérifier que l'utilisateur existe toujours
    const result = await db.query(
      'SELECT id, username, email, role, is_active FROM users WHERE id = $1',
      [decoded.userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(401).json({
        error: 'Utilisateur non trouvé'
      });
    }
    
    const user = result.rows[0];
    
    if (!user.is_active) {
      return res.status(403).json({
        error: 'Compte désactivé'
      });
    }
    
    // Attacher l'utilisateur à la requête
    req.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role
    };
    
    next();
  } catch (error) {
    console.error('Erreur d\'authentification:', error);
    res.status(500).json({
      error: 'Erreur d\'authentification'
    });
  }
};

/**
 * Middleware optionnel - attache l'utilisateur si un token est présent
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }
    
    const token = authHeader.substring(7);
    
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      
      const result = await db.query(
        'SELECT id, username, email, role FROM users WHERE id = $1 AND is_active = true',
        [decoded.userId]
      );
      
      if (result.rows.length > 0) {
        req.user = result.rows[0];
      }
    } catch (err) {
      // Token invalide, on continue sans utilisateur
    }
    
    next();
  } catch (error) {
    next();
  }
};

/**
 * Vérifie que l'utilisateur a le rôle admin
 */
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      error: 'Accès réservé aux administrateurs'
    });
  }
  next();
};

/**
 * Vérifie que l'utilisateur a le rôle admin ou moderator
 */
const requireModerator = (req, res, next) => {
  if (!req.user || !['admin', 'moderator'].includes(req.user.role)) {
    return res.status(403).json({
      error: 'Accès réservé aux modérateurs'
    });
  }
  next();
};

/**
 * Génère un token JWT
 */
const generateToken = (userId, expiresIn = '7d') => {
  return jwt.sign(
    { userId },
    JWT_SECRET,
    { expiresIn }
  );
};

/**
 * Génère un token de rafraîchissement
 */
const generateRefreshToken = (userId) => {
  return jwt.sign(
    { userId, type: 'refresh' },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
};

module.exports = {
  authenticate,
  optionalAuth,
  requireAdmin,
  requireModerator,
  generateToken,
  generateRefreshToken,
  JWT_SECRET
};
