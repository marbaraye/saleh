import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Clock, 
  Star,
  CheckCircle,
  Play,
  BookOpen
} from 'lucide-react';
import { modulesApi } from '../services/api';
import type { Module, Topic } from '../types';

interface ModuleDetail extends Module {
  topics: Topic[];
}

export default function ModulePage() {
  const { slug } = useParams<{ slug: string }>();
  const [module, setModule] = useState<ModuleDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchModule = async () => {
      if (!slug) return;
      
      try {
        const data = await modulesApi.getBySlug(slug);
        setModule(data);
      } catch (error) {
        console.error('Erreur lors du chargement:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchModule();
  }, [slug]);

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 w-32 bg-dark-800 rounded" />
        <div className="h-48 bg-dark-800 rounded-xl" />
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-24 bg-dark-800 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!module) {
    return (
      <div className="text-center py-12">
        <p className="text-dark-400">Module non trouvé</p>
        <Link to="/roadmap" className="btn-primary mt-4">
          Retour à la feuille de route
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Navigation */}
      <Link 
        to="/roadmap" 
        className="inline-flex items-center gap-2 text-dark-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Retour à la feuille de route
      </Link>

      {/* En-tête du module */}
      <div 
        className="card relative overflow-hidden"
        style={{ borderColor: `${module.color}40` }}
      >
        <div 
          className="absolute inset-0 opacity-10"
          style={{ background: `linear-gradient(135deg, ${module.color}, transparent)` }}
        />
        
        <div className="relative">
          <div className="flex items-start gap-4 mb-4">
            <div 
              className="w-16 h-16 rounded-xl flex items-center justify-center text-3xl"
              style={{ backgroundColor: `${module.color}30` }}
            >
              {module.icon}
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-white mb-2">{module.title}</h1>
              <p className="text-dark-300">{module.description}</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="text-center p-3 bg-dark-800/50 rounded-lg">
              <p className="text-2xl font-bold text-white">{module.totalTopics}</p>
              <p className="text-sm text-dark-400">Topics</p>
            </div>
            <div className="text-center p-3 bg-dark-800/50 rounded-lg">
              <p className="text-2xl font-bold text-white">{module.estimatedHours}h</p>
              <p className="text-sm text-dark-400">Durée estimée</p>
            </div>
            <div className="text-center p-3 bg-dark-800/50 rounded-lg">
              <p className="text-2xl font-bold text-primary-400">{module.progressPercent}%</p>
              <p className="text-sm text-dark-400">Progression</p>
            </div>
            <div className="text-center p-3 bg-dark-800/50 rounded-lg">
              <p className="text-2xl font-bold text-success-400">{module.completedTopics}</p>
              <p className="text-sm text-dark-400">Complétés</p>
            </div>
          </div>

          {/* Barre de progression */}
          <div className="mt-6">
            <div className="progress-bar h-3">
              <div 
                className="progress-bar-fill"
                style={{ 
                  width: `${module.progressPercent}%`,
                  background: `linear-gradient(to right, ${module.color}, ${module.color}cc)`
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Liste des topics */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">
          Contenu du module ({module.topics.length} topics)
        </h2>
        
        <div className="space-y-3">
          {module.topics.map((topic, index) => (
            <TopicCard 
              key={topic.id} 
              topic={topic} 
              index={index}
              moduleColor={module.color}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function TopicCard({ 
  topic, 
  index,
  moduleColor 
}: { 
  topic: Topic; 
  index: number;
  moduleColor: string;
}) {
  const getStatusBadge = () => {
    if (topic.status === 'completed') {
      return (
        <span className="badge-success flex items-center gap-1">
          <CheckCircle className="w-3 h-3" />
          Complété
        </span>
      );
    }
    if (topic.status === 'in_progress') {
      return (
        <span className="badge-primary flex items-center gap-1">
          <Play className="w-3 h-3" />
          En cours
        </span>
      );
    }
    return null;
  };

  return (
    <Link
      to={`/topics/${topic.slug}`}
      className="card-hover flex items-center gap-4 group"
    >
      <div 
        className="w-12 h-12 rounded-lg flex items-center justify-center text-lg font-bold flex-shrink-0"
        style={{ 
          backgroundColor: topic.status === 'completed' 
            ? 'rgba(16, 185, 129, 0.2)' 
            : `${moduleColor}20`,
          color: topic.status === 'completed' 
            ? '#10b981' 
            : moduleColor
        }}
      >
        {topic.status === 'completed' ? <CheckCircle className="w-6 h-6" /> : index + 1}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="font-medium text-white group-hover:text-primary-400 transition-colors truncate">
            {topic.title}
          </h3>
          {getStatusBadge()}
        </div>
        <p className="text-sm text-dark-400 line-clamp-1 mb-2">
          {topic.description}
        </p>
        <div className="flex items-center gap-4 text-sm text-dark-500">
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {topic.estimatedHours}h
          </span>
          <span className="flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
              <Star 
                key={i}
                className={`w-3 h-3 ${
                  i < topic.difficulty 
                    ? 'text-yellow-400 fill-yellow-400' 
                    : 'text-dark-600'
                }`}
              />
            ))}
          </span>
          {topic.hasProject && (
            <span className="flex items-center gap-1 text-primary-400">
              <BookOpen className="w-3.5 h-3.5" />
              Projet
            </span>
          )}
        </div>
      </div>
      
      <div className="text-right">
        <p className="text-lg font-bold text-primary-400">+{topic.pointsReward}</p>
        <p className="text-xs text-dark-500">points</p>
      </div>
    </Link>
  );
}
