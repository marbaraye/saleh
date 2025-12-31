// Types utilisateur
export interface User {
  id: string;
  username: string;
  email: string;
  avatarUrl?: string;
  bio?: string;
  totalPoints: number;
  currentLevel: number;
  streakDays: number;
  badgesCount?: number;
  topicsCompleted?: number;
  projectsCompleted?: number;
  rank?: number;
  createdAt: string;
  lastLogin?: string;
  preferences?: UserPreferences;
}

export interface UserPreferences {
  theme: 'dark' | 'light';
  notifications: boolean;
  language: string;
}

// Types authentification
export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  username: string;
  email: string;
  password: string;
}

// Types modules et topics
export interface Module {
  id: string;
  slug: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  estimatedHours: number;
  position: number;
  totalTopics: number;
  completedTopics: number;
  inProgressTopics: number;
  progressPercent: number;
}

export interface Topic {
  id: string;
  slug: string;
  title: string;
  description: string;
  content?: TopicContent;
  difficulty: number;
  estimatedHours: number;
  pointsReward: number;
  position: number;
  module?: {
    slug: string;
    title: string;
    icon: string;
    color?: string;
  };
  status: 'not_started' | 'in_progress' | 'completed';
  startedAt?: string;
  completedAt?: string;
  hasProject?: boolean;
  project?: ProjectSummary;
  resources?: Resource[];
  prerequisites?: { id: string; slug: string; title: string }[];
  nextTopic?: { slug: string; title: string };
  progress?: TopicProgress;
}

export interface TopicContent {
  objectives: string[];
  theory: string;
  examples: CodeExample[];
  checkpoints: string[];
}

export interface CodeExample {
  title: string;
  code: string;
  explanation?: string;
}

export interface TopicProgress {
  status: 'not_started' | 'in_progress' | 'completed';
  startedAt?: string;
  completedAt?: string;
  timeSpentMinutes: number;
  notes?: string;
  bookmarked: boolean;
}

export interface Resource {
  id: string;
  title: string;
  url?: string;
  type: 'article' | 'video' | 'documentation' | 'book' | 'tool' | 'exercise';
  description?: string;
  isRequired: boolean;
}

// Types projets
export interface Project {
  id: string;
  slug: string;
  title: string;
  description: string;
  requirements: string[];
  starterCode: string;
  hints: string[];
  difficulty: number;
  pointsReward: number;
  timeLimitMinutes: number;
  testCases: TestCase[];
  topic: {
    slug: string;
    title: string;
  };
  module: {
    slug: string;
    title: string;
    icon?: string;
  };
  submissions?: SubmissionSummary[];
  bestSubmission?: SubmissionSummary;
  completed?: boolean;
}

export interface ProjectSummary {
  id: string;
  slug: string;
  title: string;
  description: string;
  difficulty: number;
  pointsReward: number;
  timeLimitMinutes: number;
}

export interface TestCase {
  name: string;
  type: string;
}

export interface Submission {
  id: string;
  code: string;
  status: 'pending' | 'compiling' | 'testing' | 'passed' | 'failed' | 'error';
  score: number;
  testsPassed: number;
  testsTotal: number;
  testResults?: TestResult[];
  compilationOutput?: string;
  compilationSuccess?: boolean;
  submittedAt: string;
}

export interface SubmissionSummary {
  id: string;
  status: string;
  score: number;
  testsPassed: number;
  testsTotal: number;
  submittedAt: string;
}

export interface TestResult {
  name: string;
  passed: boolean;
  message: string;
}

export interface SubmissionResult {
  submissionId: string;
  status: string;
  score: number;
  testsPassed: number;
  testsTotal: number;
  results: TestResult[];
  pointsEarned: number;
}

// Types badges
export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  criteria: Record<string, unknown>;
  pointsBonus: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  earned: boolean;
  earnedAt?: string;
}

// Types progression
export interface Progress {
  global: {
    topicsCompleted: number;
    topicsInProgress: number;
    totalTopics: number;
    projectsCompleted: number;
    totalProjects: number;
    overallProgress: number;
  };
  modules: ModuleProgress[];
  recentActivity: Activity[];
}

export interface ModuleProgress {
  id: string;
  slug: string;
  title: string;
  icon: string;
  color: string;
  totalTopics: number;
  completedTopics: number;
  inProgressTopics: number;
  progressPercent: number;
}

export interface Activity {
  type: string;
  data: Record<string, unknown>;
  pointsEarned: number;
  createdAt: string;
}

// Types leaderboard
export interface LeaderboardEntry {
  id: string;
  username: string;
  avatarUrl?: string;
  totalPoints: number;
  currentLevel: number;
  streakDays?: number;
  badgesCount?: number;
  topicsCompleted?: number;
  rank: number;
  isCurrentUser?: boolean;
}

export interface Leaderboard {
  leaderboard: LeaderboardEntry[];
  total: number;
  userRank?: number;
}

// Types API
export interface ApiError {
  error: string;
  details?: unknown;
  code?: string;
}

export interface ApiResponse<T> {
  data?: T;
  error?: ApiError;
}
