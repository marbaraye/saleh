/**
 * Routes des badges
 */
const express = require('express');
const db = require('../config/database');
const { authenticate, optionalAuth } = require('../middleware/auth');
const { asyncHandler, errors } = require('../middleware/errorHandler');

const router = express.Router();

/**
 * GET /api/badges
 * Liste tous les badges disponibles
 */
router.get('/', optionalAuth, asyncHandler(async (req, res) => {
  let query;
  let params = [];
  
  if (req.user) {
    query = `
      SELECT 
        b.id, b.name, b.description, b.icon, b.category, 
        b.criteria, b.points_bonus, b.rarity,
        ub.earned_at
      FROM badges b
      LEFT JOIN user_badges ub ON ub.badge_id = b.id AND ub.user_id = $1
      ORDER BY 
        CASE b.rarity 
          WHEN 'legendary' THEN 1 
          WHEN 'epic' THEN 2 
          WHEN 'rare' THEN 3 
          ELSE 4 
        END,
        b.name
    `;
    params = [req.user.id];
  } else {
    query = `
      SELECT 
        b.id, b.name, b.description, b.icon, b.category, 
        b.criteria, b.points_bonus, b.rarity,
        NULL as earned_at
      FROM badges b
      ORDER BY 
        CASE b.rarity 
          WHEN 'legendary' THEN 1 
          WHEN 'epic' THEN 2 
          WHEN 'rare' THEN 3 
          ELSE 4 
        END,
        b.name
    `;
  }
  
  const result = await db.query(query, params);
  
  res.json(result.rows.map(b => ({
    id: b.id,
    name: b.name,
    description: b.description,
    icon: b.icon,
    category: b.category,
    criteria: b.criteria,
    pointsBonus: b.points_bonus,
    rarity: b.rarity,
    earned: !!b.earned_at,
    earnedAt: b.earned_at
  })));
}));

/**
 * GET /api/badges/user
 * Badges de l'utilisateur connecté
 */
router.get('/user', authenticate, asyncHandler(async (req, res) => {
  const result = await db.query(`
    SELECT 
      b.id, b.name, b.description, b.icon, b.category, 
      b.points_bonus, b.rarity,
      ub.earned_at
    FROM user_badges ub
    JOIN badges b ON b.id = ub.badge_id
    WHERE ub.user_id = $1
    ORDER BY ub.earned_at DESC
  `, [req.user.id]);
  
  res.json(result.rows.map(b => ({
    id: b.id,
    name: b.name,
    description: b.description,
    icon: b.icon,
    category: b.category,
    pointsBonus: b.points_bonus,
    rarity: b.rarity,
    earnedAt: b.earned_at
  })));
}));

/**
 * GET /api/badges/check
 * Vérifier et attribuer les badges mérités
 */
router.get('/check', authenticate, asyncHandler(async (req, res) => {
  const newBadges = [];
  
  // Récupérer les stats de l'utilisateur
  const statsResult = await db.query(`
    SELECT 
      u.total_points,
      u.streak_days,
      (SELECT COUNT(*) FROM user_progress WHERE user_id = u.id AND status = 'completed') as topics_completed,
      (SELECT COUNT(DISTINCT project_id) FROM project_submissions WHERE user_id = u.id AND status = 'passed') as projects_completed
    FROM users u
    WHERE u.id = $1
  `, [req.user.id]);
  
  const stats = statsResult.rows[0];
  
  // Récupérer les badges déjà obtenus
  const earnedResult = await db.query(`
    SELECT badge_id FROM user_badges WHERE user_id = $1
  `, [req.user.id]);
  
  const earnedBadgeIds = earnedResult.rows.map(r => r.badge_id);
  
  // Récupérer tous les badges
  const badgesResult = await db.query('SELECT * FROM badges');
  
  for (const badge of badgesResult.rows) {
    if (earnedBadgeIds.includes(badge.id)) continue;
    
    let earned = false;
    const criteria = badge.criteria;
    
    // Vérifier les critères
    if (criteria.projects_completed && stats.projects_completed >= criteria.projects_completed) {
      earned = true;
    }
    
    if (criteria.streak_days && stats.streak_days >= criteria.streak_days) {
      earned = true;
    }
    
    // Vérifier la complétion de module
    if (criteria.module) {
      const moduleResult = await db.query(`
        SELECT 
          COUNT(t.id) as total,
          COUNT(CASE WHEN up.status = 'completed' THEN 1 END) as completed
        FROM topics t
        JOIN modules m ON m.id = t.module_id
        LEFT JOIN user_progress up ON up.topic_id = t.id AND up.user_id = $1
        WHERE m.slug = $2
      `, [req.user.id, criteria.module]);
      
      const moduleStats = moduleResult.rows[0];
      if (moduleStats.total > 0 && moduleStats.completed === moduleStats.total) {
        earned = true;
      }
    }
    
    if (earned) {
      // Attribuer le badge
      await db.query(`
        INSERT INTO user_badges (user_id, badge_id)
        VALUES ($1, $2)
        ON CONFLICT DO NOTHING
      `, [req.user.id, badge.id]);
      
      // Ajouter les points bonus
      if (badge.points_bonus > 0) {
        await db.query(`
          UPDATE users SET total_points = total_points + $1 WHERE id = $2
        `, [badge.points_bonus, req.user.id]);
      }
      
      // Enregistrer l'activité
      await db.query(`
        INSERT INTO user_activity (user_id, activity_type, activity_data, points_earned)
        VALUES ($1, 'badge_earned', $2, $3)
      `, [req.user.id, JSON.stringify({ badgeId: badge.id, badgeName: badge.name }), badge.points_bonus]);
      
      newBadges.push({
        id: badge.id,
        name: badge.name,
        description: badge.description,
        icon: badge.icon,
        rarity: badge.rarity,
        pointsBonus: badge.points_bonus
      });
    }
  }
  
  res.json({
    newBadges,
    message: newBadges.length > 0 
      ? `Félicitations ! Vous avez obtenu ${newBadges.length} nouveau(x) badge(s) !`
      : 'Aucun nouveau badge pour le moment'
  });
}));

/**
 * GET /api/badges/:id
 * Détails d'un badge
 */
router.get('/:id', optionalAuth, asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const result = await db.query(`
    SELECT 
      b.*,
      (SELECT COUNT(*) FROM user_badges WHERE badge_id = b.id) as total_earned
    FROM badges b
    WHERE b.id = $1
  `, [id]);
  
  if (result.rows.length === 0) {
    throw errors.notFound('Badge');
  }
  
  const badge = result.rows[0];
  
  // Vérifier si l'utilisateur l'a obtenu
  let earnedAt = null;
  if (req.user) {
    const earnedResult = await db.query(`
      SELECT earned_at FROM user_badges WHERE user_id = $1 AND badge_id = $2
    `, [req.user.id, id]);
    
    if (earnedResult.rows.length > 0) {
      earnedAt = earnedResult.rows[0].earned_at;
    }
  }
  
  res.json({
    id: badge.id,
    name: badge.name,
    description: badge.description,
    icon: badge.icon,
    category: badge.category,
    criteria: badge.criteria,
    pointsBonus: badge.points_bonus,
    rarity: badge.rarity,
    totalEarned: parseInt(badge.total_earned),
    earned: !!earnedAt,
    earnedAt
  });
}));

module.exports = router;
