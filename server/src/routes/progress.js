/**
 * Routes de gestion de la progression utilisateur
 */
const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { asyncHandler, errors } = require('../middleware/errorHandler');

const router = express.Router();

/**
 * GET /api/progress
 * Récupérer toute la progression de l'utilisateur
 */
router.get('/', authenticate, asyncHandler(async (req, res) => {
  // Progression globale
  const globalResult = await db.query(`
    SELECT 
      COUNT(DISTINCT CASE WHEN up.status = 'completed' THEN up.topic_id END) as topics_completed,
      COUNT(DISTINCT CASE WHEN up.status = 'in_progress' THEN up.topic_id END) as topics_in_progress,
      (SELECT COUNT(*) FROM topics WHERE is_published = true) as total_topics,
      (SELECT COUNT(DISTINCT project_id) FROM project_submissions WHERE user_id = $1 AND status = 'passed') as projects_completed,
      (SELECT COUNT(*) FROM projects WHERE is_published = true) as total_projects
    FROM user_progress up
    WHERE up.user_id = $1
  `, [req.user.id]);
  
  // Progression par module
  const modulesResult = await db.query(`
    SELECT 
      m.id, m.slug, m.title, m.icon, m.color,
      COUNT(t.id) as total_topics,
      COUNT(CASE WHEN up.status = 'completed' THEN 1 END) as completed_topics,
      COUNT(CASE WHEN up.status = 'in_progress' THEN 1 END) as in_progress_topics
    FROM modules m
    LEFT JOIN topics t ON t.module_id = m.id AND t.is_published = true
    LEFT JOIN user_progress up ON up.topic_id = t.id AND up.user_id = $1
    WHERE m.is_published = true
    GROUP BY m.id
    ORDER BY m.position
  `, [req.user.id]);
  
  // Activité récente
  const activityResult = await db.query(`
    SELECT activity_type, activity_data, points_earned, created_at
    FROM user_activity
    WHERE user_id = $1
    ORDER BY created_at DESC
    LIMIT 10
  `, [req.user.id]);
  
  const global = globalResult.rows[0];
  
  res.json({
    global: {
      topicsCompleted: parseInt(global.topics_completed),
      topicsInProgress: parseInt(global.topics_in_progress),
      totalTopics: parseInt(global.total_topics),
      projectsCompleted: parseInt(global.projects_completed),
      totalProjects: parseInt(global.total_projects),
      overallProgress: Math.round((parseInt(global.topics_completed) / parseInt(global.total_topics)) * 100) || 0
    },
    modules: modulesResult.rows.map(m => ({
      id: m.id,
      slug: m.slug,
      title: m.title,
      icon: m.icon,
      color: m.color,
      totalTopics: parseInt(m.total_topics),
      completedTopics: parseInt(m.completed_topics),
      inProgressTopics: parseInt(m.in_progress_topics),
      progressPercent: Math.round((parseInt(m.completed_topics) / parseInt(m.total_topics)) * 100) || 0
    })),
    recentActivity: activityResult.rows.map(a => ({
      type: a.activity_type,
      data: a.activity_data,
      pointsEarned: a.points_earned,
      createdAt: a.created_at
    }))
  });
}));

/**
 * GET /api/progress/topic/:topicId
 * Récupérer la progression sur un topic spécifique
 */
router.get('/topic/:topicId', authenticate, asyncHandler(async (req, res) => {
  const { topicId } = req.params;
  
  const result = await db.query(`
    SELECT 
      up.status, up.started_at, up.completed_at, 
      up.time_spent_minutes, up.notes, up.bookmarked
    FROM user_progress up
    WHERE up.user_id = $1 AND up.topic_id = $2
  `, [req.user.id, topicId]);
  
  if (result.rows.length === 0) {
    return res.json({
      status: 'not_started',
      startedAt: null,
      completedAt: null,
      timeSpentMinutes: 0,
      notes: null,
      bookmarked: false
    });
  }
  
  const progress = result.rows[0];
  
  res.json({
    status: progress.status,
    startedAt: progress.started_at,
    completedAt: progress.completed_at,
    timeSpentMinutes: progress.time_spent_minutes,
    notes: progress.notes,
    bookmarked: progress.bookmarked
  });
}));

/**
 * POST /api/progress/topic/:topicId/start
 * Marquer un topic comme commencé
 */
router.post('/topic/:topicId/start', authenticate, asyncHandler(async (req, res) => {
  const { topicId } = req.params;
  
  // Vérifier que le topic existe
  const topicResult = await db.query(
    'SELECT id, points_reward FROM topics WHERE id = $1',
    [topicId]
  );
  
  if (topicResult.rows.length === 0) {
    throw errors.notFound('Topic');
  }
  
  // Créer ou mettre à jour la progression
  await db.query(`
    INSERT INTO user_progress (user_id, topic_id, status, started_at)
    VALUES ($1, $2, 'in_progress', NOW())
    ON CONFLICT (user_id, topic_id) 
    DO UPDATE SET 
      status = CASE WHEN user_progress.status = 'not_started' THEN 'in_progress' ELSE user_progress.status END,
      started_at = COALESCE(user_progress.started_at, NOW())
  `, [req.user.id, topicId]);
  
  // Enregistrer l'activité
  await db.query(`
    INSERT INTO user_activity (user_id, activity_type, activity_data)
    VALUES ($1, 'topic_started', $2)
  `, [req.user.id, JSON.stringify({ topicId })]);
  
  res.json({ message: 'Topic marqué comme commencé', status: 'in_progress' });
}));

/**
 * POST /api/progress/topic/:topicId/complete
 * Marquer un topic comme terminé
 */
router.post('/topic/:topicId/complete', authenticate, asyncHandler(async (req, res) => {
  const { topicId } = req.params;
  
  // Vérifier que le topic existe et récupérer les points
  const topicResult = await db.query(
    'SELECT id, points_reward FROM topics WHERE id = $1',
    [topicId]
  );
  
  if (topicResult.rows.length === 0) {
    throw errors.notFound('Topic');
  }
  
  const topic = topicResult.rows[0];
  
  // Vérifier si déjà complété
  const existingResult = await db.query(`
    SELECT status FROM user_progress 
    WHERE user_id = $1 AND topic_id = $2
  `, [req.user.id, topicId]);
  
  const alreadyCompleted = existingResult.rows[0]?.status === 'completed';
  
  // Mettre à jour la progression
  await db.query(`
    INSERT INTO user_progress (user_id, topic_id, status, started_at, completed_at)
    VALUES ($1, $2, 'completed', NOW(), NOW())
    ON CONFLICT (user_id, topic_id) 
    DO UPDATE SET 
      status = 'completed',
      completed_at = NOW()
  `, [req.user.id, topicId]);
  
  let pointsEarned = 0;
  
  // Ajouter les points si première complétion
  if (!alreadyCompleted) {
    pointsEarned = topic.points_reward;
    await db.query(`
      UPDATE users SET total_points = total_points + $1 WHERE id = $2
    `, [pointsEarned, req.user.id]);
    
    // Enregistrer l'activité
    await db.query(`
      INSERT INTO user_activity (user_id, activity_type, activity_data, points_earned)
      VALUES ($1, 'topic_completed', $2, $3)
    `, [req.user.id, JSON.stringify({ topicId }), pointsEarned]);
  }
  
  res.json({ 
    message: 'Topic marqué comme terminé', 
    status: 'completed',
    pointsEarned
  });
}));

/**
 * PUT /api/progress/topic/:topicId/notes
 * Mettre à jour les notes sur un topic
 */
router.put('/topic/:topicId/notes', authenticate, [
  body('notes').isString().isLength({ max: 10000 })
], asyncHandler(async (req, res) => {
  const validationErrors = validationResult(req);
  if (!validationErrors.isEmpty()) {
    throw errors.validation(validationErrors.array());
  }
  
  const { topicId } = req.params;
  const { notes } = req.body;
  
  await db.query(`
    INSERT INTO user_progress (user_id, topic_id, notes)
    VALUES ($1, $2, $3)
    ON CONFLICT (user_id, topic_id) 
    DO UPDATE SET notes = $3
  `, [req.user.id, topicId, notes]);
  
  res.json({ message: 'Notes mises à jour' });
}));

/**
 * PUT /api/progress/topic/:topicId/bookmark
 * Ajouter/retirer un topic des favoris
 */
router.put('/topic/:topicId/bookmark', authenticate, asyncHandler(async (req, res) => {
  const { topicId } = req.params;
  const { bookmarked } = req.body;
  
  await db.query(`
    INSERT INTO user_progress (user_id, topic_id, bookmarked)
    VALUES ($1, $2, $3)
    ON CONFLICT (user_id, topic_id) 
    DO UPDATE SET bookmarked = $3
  `, [req.user.id, topicId, bookmarked]);
  
  res.json({ message: bookmarked ? 'Ajouté aux favoris' : 'Retiré des favoris', bookmarked });
}));

/**
 * PUT /api/progress/topic/:topicId/time
 * Mettre à jour le temps passé sur un topic
 */
router.put('/topic/:topicId/time', authenticate, [
  body('minutes').isInt({ min: 0 })
], asyncHandler(async (req, res) => {
  const { topicId } = req.params;
  const { minutes } = req.body;
  
  await db.query(`
    INSERT INTO user_progress (user_id, topic_id, time_spent_minutes)
    VALUES ($1, $2, $3)
    ON CONFLICT (user_id, topic_id) 
    DO UPDATE SET time_spent_minutes = user_progress.time_spent_minutes + $3
  `, [req.user.id, topicId, minutes]);
  
  res.json({ message: 'Temps mis à jour' });
}));

/**
 * GET /api/progress/streak
 * Récupérer les informations de streak
 */
router.get('/streak', authenticate, asyncHandler(async (req, res) => {
  const result = await db.query(`
    SELECT streak_days, last_activity_date FROM users WHERE id = $1
  `, [req.user.id]);
  
  const user = result.rows[0];
  const today = new Date().toISOString().split('T')[0];
  const lastActivity = user.last_activity_date?.toISOString().split('T')[0];
  
  // Vérifier si le streak est toujours actif
  let currentStreak = user.streak_days;
  let streakActive = false;
  
  if (lastActivity === today) {
    streakActive = true;
  } else if (lastActivity) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (lastActivity === yesterday.toISOString().split('T')[0]) {
      streakActive = true;
    } else {
      currentStreak = 0;
    }
  }
  
  res.json({
    currentStreak,
    streakActive,
    lastActivityDate: user.last_activity_date
  });
}));

/**
 * POST /api/progress/activity
 * Enregistrer une activité (met à jour le streak)
 */
router.post('/activity', authenticate, asyncHandler(async (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  
  // Récupérer les infos actuelles
  const userResult = await db.query(`
    SELECT streak_days, last_activity_date FROM users WHERE id = $1
  `, [req.user.id]);
  
  const user = userResult.rows[0];
  const lastActivity = user.last_activity_date?.toISOString().split('T')[0];
  
  let newStreak = user.streak_days;
  
  if (lastActivity !== today) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (lastActivity === yesterday.toISOString().split('T')[0]) {
      // Continuation du streak
      newStreak = user.streak_days + 1;
    } else {
      // Nouveau streak
      newStreak = 1;
    }
    
    // Mettre à jour l'utilisateur
    await db.query(`
      UPDATE users 
      SET streak_days = $1, last_activity_date = $2
      WHERE id = $3
    `, [newStreak, today, req.user.id]);
    
    // Bonus de points pour le streak
    if (newStreak > 0 && newStreak % 7 === 0) {
      const streakBonus = 10 * (newStreak / 7);
      await db.query(`
        UPDATE users SET total_points = total_points + $1 WHERE id = $2
      `, [streakBonus, req.user.id]);
      
      await db.query(`
        INSERT INTO user_activity (user_id, activity_type, activity_data, points_earned)
        VALUES ($1, 'streak_bonus', $2, $3)
      `, [req.user.id, JSON.stringify({ streakDays: newStreak }), streakBonus]);
    }
  }
  
  res.json({
    streakDays: newStreak,
    message: 'Activité enregistrée'
  });
}));

module.exports = router;
