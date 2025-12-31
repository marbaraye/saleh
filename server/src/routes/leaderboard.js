/**
 * Routes du classement (leaderboard)
 */
const express = require('express');
const db = require('../config/database');
const { optionalAuth } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

/**
 * GET /api/leaderboard
 * Classement global des utilisateurs
 */
router.get('/', optionalAuth, asyncHandler(async (req, res) => {
  const { limit = 50, offset = 0 } = req.query;
  
  const result = await db.query(`
    SELECT 
      u.id, u.username, u.avatar_url,
      u.total_points, u.current_level, u.streak_days,
      COUNT(DISTINCT ub.badge_id) as badges_count,
      COUNT(DISTINCT CASE WHEN up.status = 'completed' THEN up.topic_id END) as topics_completed,
      RANK() OVER (ORDER BY u.total_points DESC) as rank
    FROM users u
    LEFT JOIN user_badges ub ON u.id = ub.user_id
    LEFT JOIN user_progress up ON u.id = up.user_id
    WHERE u.is_active = true
    GROUP BY u.id
    ORDER BY u.total_points DESC
    LIMIT $1 OFFSET $2
  `, [parseInt(limit), parseInt(offset)]);
  
  // Récupérer le total d'utilisateurs
  const countResult = await db.query(
    'SELECT COUNT(*) FROM users WHERE is_active = true'
  );
  
  // Si l'utilisateur est connecté, récupérer son rang
  let userRank = null;
  if (req.user) {
    const rankResult = await db.query(`
      SELECT rank FROM (
        SELECT id, RANK() OVER (ORDER BY total_points DESC) as rank
        FROM users WHERE is_active = true
      ) ranked
      WHERE id = $1
    `, [req.user.id]);
    
    if (rankResult.rows.length > 0) {
      userRank = parseInt(rankResult.rows[0].rank);
    }
  }
  
  res.json({
    leaderboard: result.rows.map(u => ({
      id: u.id,
      username: u.username,
      avatarUrl: u.avatar_url,
      totalPoints: u.total_points,
      currentLevel: u.current_level,
      streakDays: u.streak_days,
      badgesCount: parseInt(u.badges_count),
      topicsCompleted: parseInt(u.topics_completed),
      rank: parseInt(u.rank)
    })),
    total: parseInt(countResult.rows[0].count),
    userRank
  });
}));

/**
 * GET /api/leaderboard/weekly
 * Classement de la semaine (basé sur les points gagnés cette semaine)
 */
router.get('/weekly', optionalAuth, asyncHandler(async (req, res) => {
  const result = await db.query(`
    SELECT 
      u.id, u.username, u.avatar_url, u.current_level,
      COALESCE(SUM(ua.points_earned), 0) as weekly_points,
      RANK() OVER (ORDER BY COALESCE(SUM(ua.points_earned), 0) DESC) as rank
    FROM users u
    LEFT JOIN user_activity ua ON u.id = ua.user_id 
      AND ua.created_at >= NOW() - INTERVAL '7 days'
    WHERE u.is_active = true
    GROUP BY u.id
    HAVING COALESCE(SUM(ua.points_earned), 0) > 0
    ORDER BY weekly_points DESC
    LIMIT 20
  `);
  
  res.json(result.rows.map(u => ({
    id: u.id,
    username: u.username,
    avatarUrl: u.avatar_url,
    currentLevel: u.current_level,
    weeklyPoints: parseInt(u.weekly_points),
    rank: parseInt(u.rank)
  })));
}));

/**
 * GET /api/leaderboard/module/:moduleSlug
 * Classement par module
 */
router.get('/module/:moduleSlug', optionalAuth, asyncHandler(async (req, res) => {
  const { moduleSlug } = req.params;
  
  const result = await db.query(`
    SELECT 
      u.id, u.username, u.avatar_url, u.current_level,
      COUNT(CASE WHEN up.status = 'completed' THEN 1 END) as completed_topics,
      COUNT(t.id) as total_topics,
      ROUND(
        COUNT(CASE WHEN up.status = 'completed' THEN 1 END)::numeric / 
        NULLIF(COUNT(t.id), 0) * 100, 0
      ) as progress_percent,
      RANK() OVER (
        ORDER BY COUNT(CASE WHEN up.status = 'completed' THEN 1 END) DESC
      ) as rank
    FROM users u
    CROSS JOIN modules m
    LEFT JOIN topics t ON t.module_id = m.id
    LEFT JOIN user_progress up ON up.topic_id = t.id AND up.user_id = u.id
    WHERE m.slug = $1 AND u.is_active = true
    GROUP BY u.id, m.id
    HAVING COUNT(CASE WHEN up.status = 'completed' THEN 1 END) > 0
    ORDER BY completed_topics DESC
    LIMIT 20
  `, [moduleSlug]);
  
  res.json(result.rows.map(u => ({
    id: u.id,
    username: u.username,
    avatarUrl: u.avatar_url,
    currentLevel: u.current_level,
    completedTopics: parseInt(u.completed_topics),
    totalTopics: parseInt(u.total_topics),
    progressPercent: parseInt(u.progress_percent),
    rank: parseInt(u.rank)
  })));
}));

/**
 * GET /api/leaderboard/streaks
 * Classement par streak
 */
router.get('/streaks', asyncHandler(async (req, res) => {
  const result = await db.query(`
    SELECT 
      u.id, u.username, u.avatar_url, u.current_level,
      u.streak_days,
      RANK() OVER (ORDER BY u.streak_days DESC) as rank
    FROM users u
    WHERE u.is_active = true AND u.streak_days > 0
    ORDER BY u.streak_days DESC
    LIMIT 20
  `);
  
  res.json(result.rows.map(u => ({
    id: u.id,
    username: u.username,
    avatarUrl: u.avatar_url,
    currentLevel: u.current_level,
    streakDays: u.streak_days,
    rank: parseInt(u.rank)
  })));
}));

/**
 * GET /api/leaderboard/around-me
 * Utilisateurs autour du rang de l'utilisateur connecté
 */
router.get('/around-me', optionalAuth, asyncHandler(async (req, res) => {
  if (!req.user) {
    return res.json([]);
  }
  
  // Récupérer le rang de l'utilisateur
  const rankResult = await db.query(`
    SELECT total_points FROM users WHERE id = $1
  `, [req.user.id]);
  
  if (rankResult.rows.length === 0) {
    return res.json([]);
  }
  
  const userPoints = rankResult.rows[0].total_points;
  
  // Récupérer 5 utilisateurs au-dessus et 5 en-dessous
  const result = await db.query(`
    (
      SELECT 
        u.id, u.username, u.avatar_url, u.total_points, u.current_level,
        RANK() OVER (ORDER BY u.total_points DESC) as rank
      FROM users u
      WHERE u.is_active = true AND u.total_points > $1
      ORDER BY u.total_points ASC
      LIMIT 5
    )
    UNION ALL
    (
      SELECT 
        u.id, u.username, u.avatar_url, u.total_points, u.current_level,
        RANK() OVER (ORDER BY u.total_points DESC) as rank
      FROM users u
      WHERE u.is_active = true AND u.total_points <= $1
      ORDER BY u.total_points DESC
      LIMIT 6
    )
    ORDER BY total_points DESC
  `, [userPoints]);
  
  res.json(result.rows.map(u => ({
    id: u.id,
    username: u.username,
    avatarUrl: u.avatar_url,
    totalPoints: u.total_points,
    currentLevel: u.current_level,
    rank: parseInt(u.rank),
    isCurrentUser: u.id === req.user.id
  })));
}));

module.exports = router;
