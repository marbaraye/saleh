/**
 * Middleware de logging des requêtes
 */

/**
 * Logger simple pour les requêtes HTTP
 */
const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  // Capturer la fin de la réponse
  res.on('finish', () => {
    const duration = Date.now() - start;
    const statusCode = res.statusCode;
    
    // Couleur selon le status
    let statusColor = '\x1b[32m'; // Vert
    if (statusCode >= 400) statusColor = '\x1b[33m'; // Jaune
    if (statusCode >= 500) statusColor = '\x1b[31m'; // Rouge
    
    // Format du log
    const log = [
      `\x1b[36m${req.method}\x1b[0m`,
      req.originalUrl,
      `${statusColor}${statusCode}\x1b[0m`,
      `${duration}ms`
    ].join(' ');
    
    // Ne pas logger les requêtes de santé en production
    if (process.env.NODE_ENV === 'production' && req.originalUrl === '/api/health') {
      return;
    }
    
    console.log(`📡 ${log}`);
  });
  
  next();
};

/**
 * Logger pour les erreurs
 */
const errorLogger = (err, req, res, next) => {
  console.error(`❌ ${req.method} ${req.originalUrl}`, {
    error: err.message,
    stack: err.stack,
    body: req.body,
    user: req.user?.id
  });
  next(err);
};

module.exports = {
  requestLogger,
  errorLogger
};
