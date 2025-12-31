/**
 * Routes des topics (sujets d'apprentissage)
 */
const express = require('express');
const db = require('../config/database');
const { authenticate, optionalAuth } = require('../middleware/auth');
const { asyncHandler, errors } = require('../middleware/errorHandler');

const router = express.Router();

/**
 * GET /api/topics
 * Liste tous les topics (avec filtres optionnels)
 */
router.get('/', optionalAuth, asyncHandler(async (req, res) => {
  const { module: moduleSlug, difficulty, status } = req.query;
  
  let query = `
    SELECT 
      t.id, t.slug, t.title, t.description, t.difficulty,
      t.estimated_hours, t.points_reward, t.position_in_module,
      m.slug as module_slug, m.title as module_title, m.icon as module_icon,
      ${req.user ? 'up.status, up.started_at, up.completed_at' : "'not_started' as status, NULL as started_at, NULL as completed_at"}
    FROM topics t
    JOIN modules m ON m.id = t.module_id
    ${req.user ? 'LEFT JOIN user_progress up ON up.topic_id = t.id AND up.user_id = $1' : ''}
    WHERE t.is_published = true
  `;
  
  const params = req.user ? [req.user.id] : [];
  let paramIndex = params.length + 1;
  
  if (moduleSlug) {
    query += ` AND m.slug = $${paramIndex}`;
    params.push(moduleSlug);
    paramIndex++;
  }
  
  if (difficulty) {
    query += ` AND t.difficulty = $${paramIndex}`;
    params.push(parseInt(difficulty));
    paramIndex++;
  }
  
  if (status && req.user) {
    query += ` AND up.status = $${paramIndex}`;
    params.push(status);
    paramIndex++;
  }
  
  query += ' ORDER BY m.position, t.position_in_module';
  
  const result = await db.query(query, params);
  
  res.json(result.rows.map(t => ({
    id: t.id,
    slug: t.slug,
    title: t.title,
    description: t.description,
    difficulty: t.difficulty,
    estimatedHours: t.estimated_hours,
    pointsReward: t.points_reward,
    position: t.position_in_module,
    module: {
      slug: t.module_slug,
      title: t.module_title,
      icon: t.module_icon
    },
    status: t.status || 'not_started',
    startedAt: t.started_at,
    completedAt: t.completed_at
  })));
}));

/**
 * GET /api/topics/:slug
 * Détails complets d'un topic
 */
router.get('/:slug', optionalAuth, asyncHandler(async (req, res) => {
  const { slug } = req.params;
  
  // Récupérer le topic
  const topicResult = await db.query(`
    SELECT 
      t.*,
      m.slug as module_slug, m.title as module_title, m.icon as module_icon, m.color as module_color
    FROM topics t
    JOIN modules m ON m.id = t.module_id
    WHERE t.slug = $1 AND t.is_published = true
  `, [slug]);
  
  if (topicResult.rows.length === 0) {
    throw errors.notFound('Topic');
  }
  
  const topic = topicResult.rows[0];
  
  // Récupérer la progression de l'utilisateur
  let progress = null;
  if (req.user) {
    const progressResult = await db.query(`
      SELECT status, started_at, completed_at, time_spent_minutes, notes, bookmarked
      FROM user_progress
      WHERE user_id = $1 AND topic_id = $2
    `, [req.user.id, topic.id]);
    
    if (progressResult.rows.length > 0) {
      progress = progressResult.rows[0];
    }
  }
  
  // Récupérer le projet associé
  const projectResult = await db.query(`
    SELECT id, slug, title, description, difficulty, points_reward, time_limit_minutes
    FROM projects
    WHERE topic_id = $1 AND is_published = true
  `, [topic.id]);
  
  // Récupérer les ressources
  const resourcesResult = await db.query(`
    SELECT id, title, url, resource_type, description, is_required, position
    FROM resources
    WHERE topic_id = $1
    ORDER BY position
  `, [topic.id]);
  
  // Récupérer les topics prérequis
  let prerequisites = [];
  if (topic.prerequisites && topic.prerequisites.length > 0) {
    const prereqResult = await db.query(`
      SELECT id, slug, title
      FROM topics
      WHERE id = ANY($1)
    `, [topic.prerequisites]);
    prerequisites = prereqResult.rows;
  }
  
  // Récupérer le topic suivant
  const nextTopicResult = await db.query(`
    SELECT slug, title
    FROM topics
    WHERE module_id = $1 AND position_in_module = $2 AND is_published = true
  `, [topic.module_id, topic.position_in_module + 1]);
  
  res.json({
    id: topic.id,
    slug: topic.slug,
    title: topic.title,
    description: topic.description,
    content: topic.content,
    difficulty: topic.difficulty,
    estimatedHours: topic.estimated_hours,
    pointsReward: topic.points_reward,
    position: topic.position_in_module,
    module: {
      slug: topic.module_slug,
      title: topic.module_title,
      icon: topic.module_icon,
      color: topic.module_color
    },
    progress: progress ? {
      status: progress.status,
      startedAt: progress.started_at,
      completedAt: progress.completed_at,
      timeSpentMinutes: progress.time_spent_minutes,
      notes: progress.notes,
      bookmarked: progress.bookmarked
    } : null,
    project: projectResult.rows[0] ? {
      id: projectResult.rows[0].id,
      slug: projectResult.rows[0].slug,
      title: projectResult.rows[0].title,
      description: projectResult.rows[0].description,
      difficulty: projectResult.rows[0].difficulty,
      pointsReward: projectResult.rows[0].points_reward,
      timeLimitMinutes: projectResult.rows[0].time_limit_minutes
    } : null,
    resources: resourcesResult.rows.map(r => ({
      id: r.id,
      title: r.title,
      url: r.url,
      type: r.resource_type,
      description: r.description,
      isRequired: r.is_required
    })),
    prerequisites,
    nextTopic: nextTopicResult.rows[0] || null
  });
}));

/**
 * GET /api/topics/:slug/content
 * Récupérer uniquement le contenu d'un topic (pour le lazy loading)
 */
router.get('/:slug/content', asyncHandler(async (req, res) => {
  const { slug } = req.params;
  
  const result = await db.query(`
    SELECT content FROM topics WHERE slug = $1 AND is_published = true
  `, [slug]);
  
  if (result.rows.length === 0) {
    throw errors.notFound('Topic');
  }
  
  res.json(result.rows[0].content);
}));

module.exports = router;
