import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  BookOpen, 
  Trophy, 
  Flame, 
  Target,
  ArrowRight,
  Clock,
  CheckCircle,
  Play
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { progressApi, modulesApi } from '../services/api';
import type { Progress, Module } from '../types';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [progress, setProgress] = useState<Progress | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [progressData, modulesData] = await Promise.all([
          progressApi.getAll(),
          modulesApi.getAll()
        ]);
        setProgress(progressData);
        setModules(modulesData);
      } catch (error) {
        console.error('Erreur lors du chargement:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-32 bg-dark-800 rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-dark-800 rounded-xl" />
          ))}
        </div>
        <div className="h-64 bg-dark-800 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* En-tête de bienvenue */}
      <div className="card bg-gradient-to-br from-primary-900/50 to-dark-800 border-primary-800/30">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">
              Bonjour, {user?.username} ! 👋
            </h1>
            <p className="text-dark-300">
              {progress?.global.topicsCompleted === 0 
                ? 'Prêt à commencer votre apprentissage du C avancé ?'
                : `Vous avez complété ${progress?.global.topicsCompleted} topics. Continuez comme ça !`
              }
            </p>
          </div>
          <Link to="/roadmap" className="btn-primary">
            {progress?.global.topicsCompleted === 0 ? 'Commencer' : 'Continuer'}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
        </div>
      </div>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={<BookOpen className="w-5 h-5" />}
          label="Topics complétés"
          value={`${progress?.global.topicsCompleted || 0}/${progress?.global.totalTopics || 0}`}
          color="text-primary-400"
          bgColor="bg-primary-900/30"
        />
        <StatCard
          icon={<Target className="w-5 h-5" />}
          label="Projets réussis"
          value={`${progress?.global.projectsCompleted || 0}/${progress?.global.totalProjects || 0}`}
          color="text-success-400"
          bgColor="bg-success-900/30"
        />
        <StatCard
          icon={<Trophy className="w-5 h-5" />}
          label="Points totaux"
          value={user?.totalPoints?.toLocaleString() || '0'}
          color="text-yellow-400"
          bgColor="bg-yellow-900/30"
        />
        <StatCard
          icon={<Flame className="w-5 h-5" />}
          label="Série en cours"
          value={`${user?.streakDays || 0} jours`}
          color="text-orange-400"
          bgColor="bg-orange-900/30"
        />
      </div>

      {/* Progression globale */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Progression globale</h2>
          <span className="text-2xl font-bold text-primary-400">
            {progress?.global.overallProgress || 0}%
          </span>
        </div>
        <div className="progress-bar h-3">
          <div 
            className="progress-bar-fill"
            style={{ width: `${progress?.global.overallProgress || 0}%` }}
          />
        </div>
      </div>

      {/* Modules */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Vos modules</h2>
          <Link to="/roadmap" className="text-sm text-primary-400 hover:text-primary-300">
            Voir tout
          </Link>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {modules.map((module) => (
            <ModuleCard key={module.id} module={module} />
          ))}
        </div>
      </div>

      {/* Activité récente */}
      {progress?.recentActivity && progress.recentActivity.length > 0 && (
        <div className="card">
          <h2 className="text-lg font-semibold text-white mb-4">Activité récente</h2>
          <div className="space-y-3">
            {progress.recentActivity.slice(0, 5).map((activity, index) => (
              <ActivityItem key={index} activity={activity} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ 
  icon, 
  label, 
  value, 
  color, 
  bgColor 
}: { 
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
  bgColor: string;
}) {
  return (
    <div className="card">
      <div className={`w-10 h-10 rounded-lg ${bgColor} flex items-center justify-center mb-3 ${color}`}>
        {icon}
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-sm text-dark-400">{label}</p>
    </div>
  );
}

function ModuleCard({ module }: { module: Module }) {
  const getStatusIcon = () => {
    if (module.progressPercent === 100) {
      return <CheckCircle className="w-5 h-5 text-success-400" />;
    }
    if (module.progressPercent > 0) {
      return <Play className="w-5 h-5 text-primary-400" />;
    }
    return <Clock className="w-5 h-5 text-dark-500" />;
  };

  return (
    <Link 
      to={`/modules/${module.slug}`}
      className="card-hover group"
    >
      <div className="flex items-start justify-between mb-3">
        <div 
          className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
          style={{ backgroundColor: `${module.color}20` }}
        >
          {module.icon}
        </div>
        {getStatusIcon()}
      </div>
      
      <h3 className="font-semibold text-white mb-1 group-hover:text-primary-400 transition-colors">
        {module.title}
      </h3>
      <p className="text-sm text-dark-400 line-clamp-2 mb-4">
        {module.description}
      </p>
      
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-dark-400">
            {module.completedTopics}/{module.totalTopics} topics
          </span>
          <span className="text-primary-400 font-medium">
            {module.progressPercent}%
          </span>
        </div>
        <div className="progress-bar">
          <div 
            className="progress-bar-fill"
            style={{ 
              width: `${module.progressPercent}%`,
              background: `linear-gradient(to right, ${module.color}, ${module.color}cc)`
            }}
          />
        </div>
      </div>
    </Link>
  );
}

function ActivityItem({ activity }: { activity: { type: string; data: Record<string, unknown>; pointsEarned: number; createdAt: string } }) {
  const getActivityText = () => {
    switch (activity.type) {
      case 'topic_completed':
        return 'Topic complété';
      case 'project_completed':
        return 'Projet réussi';
      case 'badge_earned':
        return `Badge obtenu: ${(activity.data as { badgeName?: string }).badgeName}`;
      case 'streak_bonus':
        return `Bonus de série (${(activity.data as { streakDays?: number }).streakDays} jours)`;
      default:
        return 'Activité';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 1) return 'Il y a quelques minutes';
    if (hours < 24) return `Il y a ${hours}h`;
    if (hours < 48) return 'Hier';
    return date.toLocaleDateString('fr-FR');
  };

  return (
    <div className="flex items-center justify-between py-2 border-b border-dark-700 last:border-0">
      <div>
        <p className="text-sm text-white">{getActivityText()}</p>
        <p className="text-xs text-dark-500">{formatDate(activity.createdAt)}</p>
      </div>
      {activity.pointsEarned > 0 && (
        <span className="text-sm font-medium text-success-400">
          +{activity.pointsEarned} pts
        </span>
      )}
    </div>
  );
}
