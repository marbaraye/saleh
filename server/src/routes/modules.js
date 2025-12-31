/**
 * Routes des modules d'apprentissage
 */
const express = require('express');
const db = require('../config/database');
const { authenticate, optionalAuth } = require('../middleware/auth');
const { asyncHandler, errors } = require('../middleware/errorHandler');

const router = express.Router();

/**
 * GET /api/modules
 * Liste tous les modules avec leur progression (si connecté)
 */
router.get('/', optionalAuth, asyncHandler(async (req, res) => {
  let query;
  let params = [];
  
  if (req.user) {
    // Avec progression de l'utilisateur
    query = `
      SELECT 
        m.id, m.slug, m.title, m.description, m.icon, m.color,
        m.estimated_hours, m.position,
        COUNT(t.id) as total_topics,
        COUNT(CASE WHEN up.status = 'completed' THEN 1 END) as completed_topics,
        COUNT(CASE WHEN up.status = 'in_progress' THEN 1 END) as in_progress_topics,
        ROUND(
          COUNT(CASE WHEN up.status = 'completed' THEN 1 END)::numeric / 
          NULLIF(COUNT(t.id), 0) * 100, 0
        ) as progress_percent
      FROM modules m
      LEFT JOIN topics t ON t.module_id = m.id AND t.is_published = true
      LEFT JOIN user_progress up ON up.topic_id = t.id AND up.user_id = $1
      WHERE m.is_published = true
      GROUP BY m.id
      ORDER BY m.position
    `;
    params = [req.user.id];
  } else {
    // Sans progression
    query = `
      SELECT 
        m.id, m.slug, m.title, m.description, m.icon, m.color,
        m.estimated_hours, m.position,
        COUNT(t.id) as total_topics,
        0 as completed_topics,
        0 as in_progress_topics,
        0 as progress_percent
      FROM modules m
      LEFT JOIN topics t ON t.module_id = m.id AND t.is_published = true
      WHERE m.is_published = true
      GROUP BY m.id
      ORDER BY m.position
    `;
  }
  
  const result = await db.query(query, params);
  
  const modules = result.rows.map(row => ({
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    icon: row.icon,
    color: row.color,
    estimatedHours: row.estimated_hours,
    position: row.position,
    totalTopics: parseInt(row.total_topics),
    completedTopics: parseInt(row.completed_topics),
    inProgressTopics: parseInt(row.in_progress_topics),
    progressPercent: parseInt(row.progress_percent) || 0
  }));
  
  res.json(modules);
}));

/**
 * GET /api/modules/:slug
 * Détails d'un module avec ses topics
 */
router.get('/:slug', optionalAuth, asyncHandler(async (req, res) => {
  const { slug } = req.params;
  
  // Récupérer le module
  const moduleResult = await db.query(`
    SELECT id, slug, title, description, icon, color, estimated_hours, position
    FROM modules
    WHERE slug = $1 AND is_published = true
  `, [slug]);
  
  if (moduleResult.rows.length === 0) {
    throw errors.notFound('Module');
  }
  
  const module = moduleResult.rows[0];
  
  // Récupérer les topics du module
  let topicsQuery;
  let topicsParams;
  
  if (req.user) {
    topicsQuery = `
      SELECT 
        t.id, t.slug, t.title, t.description, t.difficulty,
        t.estimated_hours, t.points_reward, t.position_in_module,
        up.status, up.started_at, up.completed_at,
        EXISTS(SELECT 1 FROM projects p WHERE p.topic_id = t.id) as has_project
      FROM topics t
      LEFT JOIN user_progress up ON up.topic_id = t.id AND up.user_id = $2
      WHERE t.module_id = $1 AND t.is_published = true
      ORDER BY t.position_in_module
    `;
    topicsParams = [module.id, req.user.id];
  } else {
    topicsQuery = `
      SELECT 
        t.id, t.slug, t.title, t.description, t.difficulty,
        t.estimated_hours, t.points_reward, t.position_in_module,
        'not_started' as status, NULL as started_at, NULL as completed_at,
        EXISTS(SELECT 1 FROM projects p WHERE p.topic_id = t.id) as has_project
      FROM topics t
      WHERE t.module_id = $1 AND t.is_published = true
      ORDER BY t.position_in_module
    `;
    topicsParams = [module.id];
  }
  
  const topicsResult = await db.query(topicsQuery, topicsParams);
  
  res.json({
    id: module.id,
    slug: module.slug,
    title: module.title,
    description: module.description,
    icon: module.icon,
    color: module.color,
    estimatedHours: module.estimated_hours,
    position: module.position,
    topics: topicsResult.rows.map(t => ({
      id: t.id,
      slug: t.slug,
      title: t.title,
      description: t.description,
      difficulty: t.difficulty,
      estimatedHours: t.estimated_hours,
      pointsReward: t.points_reward,
      position: t.position_in_module,
      status: t.status || 'not_started',
      startedAt: t.started_at,
      completedAt: t.completed_at,
      hasProject: t.has_project
    }))
  });
}));

/**
 * GET /api/modules/:slug/stats
 * Statistiques d'un module pour l'utilisateur connecté
 */
router.get('/:slug/stats', authenticate, asyncHandler(async (req, res) => {
  const { slug } = req.params;
  
  const result = await db.query(`
    SELECT 
      m.id, m.title,
      COUNT(t.id) as total_topics,
      COUNT(CASE WHEN up.status = 'completed' THEN 1 END) as completed,
      COUNT(CASE WHEN up.status = 'in_progress' THEN 1 END) as in_progress,
      SUM(CASE WHEN up.status = 'completed' THEN t.points_reward ELSE 0 END) as points_earned,
      SUM(CASE WHEN up.status = 'completed' THEN up.time_spent_minutes ELSE 0 END) as time_spent
    FROM modules m
    LEFT JOIN topics t ON t.module_id = m.id
    LEFT JOIN user_progress up ON up.topic_id = t.id AND up.user_id = $2
    WHERE m.slug = $1
    GROUP BY m.id
  `, [slug, req.user.id]);
  
  if (result.rows.length === 0) {
    throw errors.notFound('Module');
  }
  
  const stats = result.rows[0];
  
  res.json({
    moduleId: stats.id,
    title: stats.title,
    totalTopics: parseInt(stats.total_topics),
    completed: parseInt(stats.completed),
    inProgress: parseInt(stats.in_progress),
    pointsEarned: parseInt(stats.points_earned) || 0,
    timeSpentMinutes: parseInt(stats.time_spent) || 0,
    progressPercent: Math.round((parseInt(stats.completed) / parseInt(stats.total_topics)) * 100) || 0
  });
}));

module.exports = router;
