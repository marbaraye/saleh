/**
 * Middleware de gestion des erreurs
 */

/**
 * Classe d'erreur personnalisée pour l'API
 */
class ApiError extends Error {
  constructor(statusCode, message, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Erreurs prédéfinies
 */
const errors = {
  badRequest: (message = 'Requête invalide', details = null) => 
    new ApiError(400, message, details),
  
  unauthorized: (message = 'Non autorisé') => 
    new ApiError(401, message),
  
  forbidden: (message = 'Accès interdit') => 
    new ApiError(403, message),
  
  notFound: (resource = 'Ressource') => 
    new ApiError(404, `${resource} non trouvé(e)`),
  
  conflict: (message = 'Conflit de données') => 
    new ApiError(409, message),
  
  validation: (details) => 
    new ApiError(422, 'Erreur de validation', details),
  
  internal: (message = 'Erreur interne du serveur') => 
    new ApiError(500, message)
};

/**
 * Middleware de gestion des erreurs
 */
const errorHandler = (err, req, res, next) => {
  // Log de l'erreur
  console.error('❌ Erreur:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });
  
  // Erreur API personnalisée
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      error: err.message,
      details: err.details,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
  }
  
  // Erreur de validation express-validator
  if (err.array && typeof err.array === 'function') {
    return res.status(422).json({
      error: 'Erreur de validation',
      details: err.array()
    });
  }
  
  // Erreur PostgreSQL
  if (err.code) {
    switch (err.code) {
      case '23505': // Unique violation
        return res.status(409).json({
          error: 'Cette valeur existe déjà',
          details: err.detail
        });
      case '23503': // Foreign key violation
        return res.status(400).json({
          error: 'Référence invalide',
          details: err.detail
        });
      case '22P02': // Invalid text representation
        return res.status(400).json({
          error: 'Format de données invalide'
        });
      default:
        console.error('Erreur PostgreSQL:', err.code, err.message);
    }
  }
  
  // Erreur JWT
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'Token invalide'
    });
  }
  
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: 'Token expiré',
      code: 'TOKEN_EXPIRED'
    });
  }
  
  // Erreur de syntaxe JSON
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      error: 'JSON invalide dans le corps de la requête'
    });
  }
  
  // Erreur par défaut
  res.status(500).json({
    error: process.env.NODE_ENV === 'production' 
      ? 'Erreur interne du serveur' 
      : err.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

/**
 * Wrapper async pour les routes
 * Permet d'utiliser async/await sans try/catch
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = {
  ApiError,
  errors,
  errorHandler,
  asyncHandler
};
