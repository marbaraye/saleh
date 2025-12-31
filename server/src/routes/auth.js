/**
 * Routes d'authentification
 */
const express = require('express');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const db = require('../config/database');
const { generateToken, generateRefreshToken, authenticate } = require('../middleware/auth');
const { asyncHandler, errors } = require('../middleware/errorHandler');

const router = express.Router();

/**
 * POST /api/auth/register
 * Inscription d'un nouvel utilisateur
 */
router.post('/register', [
  body('username')
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('Le nom d\'utilisateur doit contenir entre 3 et 50 caractères')
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Le nom d\'utilisateur ne peut contenir que des lettres, chiffres, tirets et underscores'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Email invalide'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Le mot de passe doit contenir au moins 8 caractères')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre')
], asyncHandler(async (req, res) => {
  // Validation
  const validationErrors = validationResult(req);
  if (!validationErrors.isEmpty()) {
    throw errors.validation(validationErrors.array());
  }
  
  const { username, email, password } = req.body;
  
  // Vérifier si l'utilisateur existe déjà
  const existingUser = await db.query(
    'SELECT id FROM users WHERE email = $1 OR username = $2',
    [email, username]
  );
  
  if (existingUser.rows.length > 0) {
    throw errors.conflict('Un utilisateur avec cet email ou ce nom d\'utilisateur existe déjà');
  }
  
  // Hasher le mot de passe
  const passwordHash = await bcrypt.hash(password, 12);
  
  // Créer l'utilisateur
  const result = await db.query(`
    INSERT INTO users (username, email, password_hash)
    VALUES ($1, $2, $3)
    RETURNING id, username, email, created_at, total_points, current_level
  `, [username, email, passwordHash]);
  
  const user = result.rows[0];
  
  // Générer les tokens
  const token = generateToken(user.id);
  const refreshToken = generateRefreshToken(user.id);
  
  res.status(201).json({
    message: 'Inscription réussie',
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      totalPoints: user.total_points,
      currentLevel: user.current_level,
      createdAt: user.created_at
    },
    token,
    refreshToken
  });
}));

/**
 * POST /api/auth/login
 * Connexion d'un utilisateur
 */
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
], asyncHandler(async (req, res) => {
  const validationErrors = validationResult(req);
  if (!validationErrors.isEmpty()) {
    throw errors.validation(validationErrors.array());
  }
  
  const { email, password } = req.body;
  
  // Récupérer l'utilisateur
  const result = await db.query(`
    SELECT id, username, email, password_hash, is_active, total_points, current_level, streak_days, avatar_url
    FROM users WHERE email = $1
  `, [email]);
  
  if (result.rows.length === 0) {
    throw errors.unauthorized('Email ou mot de passe incorrect');
  }
  
  const user = result.rows[0];
  
  if (!user.is_active) {
    throw errors.forbidden('Ce compte a été désactivé');
  }
  
  // Vérifier le mot de passe
  const isValidPassword = await bcrypt.compare(password, user.password_hash);
  if (!isValidPassword) {
    throw errors.unauthorized('Email ou mot de passe incorrect');
  }
  
  // Mettre à jour last_login
  await db.query(
    'UPDATE users SET last_login = NOW() WHERE id = $1',
    [user.id]
  );
  
  // Générer les tokens
  const token = generateToken(user.id);
  const refreshToken = generateRefreshToken(user.id);
  
  res.json({
    message: 'Connexion réussie',
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      avatarUrl: user.avatar_url,
      totalPoints: user.total_points,
      currentLevel: user.current_level,
      streakDays: user.streak_days
    },
    token,
    refreshToken
  });
}));

/**
 * POST /api/auth/refresh
 * Rafraîchir le token d'accès
 */
router.post('/refresh', [
  body('refreshToken').notEmpty()
], asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  const jwt = require('jsonwebtoken');
  const { JWT_SECRET } = require('../middleware/auth');
  
  try {
    const decoded = jwt.verify(refreshToken, JWT_SECRET);
    
    if (decoded.type !== 'refresh') {
      throw errors.unauthorized('Token de rafraîchissement invalide');
    }
    
    // Vérifier que l'utilisateur existe
    const result = await db.query(
      'SELECT id, is_active FROM users WHERE id = $1',
      [decoded.userId]
    );
    
    if (result.rows.length === 0 || !result.rows[0].is_active) {
      throw errors.unauthorized('Utilisateur non trouvé ou désactivé');
    }
    
    // Générer un nouveau token
    const newToken = generateToken(decoded.userId);
    
    res.json({
      token: newToken
    });
  } catch (err) {
    throw errors.unauthorized('Token de rafraîchissement invalide ou expiré');
  }
}));

/**
 * GET /api/auth/me
 * Récupérer les informations de l'utilisateur connecté
 */
router.get('/me', authenticate, asyncHandler(async (req, res) => {
  const result = await db.query(`
    SELECT 
      u.id, u.username, u.email, u.avatar_url, u.bio,
      u.total_points, u.current_level, u.streak_days,
      u.created_at, u.last_login, u.preferences,
      COUNT(DISTINCT ub.badge_id) as badges_count,
      COUNT(DISTINCT CASE WHEN up.status = 'completed' THEN up.topic_id END) as topics_completed
    FROM users u
    LEFT JOIN user_badges ub ON u.id = ub.user_id
    LEFT JOIN user_progress up ON u.id = up.user_id
    WHERE u.id = $1
    GROUP BY u.id
  `, [req.user.id]);
  
  if (result.rows.length === 0) {
    throw errors.notFound('Utilisateur');
  }
  
  const user = result.rows[0];
  
  res.json({
    id: user.id,
    username: user.username,
    email: user.email,
    avatarUrl: user.avatar_url,
    bio: user.bio,
    totalPoints: user.total_points,
    currentLevel: user.current_level,
    streakDays: user.streak_days,
    badgesCount: parseInt(user.badges_count),
    topicsCompleted: parseInt(user.topics_completed),
    createdAt: user.created_at,
    lastLogin: user.last_login,
    preferences: user.preferences
  });
}));

/**
 * PUT /api/auth/password
 * Changer le mot de passe
 */
router.put('/password', authenticate, [
  body('currentPassword').notEmpty(),
  body('newPassword')
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
], asyncHandler(async (req, res) => {
  const validationErrors = validationResult(req);
  if (!validationErrors.isEmpty()) {
    throw errors.validation(validationErrors.array());
  }
  
  const { currentPassword, newPassword } = req.body;
  
  // Récupérer le hash actuel
  const result = await db.query(
    'SELECT password_hash FROM users WHERE id = $1',
    [req.user.id]
  );
  
  // Vérifier le mot de passe actuel
  const isValid = await bcrypt.compare(currentPassword, result.rows[0].password_hash);
  if (!isValid) {
    throw errors.unauthorized('Mot de passe actuel incorrect');
  }
  
  // Hasher et mettre à jour le nouveau mot de passe
  const newHash = await bcrypt.hash(newPassword, 12);
  await db.query(
    'UPDATE users SET password_hash = $1 WHERE id = $2',
    [newHash, req.user.id]
  );
  
  res.json({ message: 'Mot de passe mis à jour avec succès' });
}));

/**
 * POST /api/auth/logout
 * Déconnexion (côté client, invalide le token)
 */
router.post('/logout', authenticate, asyncHandler(async (req, res) => {
  // Dans une implémentation plus avancée, on pourrait blacklister le token
  // Pour l'instant, le client doit simplement supprimer le token
  res.json({ message: 'Déconnexion réussie' });
}));

module.exports = router;
