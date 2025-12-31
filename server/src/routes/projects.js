/**
 * Routes des projets et soumissions
 */
const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { authenticate, optionalAuth } = require('../middleware/auth');
const { asyncHandler, errors } = require('../middleware/errorHandler');
const codeValidator = require('../services/codeValidator');

const router = express.Router();

/**
 * GET /api/projects
 * Liste tous les projets
 */
router.get('/', optionalAuth, asyncHandler(async (req, res) => {
  const { difficulty, module: moduleSlug } = req.query;
  
  let query = `
    SELECT 
      p.id, p.slug, p.title, p.description, p.difficulty, 
      p.points_reward, p.time_limit_minutes,
      t.slug as topic_slug, t.title as topic_title,
      m.slug as module_slug, m.title as module_title, m.icon as module_icon
      ${req.user ? `, (
        SELECT COUNT(*) FROM project_submissions ps 
        WHERE ps.project_id = p.id AND ps.user_id = $1 AND ps.status = 'passed'
      ) > 0 as completed` : ''}
    FROM projects p
    JOIN topics t ON t.id = p.topic_id
    JOIN modules m ON m.id = t.module_id
    WHERE p.is_published = true
  `;
  
  const params = req.user ? [req.user.id] : [];
  let paramIndex = params.length + 1;
  
  if (difficulty) {
    query += ` AND p.difficulty = $${paramIndex}`;
    params.push(parseInt(difficulty));
    paramIndex++;
  }
  
  if (moduleSlug) {
    query += ` AND m.slug = $${paramIndex}`;
    params.push(moduleSlug);
    paramIndex++;
  }
  
  query += ' ORDER BY m.position, t.position_in_module';
  
  const result = await db.query(query, params);
  
  res.json(result.rows.map(p => ({
    id: p.id,
    slug: p.slug,
    title: p.title,
    description: p.description,
    difficulty: p.difficulty,
    pointsReward: p.points_reward,
    timeLimitMinutes: p.time_limit_minutes,
    topic: {
      slug: p.topic_slug,
      title: p.topic_title
    },
    module: {
      slug: p.module_slug,
      title: p.module_title,
      icon: p.module_icon
    },
    completed: p.completed || false
  })));
}));

/**
 * GET /api/projects/:slug
 * Détails d'un projet
 */
router.get('/:slug', optionalAuth, asyncHandler(async (req, res) => {
  const { slug } = req.params;
  
  const result = await db.query(`
    SELECT 
      p.*,
      t.slug as topic_slug, t.title as topic_title,
      m.slug as module_slug, m.title as module_title
    FROM projects p
    JOIN topics t ON t.id = p.topic_id
    JOIN modules m ON m.id = t.module_id
    WHERE p.slug = $1 AND p.is_published = true
  `, [slug]);
  
  if (result.rows.length === 0) {
    throw errors.notFound('Projet');
  }
  
  const project = result.rows[0];
  
  // Récupérer les soumissions de l'utilisateur
  let submissions = [];
  let bestSubmission = null;
  
  if (req.user) {
    const submissionsResult = await db.query(`
      SELECT id, status, score, tests_passed, tests_total, submitted_at
      FROM project_submissions
      WHERE project_id = $1 AND user_id = $2
      ORDER BY submitted_at DESC
      LIMIT 10
    `, [project.id, req.user.id]);
    
    submissions = submissionsResult.rows;
    
    // Meilleure soumission
    const bestResult = await db.query(`
      SELECT id, status, score, tests_passed, tests_total, submitted_at
      FROM project_submissions
      WHERE project_id = $1 AND user_id = $2 AND status = 'passed'
      ORDER BY score DESC
      LIMIT 1
    `, [project.id, req.user.id]);
    
    bestSubmission = bestResult.rows[0] || null;
  }
  
  res.json({
    id: project.id,
    slug: project.slug,
    title: project.title,
    description: project.description,
    requirements: project.requirements,
    starterCode: project.starter_code,
    hints: project.hints,
    difficulty: project.difficulty,
    pointsReward: project.points_reward,
    timeLimitMinutes: project.time_limit_minutes,
    testCases: project.test_cases.map(tc => ({
      name: tc.name,
      type: tc.type
      // On ne révèle pas les détails des tests
    })),
    topic: {
      slug: project.topic_slug,
      title: project.topic_title
    },
    module: {
      slug: project.module_slug,
      title: project.module_title
    },
    submissions: submissions.map(s => ({
      id: s.id,
      status: s.status,
      score: s.score,
      testsPassed: s.tests_passed,
      testsTotal: s.tests_total,
      submittedAt: s.submitted_at
    })),
    bestSubmission: bestSubmission ? {
      id: bestSubmission.id,
      score: bestSubmission.score,
      testsPassed: bestSubmission.tests_passed,
      testsTotal: bestSubmission.tests_total,
      submittedAt: bestSubmission.submitted_at
    } : null
  });
}));

/**
 * POST /api/projects/:slug/submit
 * Soumettre du code pour un projet
 */
router.post('/:slug/submit', authenticate, [
  body('code').notEmpty().withMessage('Le code est requis')
], asyncHandler(async (req, res) => {
  const validationErrors = validationResult(req);
  if (!validationErrors.isEmpty()) {
    throw errors.validation(validationErrors.array());
  }
  
  const { slug } = req.params;
  const { code } = req.body;
  
  // Récupérer le projet
  const projectResult = await db.query(`
    SELECT id, test_cases, validation_config, points_reward, topic_id
    FROM projects WHERE slug = $1 AND is_published = true
  `, [slug]);
  
  if (projectResult.rows.length === 0) {
    throw errors.notFound('Projet');
  }
  
  const project = projectResult.rows[0];
  
  // Créer la soumission
  const submissionResult = await db.query(`
    INSERT INTO project_submissions (user_id, project_id, code, status)
    VALUES ($1, $2, $3, 'pending')
    RETURNING id
  `, [req.user.id, project.id, code]);
  
  const submissionId = submissionResult.rows[0].id;
  
  // Valider le code
  const validationResults = await codeValidator.validate(code, project.test_cases, project.validation_config);
  
  // Calculer le score
  const testsPassed = validationResults.filter(r => r.passed).length;
  const testsTotal = validationResults.length;
  const score = Math.round((testsPassed / testsTotal) * 100);
  const status = testsPassed === testsTotal ? 'passed' : 'failed';
  
  // Mettre à jour la soumission
  await db.query(`
    UPDATE project_submissions
    SET 
      status = $1,
      test_results = $2,
      tests_passed = $3,
      tests_total = $4,
      score = $5,
      compilation_output = $6,
      compilation_success = $7
    WHERE id = $8
  `, [
    status,
    JSON.stringify(validationResults),
    testsPassed,
    testsTotal,
    score,
    validationResults[0]?.compilationOutput || null,
    validationResults[0]?.compilationSuccess ?? true,
    submissionId
  ]);
  
  // Si le projet est réussi, mettre à jour la progression et les points
  if (status === 'passed') {
    // Vérifier si c'est la première réussite
    const previousSuccess = await db.query(`
      SELECT id FROM project_submissions
      WHERE project_id = $1 AND user_id = $2 AND status = 'passed' AND id != $3
    `, [project.id, req.user.id, submissionId]);
    
    if (previousSuccess.rows.length === 0) {
      // Première réussite - ajouter les points
      await db.query(`
        UPDATE users SET total_points = total_points + $1 WHERE id = $2
      `, [project.points_reward, req.user.id]);
      
      // Mettre à jour la progression du topic
      await db.query(`
        INSERT INTO user_progress (user_id, topic_id, status, completed_at)
        VALUES ($1, $2, 'completed', NOW())
        ON CONFLICT (user_id, topic_id) 
        DO UPDATE SET status = 'completed', completed_at = NOW()
      `, [req.user.id, project.topic_id]);
      
      // Enregistrer l'activité
      await db.query(`
        INSERT INTO user_activity (user_id, activity_type, activity_data, points_earned)
        VALUES ($1, 'project_completed', $2, $3)
      `, [req.user.id, JSON.stringify({ projectId: project.id, projectSlug: slug }), project.points_reward]);
    }
  }
  
  res.json({
    submissionId,
    status,
    score,
    testsPassed,
    testsTotal,
    results: validationResults.map(r => ({
      name: r.name,
      passed: r.passed,
      message: r.message
    })),
    pointsEarned: status === 'passed' ? project.points_reward : 0
  });
}));

/**
 * GET /api/projects/:slug/submissions
 * Historique des soumissions d'un utilisateur pour un projet
 */
router.get('/:slug/submissions', authenticate, asyncHandler(async (req, res) => {
  const { slug } = req.params;
  
  const result = await db.query(`
    SELECT 
      ps.id, ps.code, ps.status, ps.score, 
      ps.tests_passed, ps.tests_total, ps.test_results,
      ps.compilation_output, ps.compilation_success,
      ps.submitted_at
    FROM project_submissions ps
    JOIN projects p ON p.id = ps.project_id
    WHERE p.slug = $1 AND ps.user_id = $2
    ORDER BY ps.submitted_at DESC
  `, [slug, req.user.id]);
  
  res.json(result.rows.map(s => ({
    id: s.id,
    code: s.code,
    status: s.status,
    score: s.score,
    testsPassed: s.tests_passed,
    testsTotal: s.tests_total,
    testResults: s.test_results,
    compilationOutput: s.compilation_output,
    compilationSuccess: s.compilation_success,
    submittedAt: s.submitted_at
  })));
}));

/**
 * GET /api/projects/:slug/hint/:index
 * Récupérer un indice (débloqué progressivement)
 */
router.get('/:slug/hint/:index', authenticate, asyncHandler(async (req, res) => {
  const { slug, index } = req.params;
  const hintIndex = parseInt(index);
  
  const result = await db.query(`
    SELECT hints FROM projects WHERE slug = $1
  `, [slug]);
  
  if (result.rows.length === 0) {
    throw errors.notFound('Projet');
  }
  
  const hints = result.rows[0].hints;
  
  if (hintIndex < 0 || hintIndex >= hints.length) {
    throw errors.badRequest('Index d\'indice invalide');
  }
  
  // On pourrait ajouter une logique pour débloquer les indices progressivement
  // basée sur le nombre de tentatives ou le temps passé
  
  res.json({
    index: hintIndex,
    hint: hints[hintIndex],
    totalHints: hints.length
  });
}));

module.exports = router;
