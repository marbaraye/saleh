-- ============================================
-- SCHÉMA DE BASE DE DONNÉES - C MASTERY APP
-- Compatible PostgreSQL / AlwaysData
-- ============================================

-- Extension pour UUID
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- TABLE: users
-- Stocke les informations des utilisateurs
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    avatar_url TEXT,
    bio TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_login TIMESTAMPTZ,
    total_points INTEGER DEFAULT 0,
    current_level INTEGER DEFAULT 1,
    streak_days INTEGER DEFAULT 0,
    last_activity_date DATE,
    preferences JSONB DEFAULT '{"theme": "dark", "notifications": true, "language": "fr"}',
    is_active BOOLEAN DEFAULT true,
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin', 'moderator'))
);

-- Index pour les recherches fréquentes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_points ON users(total_points DESC);

-- ============================================
-- TABLE: modules
-- Modules d'apprentissage (6 modules principaux)
-- ============================================
CREATE TABLE IF NOT EXISTS modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    color VARCHAR(7), -- Code couleur hex
    estimated_hours INTEGER,
    position INTEGER NOT NULL,
    is_published BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLE: topics
-- Sujets d'apprentissage au sein des modules
-- ============================================
CREATE TABLE IF NOT EXISTS topics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_id UUID REFERENCES modules(id) ON DELETE CASCADE,
    slug VARCHAR(100) UNIQUE NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    content JSONB NOT NULL DEFAULT '{}', -- Contenu structuré du cours
    difficulty INTEGER CHECK (difficulty BETWEEN 1 AND 5),
    estimated_hours INTEGER,
    prerequisites UUID[] DEFAULT '{}',
    position_in_module INTEGER,
    points_reward INTEGER DEFAULT 50,
    is_published BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_topics_module ON topics(module_id);
CREATE INDEX IF NOT EXISTS idx_topics_slug ON topics(slug);

-- ============================================
-- TABLE: projects
-- Projets pratiques associés aux topics
-- ============================================
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    topic_id UUID REFERENCES topics(id) ON DELETE CASCADE,
    slug VARCHAR(100) UNIQUE NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    requirements JSONB DEFAULT '[]', -- Liste des exigences
    starter_code TEXT, -- Code de départ fourni
    solution_code TEXT, -- Solution (visible après validation)
    hints JSONB DEFAULT '[]', -- Indices progressifs
    difficulty INTEGER CHECK (difficulty BETWEEN 1 AND 5),
    points_reward INTEGER DEFAULT 100,
    time_limit_minutes INTEGER DEFAULT 120,
    test_cases JSONB DEFAULT '[]', -- Tests de validation
    validation_config JSONB DEFAULT '{}', -- Configuration de validation
    is_published BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_projects_topic ON projects(topic_id);

-- ============================================
-- TABLE: user_progress
-- Progression des utilisateurs sur les topics
-- ============================================
CREATE TABLE IF NOT EXISTS user_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    topic_id UUID REFERENCES topics(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    time_spent_minutes INTEGER DEFAULT 0,
    notes TEXT,
    bookmarked BOOLEAN DEFAULT false,
    UNIQUE(user_id, topic_id)
);

CREATE INDEX IF NOT EXISTS idx_progress_user ON user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_progress_topic ON user_progress(topic_id);
CREATE INDEX IF NOT EXISTS idx_progress_status ON user_progress(status);

-- ============================================
-- TABLE: project_submissions
-- Soumissions de code des utilisateurs
-- ============================================
CREATE TABLE IF NOT EXISTS project_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    language VARCHAR(10) DEFAULT 'c',
    compilation_output TEXT,
    compilation_success BOOLEAN,
    test_results JSONB DEFAULT '[]',
    tests_passed INTEGER DEFAULT 0,
    tests_total INTEGER DEFAULT 0,
    score INTEGER DEFAULT 0,
    execution_time_ms INTEGER,
    memory_usage_kb INTEGER,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'compiling', 'testing', 'passed', 'failed', 'error')),
    feedback TEXT,
    submitted_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_submissions_user ON project_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_submissions_project ON project_submissions(project_id);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON project_submissions(status);

-- ============================================
-- TABLE: badges
-- Définition des badges disponibles
-- ============================================
CREATE TABLE IF NOT EXISTS badges (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    category VARCHAR(50),
    criteria JSONB NOT NULL, -- Critères d'obtention
    points_bonus INTEGER DEFAULT 0,
    rarity VARCHAR(20) DEFAULT 'common' CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLE: user_badges
-- Badges obtenus par les utilisateurs
-- ============================================
CREATE TABLE IF NOT EXISTS user_badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    badge_id VARCHAR(50) REFERENCES badges(id) ON DELETE CASCADE,
    earned_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, badge_id)
);

CREATE INDEX IF NOT EXISTS idx_user_badges_user ON user_badges(user_id);

-- ============================================
-- TABLE: user_activity
-- Historique d'activité pour les streaks
-- ============================================
CREATE TABLE IF NOT EXISTS user_activity (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    activity_type VARCHAR(50) NOT NULL,
    activity_data JSONB DEFAULT '{}',
    points_earned INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_user ON user_activity(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_date ON user_activity(created_at);

-- ============================================
-- TABLE: resources
-- Ressources d'apprentissage (liens, docs, vidéos)
-- ============================================
CREATE TABLE IF NOT EXISTS resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    topic_id UUID REFERENCES topics(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    url TEXT,
    resource_type VARCHAR(50) CHECK (resource_type IN ('article', 'video', 'documentation', 'book', 'tool', 'exercise')),
    description TEXT,
    is_required BOOLEAN DEFAULT false,
    position INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_resources_topic ON resources(topic_id);

-- ============================================
-- TABLE: sessions (pour la gestion des tokens)
-- ============================================
CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL,
    user_agent TEXT,
    ip_address VARCHAR(45),
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    is_valid BOOLEAN DEFAULT true
);

CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token_hash);

-- ============================================
-- FONCTIONS ET TRIGGERS
-- ============================================

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers pour updated_at
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_topics_updated_at
    BEFORE UPDATE ON topics
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Fonction pour calculer le niveau basé sur les points
CREATE OR REPLACE FUNCTION calculate_level(points INTEGER)
RETURNS INTEGER AS $$
BEGIN
    IF points < 1000 THEN RETURN 1;
    ELSIF points < 3000 THEN RETURN 2;
    ELSIF points < 6000 THEN RETURN 3;
    ELSIF points < 10000 THEN RETURN 4;
    ELSE RETURN 5;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour mettre à jour le niveau après gain de points
CREATE OR REPLACE FUNCTION update_user_level()
RETURNS TRIGGER AS $$
BEGIN
    NEW.current_level = calculate_level(NEW.total_points);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_level
    BEFORE UPDATE OF total_points ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_user_level();

-- ============================================
-- VUES UTILES
-- ============================================

-- Vue du classement des utilisateurs
CREATE OR REPLACE VIEW leaderboard AS
SELECT 
    u.id,
    u.username,
    u.avatar_url,
    u.total_points,
    u.current_level,
    u.streak_days,
    COUNT(DISTINCT ub.badge_id) as badges_count,
    COUNT(DISTINCT CASE WHEN up.status = 'completed' THEN up.topic_id END) as topics_completed,
    RANK() OVER (ORDER BY u.total_points DESC) as rank
FROM users u
LEFT JOIN user_badges ub ON u.id = ub.user_id
LEFT JOIN user_progress up ON u.id = up.user_id
WHERE u.is_active = true
GROUP BY u.id
ORDER BY u.total_points DESC;

-- Vue de la progression par module
CREATE OR REPLACE VIEW module_progress AS
SELECT 
    up.user_id,
    m.id as module_id,
    m.title as module_title,
    COUNT(t.id) as total_topics,
    COUNT(CASE WHEN up.status = 'completed' THEN 1 END) as completed_topics,
    ROUND(COUNT(CASE WHEN up.status = 'completed' THEN 1 END)::numeric / NULLIF(COUNT(t.id), 0) * 100, 2) as progress_percent
FROM modules m
JOIN topics t ON t.module_id = m.id
LEFT JOIN user_progress up ON up.topic_id = t.id
GROUP BY up.user_id, m.id, m.title;
