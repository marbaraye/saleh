import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ChevronRight, 
  Clock, 
  Star,
  CheckCircle,
  Play,
  Lock
} from 'lucide-react';
import { modulesApi } from '../services/api';
import type { Module, Topic } from '../types';

interface ModuleWithTopics extends Module {
  topics: Topic[];
}

export default function RoadmapPage() {
  const [modules, setModules] = useState<ModuleWithTopics[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchModules = async () => {
      try {
        const modulesData = await modulesApi.getAll();
        
        // Charger les topics pour chaque module
        const modulesWithTopics = await Promise.all(
          modulesData.map(async (module) => {
            try {
              const moduleDetail = await modulesApi.getBySlug(module.slug);
              return { ...module, topics: moduleDetail.topics || [] };
            } catch {
              return { ...module, topics: [] };
            }
          })
        );
        
        setModules(modulesWithTopics);
        
        // Ouvrir le premier module non complété
        const firstIncomplete = modulesWithTopics.find(m => m.progressPercent < 100);
        if (firstIncomplete) {
          setExpandedModules(new Set([firstIncomplete.id]));
        }
      } catch (error) {
        console.error('Erreur lors du chargement:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchModules();
  }, []);

  const toggleModule = (moduleId: string) => {
    setExpandedModules(prev => {
      const newSet = new Set(prev);
      if (newSet.has(moduleId)) {
        newSet.delete(moduleId);
      } else {
        newSet.add(moduleId);
      }
      return newSet;
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-24 bg-dark-800 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">Feuille de route</h1>
        <p className="text-dark-400">
          Suivez votre progression à travers les modules de C avancé
        </p>
      </div>

      {/* Timeline des modules */}
      <div className="relative">
        {/* Ligne de connexion */}
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-dark-700" />

        {modules.map((module, index) => (
          <div key={module.id} className="relative mb-6">
            {/* Point de la timeline */}
            <div 
              className={`absolute left-4 w-5 h-5 rounded-full border-2 z-10 ${
                module.progressPercent === 100
                  ? 'bg-success-500 border-success-500'
                  : module.progressPercent > 0
                  ? 'bg-primary-500 border-primary-500'
                  : 'bg-dark-800 border-dark-600'
              }`}
            />

            {/* Carte du module */}
            <div className="ml-12">
              <button
                onClick={() => toggleModule(module.id)}
                className="w-full text-left card-hover"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div 
                      className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl flex-shrink-0"
                      style={{ backgroundColor: `${module.color}20` }}
                    >
                      {module.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-dark-500 uppercase tracking-wider">
                          Module {index + 1}
                        </span>
                        {module.progressPercent === 100 && (
                          <span className="badge-success">Complété</span>
                        )}
                        {module.progressPercent > 0 && module.progressPercent < 100 && (
                          <span className="badge-primary">En cours</span>
                        )}
                      </div>
                      <h2 className="text-lg font-semibold text-white mb-1">
                        {module.title}
                      </h2>
                      <p className="text-sm text-dark-400 line-clamp-2">
                        {module.description}
                      </p>
                      <div className="flex items-center gap-4 mt-3 text-sm text-dark-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {module.estimatedHours}h
                        </span>
                        <span>
                          {module.completedTopics}/{module.totalTopics} topics
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-2xl font-bold text-primary-400">
                        {module.progressPercent}%
                      </p>
                    </div>
                    <ChevronRight 
                      className={`w-5 h-5 text-dark-500 transition-transform ${
                        expandedModules.has(module.id) ? 'rotate-90' : ''
                      }`}
                    />
                  </div>
                </div>
                
                {/* Barre de progression */}
                <div className="mt-4 progress-bar">
                  <div 
                    className="progress-bar-fill"
                    style={{ 
                      width: `${module.progressPercent}%`,
                      background: `linear-gradient(to right, ${module.color}, ${module.color}cc)`
                    }}
                  />
                </div>
              </button>

              {/* Liste des topics */}
              {expandedModules.has(module.id) && module.topics.length > 0 && (
                <div className="mt-4 ml-4 space-y-2 animate-slide-up">
                  {module.topics.map((topic, topicIndex) => (
                    <TopicItem 
                      key={topic.id} 
                      topic={topic} 
                      index={topicIndex}
                      moduleColor={module.color}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TopicItem({ 
  topic, 
  index, 
  moduleColor 
}: { 
  topic: Topic; 
  index: number;
  moduleColor: string;
}) {
  const getStatusIcon = () => {
    if (topic.status === 'completed') {
      return <CheckCircle className="w-5 h-5 text-success-400" />;
    }
    if (topic.status === 'in_progress') {
      return <Play className="w-5 h-5 text-primary-400" />;
    }
    return <Lock className="w-5 h-5 text-dark-600" />;
  };

  return (
    <Link
      to={`/topics/${topic.slug}`}
      className="flex items-center gap-4 p-4 bg-dark-800/50 rounded-lg hover:bg-dark-800 transition-colors group"
    >
      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-dark-700 text-sm font-medium text-dark-400">
        {index + 1}
      </div>
      
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-white group-hover:text-primary-400 transition-colors truncate">
          {topic.title}
        </h3>
        <div className="flex items-center gap-3 mt-1 text-sm text-dark-500">
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
          <span className="text-primary-400">+{topic.pointsReward} pts</span>
        </div>
      </div>
      
      {getStatusIcon()}
    </Link>
  );
}
