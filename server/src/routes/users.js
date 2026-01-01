/**
 * Routes des utilisateurs
 */
const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { asyncHandler, errors } = require('../middleware/errorHandler');

const router = express.Router();

/**
 * GET /api/users/profile
 * Profil complet de l'utilisateur connecté
 */
router.get('/profile', authenticate, asyncHandler(async (req, res) => {
  const result = await db.query(`
    SELECT 
      u.id, u.username, u.email, u.avatar_url, u.bio,
      u.total_points, u.current_level, u.streak_days,
      u.created_at, u.last_login, u.preferences,
      (SELECT COUNT(*) FROM user_badges WHERE user_id = u.id) as badges_count,
      (SELECT COUNT(*) FROM user_progress WHERE user_id = u.id AND status = 'completed') as topics_completed,
      (SELECT COUNT(DISTINCT project_id) FROM project_submissions WHERE user_id = u.id AND status = 'passed') as projects_completed,
      (SELECT COALESCE(SUM(time_spent_minutes), 0) FROM user_progress WHERE user_id = u.id) as total_time_spent
    FROM users u
    WHERE u.id = $1
  `, [req.user.id]);
  
  if (result.rows.length === 0) {
    throw errors.notFound('Utilisateur');
  }
  
  const user = result.rows[0];
  
  // Récupérer le rang
  const rankResult = await db.query(`
    SELECT COUNT(*) + 1 as rank
    FROM users
    WHERE total_points > $1 AND is_active = true
  `, [user.total_points]);
  
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
    projectsCompleted: parseInt(user.projects_completed),
    totalTimeSpentMinutes: parseInt(user.total_time_spent),
    rank: parseInt(rankResult.rows[0].rank),
    createdAt: user.created_at,
    lastLogin: user.last_login,
    preferences: user.preferences
  });
}));

/**
 * PUT /api/users/profile
 * Mettre à jour le profil
 */
router.put('/profile', authenticate, [
  body('username')
    .optional()
    .trim()
    .isLength({ min: 3, max: 50 })
    .matches(/^[a-zA-Z0-9_-]+$/),
  body('bio').optional().isLength({ max: 500 }),
  body('avatarUrl').optional().isURL().or(body('avatarUrl').isEmpty())
], asyncHandler(async (req, res) => {
  const validationErrors = validationResult(req);
  if (!validationErrors.isEmpty()) {
    throw errors.validation(validationErrors.array());
  }
  
  const { username, bio, avatarUrl } = req.body;
  const updates = [];
  const values = [];
  let paramIndex = 1;
  
  if (username !== undefined) {
    // Vérifier l'unicité du username
    const existing = await db.query(
      'SELECT id FROM users WHERE username = $1 AND id != $2',
      [username, req.user.id]
    );
    if (existing.rows.length > 0) {
      throw errors.conflict('Ce nom d\'utilisateur est déjà pris');
    }
    updates.push(`username = $${paramIndex}`);
    values.push(username);
    paramIndex++;
  }
  
  if (bio !== undefined) {
    updates.push(`bio = $${paramIndex}`);
    values.push(bio);
    paramIndex++;
  }
  
  if (avatarUrl !== undefined) {
    updates.push(`avatar_url = $${paramIndex}`);
    values.push(avatarUrl || null);
    paramIndex++;
  }
  
  if (updates.length === 0) {
    throw errors.badRequest('Aucune donnée à mettre à jour');
  }
  
  values.push(req.user.id);
  
  const result = await db.query(`
    UPDATE users 
    SET ${updates.join(', ')}
    WHERE id = $${paramIndex}
    RETURNING username, bio, avatar_url
  `, values);
  
  res.json({
    message: 'Profil mis à jour',
    user: {
      username: result.rows[0].username,
      bio: result.rows[0].bio,
      avatarUrl: result.rows[0].avatar_url
    }
  });
}));

/**
 * PUT /api/users/preferences
 * Mettre à jour les préférences
 */
router.put('/preferences', authenticate, asyncHandler(async (req, res) => {
  const { preferences } = req.body;
  
  if (!preferences || typeof preferences !== 'object') {
    throw errors.badRequest('Préférences invalides');
  }
  
  // Fusionner avec les préférences existantes
  const result = await db.query(`
    UPDATE users 
    SET preferences = preferences || $1
    WHERE id = $2
    RETURNING preferences
  `, [JSON.stringify(preferences), req.user.id]);
  
  res.json({
    message: 'Préférences mises à jour',
    preferences: result.rows[0].preferences
  });
}));

/**
 * GET /api/users/:username
 * Profil public d'un utilisateur
 */
router.get('/:username', asyncHandler(async (req, res) => {
  const { username } = req.params;
  
  const result = await db.query(`
    SELECT 
      u.id, u.username, u.avatar_url, u.bio,
      u.total_points, u.current_level, u.streak_days,
      u.created_at,
      (SELECT COUNT(*) FROM user_badges WHERE user_id = u.id) as badges_count,
      (SELECT COUNT(*) FROM user_progress WHERE user_id = u.id AND status = 'completed') as topics_completed,
      (SELECT COUNT(DISTINCT project_id) FROM project_submissions WHERE user_id = u.id AND status = 'passed') as projects_completed
    FROM users u
    WHERE u.username = $1 AND u.is_active = true
  `, [username]);
  
  if (result.rows.length === 0) {
    throw errors.notFound('Utilisateur');
  }
  
  const user = result.rows[0];
  
  // Récupérer les badges publics
  const badgesResult = await db.query(`
    SELECT b.id, b.name, b.icon, b.rarity, ub.earned_at
    FROM user_badges ub
    JOIN badges b ON b.id = ub.badge_id
    WHERE ub.user_id = $1
    ORDER BY ub.earned_at DESC
    LIMIT 6
  `, [user.id]);
  
  // Récupérer le rang
  const rankResult = await db.query(`
    SELECT COUNT(*) + 1 as rank
    FROM users
    WHERE total_points > $1 AND is_active = true
  `, [user.total_points]);
  
  res.json({
    id: user.id,
    username: user.username,
    avatarUrl: user.avatar_url,
    bio: user.bio,
    totalPoints: user.total_points,
    currentLevel: user.current_level,
    streakDays: user.streak_days,
    badgesCount: parseInt(user.badges_count),
    topicsCompleted: parseInt(user.topics_completed),
    projectsCompleted: parseInt(user.projects_completed),
    rank: parseInt(rankResult.rows[0].rank),
    createdAt: user.created_at,
    recentBadges: badgesResult.rows.map(b => ({
      id: b.id,
      name: b.name,
      icon: b.icon,
      rarity: b.rarity,
      earnedAt: b.earned_at
    }))
  });
}));

/**
 * GET /api/users/:username/activity
 * Activité récente d'un utilisateur
 */
router.get('/:username/activity', asyncHandler(async (req, res) => {
  const { username } = req.params;
  
  // Vérifier que l'utilisateur existe
  const userResult = await db.query(
    'SELECT id FROM users WHERE username = $1 AND is_active = true',
    [username]
  );
  
  if (userResult.rows.length === 0) {
    throw errors.notFound('Utilisateur');
  }
  
  const userId = userResult.rows[0].id;
  
  const result = await db.query(`
    SELECT activity_type, activity_data, points_earned, created_at
    FROM user_activity
    WHERE user_id = $1
    ORDER BY created_at DESC
    LIMIT 20
  `, [userId]);
  
  res.json(result.rows.map(a => ({
    type: a.activity_type,
    data: a.activity_data,
    pointsEarned: a.points_earned,
    createdAt: a.created_at
  })));
}));

/**
 * DELETE /api/users/account
 * Supprimer son compte
 */
router.delete('/account', authenticate, asyncHandler(async (req, res) => {
  // Désactiver le compte au lieu de le supprimer
  await db.query(`
    UPDATE users SET is_active = false WHERE id = $1
  `, [req.user.id]);
  
  res.json({ message: 'Compte désactivé avec succès' });
}));

module.exports = router;

/**
 * Routes des utilisateurs
 */
const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { asyncHandler, errors } = require('../middleware/errorHandler');

const router = express.Router();

/**
 * GET /api/users/profile
 * Profil complet de l'utilisateur connecté
 */
router.get('/profile', authenticate, asyncHandler(async (req, res) => {
  const result = await db.query(`
    SELECT 
      u.id, u.username, u.email, u.avatar_url, u.bio,
      u.total_points, u.current_level, u.streak_days,
      u.created_at, u.last_login, u.preferences,
      (SELECT COUNT(*) FROM user_badges WHERE user_id = u.id) as badges_count,
      (SELECT COUNT(*) FROM user_progress WHERE user_id = u.id AND status = 'completed') as topics_completed,
      (SELECT COUNT(DISTINCT project_id) FROM project_submissions WHERE user_id = u.id AND status = 'passed') as projects_completed,
      (SELECT COALESCE(SUM(time_spent_minutes), 0) FROM user_progress WHERE user_id = u.id) as total_time_spent
    FROM users u
    WHERE u.id = $1
  `, [req.user.id]);
  
  if (result.rows.length === 0) {
    throw errors.notFound('Utilisateur');
  }
  
  const user = result.rows[0];
  
  // Récupérer le rang
  const rankResult = await db.query(`
    SELECT COUNT(*) + 1 as rank
    FROM users
    WHERE total_points > $1 AND is_active = true
  `, [user.total_points]);
  
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
    projectsCompleted: parseInt(user.projects_completed),
    totalTimeSpentMinutes: parseInt(user.total_time_spent),
    rank: parseInt(rankResult.rows[0].rank),
    createdAt: user.created_at,
    lastLogin: user.last_login,
    preferences: user.preferences
  });
}));

/**
 * PUT /api/users/profile
 * Mettre à jour le profil
 */
router.put('/profile', authenticate, [
  body('username')
    .optional()
    .trim()
    .isLength({ min: 3, max: 50 })
    .matches(/^[a-zA-Z0-9_-]+$/),
  body('bio').optional().isLength({ max: 500 }),
  body('avatarUrl').optional({ checkFalsy: true }).isURL()
], asyncHandler(async (req, res) => {
  const validationErrors = validationResult(req);
  if (!validationErrors.isEmpty()) {
    throw errors.validation(validationErrors.array());
  }
  
  const { username, bio, avatarUrl } = req.body;
  const updates = [];
  const values = [];
  let paramIndex = 1;
  
  if (username !== undefined) {
    // Vérifier l'unicité du username
    const existing = await db.query(
      'SELECT id FROM users WHERE username = $1 AND id != $2',
      [username, req.user.id]
    );
    if (existing.rows.length > 0) {
      throw errors.conflict('Ce nom d\'utilisateur est déjà pris');
    }
    updates.push(`username = $${paramIndex}`);
    values.push(username);
    paramIndex++;
  }
  
  if (bio !== undefined) {
    updates.push(`bio = $${paramIndex}`);
    values.push(bio);
    paramIndex++;
  }
  
  if (avatarUrl !== undefined) {
    updates.push(`avatar_url = $${paramIndex}`);
    values.push(avatarUrl || null);
    paramIndex++;
  }
  
  if (updates.length === 0) {
    throw errors.badRequest('Aucune donnée à mettre à jour');
  }
  
  values.push(req.user.id);
  
  const result = await db.query(`
    UPDATE users 
    SET ${updates.join(', ')}
    WHERE id = $${paramIndex}
    RETURNING username, bio, avatar_url
  `, values);
  
  res.json({
    message: 'Profil mis à jour',
    user: {
      username: result.rows[0].username,
      bio: result.rows[0].bio,
      avatarUrl: result.rows[0].avatar_url
    }
  });
}));

/**
 * PUT /api/users/preferences
 * Mettre à jour les préférences
 */
router.put('/preferences', authenticate, asyncHandler(async (req, res) => {
  const { preferences } = req.body;
  
  if (!preferences || typeof preferences !== 'object') {
    throw errors.badRequest('Préférences invalides');
  }
  
  // Fusionner avec les préférences existantes
  const result = await db.query(`
    UPDATE users 
    SET preferences = preferences || $1
    WHERE id = $2
    RETURNING preferences
  `, [JSON.stringify(preferences), req.user.id]);
  
  res.json({
    message: 'Préférences mises à jour',
    preferences: result.rows[0].preferences
  });
}));

/**
 * GET /api/users/:username
 * Profil public d'un utilisateur
 */
router.get('/:username', asyncHandler(async (req, res) => {
  const { username } = req.params;
  
  const result = await db.query(`
    SELECT 
      u.id, u.username, u.avatar_url, u.bio,
      u.total_points, u.current_level, u.streak_days,
      u.created_at,
      (SELECT COUNT(*) FROM user_badges WHERE user_id = u.id) as badges_count,
      (SELECT COUNT(*) FROM user_progress WHERE user_id = u.id AND status = 'completed') as topics_completed,
      (SELECT COUNT(DISTINCT project_id) FROM project_submissions WHERE user_id = u.id AND status = 'passed') as projects_completed
    FROM users u
    WHERE u.username = $1 AND u.is_active = true
  `, [username]);
  
  if (result.rows.length === 0) {
    throw errors.notFound('Utilisateur');
  }
  
  const user = result.rows[0];
  
  // Récupérer les badges publics
  const badgesResult = await db.query(`
    SELECT b.id, b.name, b.icon, b.rarity, ub.earned_at
    FROM user_badges ub
    JOIN badges b ON b.id = ub.badge_id
    WHERE ub.user_id = $1
    ORDER BY ub.earned_at DESC
    LIMIT 6
  `, [user.id]);
  
  // Récupérer le rang
  const rankResult = await db.query(`
    SELECT COUNT(*) + 1 as rank
    FROM users
    WHERE total_points > $1 AND is_active = true
  `, [user.total_points]);
  
  res.json({
    id: user.id,
    username: user.username,
    avatarUrl: user.avatar_url,
    bio: user.bio,
    totalPoints: user.total_points,
    currentLevel: user.current_level,
    streakDays: user.streak_days,
    badgesCount: parseInt(user.badges_count),
    topicsCompleted: parseInt(user.topics_completed),
    projectsCompleted: parseInt(user.projects_completed),
    rank: parseInt(rankResult.rows[0].rank),
    createdAt: user.created_at,
    recentBadges: badgesResult.rows.map(b => ({
      id: b.id,
      name: b.name,
      icon: b.icon,
      rarity: b.rarity,
      earnedAt: b.earned_at
    }))
  });
}));

/**
 * GET /api/users/:username/activity
 * Activité récente d'un utilisateur
 */
router.get('/:username/activity', asyncHandler(async (req, res) => {
  const { username } = req.params;
  
  // Vérifier que l'utilisateur existe
  const userResult = await db.query(
    'SELECT id FROM users WHERE username = $1 AND is_active = true',
    [username]
  );
  
  if (userResult.rows.length === 0) {
    throw errors.notFound('Utilisateur');
  }
  
  const userId = userResult.rows[0].id;
  
  const result = await db.query(`
    SELECT activity_type, activity_data, points_earned, created_at
    FROM user_activity
    WHERE user_id = $1
    ORDER BY created_at DESC
    LIMIT 20
  `, [userId]);
  
  res.json(result.rows.map(a => ({
    type: a.activity_type,
    data: a.activity_data,
    pointsEarned: a.points_earned,
    createdAt: a.created_at
  })));
}));

/**
 * DELETE /api/users/account
 * Supprimer son compte
 */
router.delete('/account', authenticate, asyncHandler(async (req, res) => {
  // Désactiver le compte au lieu de le supprimer
  await db.query(`
    UPDATE users SET is_active = false WHERE id = $1
  `, [req.user.id]);
  
  res.json({ message: 'Compte désactivé avec succès' });
}));

module.exports = router;
