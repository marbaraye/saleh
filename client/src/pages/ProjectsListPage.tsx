import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Clock, 
  Star,
  CheckCircle,
  Play,
  Filter
} from 'lucide-react';
import { projectsApi } from '../services/api';
import type { Project } from '../types';

export default function ProjectsListPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'completed' | 'pending'>('all');
  const [difficultyFilter, setDifficultyFilter] = useState<number | null>(null);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const data = await projectsApi.getAll();
        setProjects(data);
      } catch (error) {
        console.error('Erreur lors du chargement:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProjects();
  }, []);

  const filteredProjects = projects.filter(project => {
    if (filter === 'completed' && !project.completed) return false;
    if (filter === 'pending' && project.completed) return false;
    if (difficultyFilter && project.difficulty !== difficultyFilter) return false;
    return true;
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-32 bg-dark-800 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Projets pratiques</h1>
          <p className="text-dark-400">
            Mettez en pratique vos connaissances avec des projets réels
          </p>
        </div>
        
        {/* Filtres */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-dark-500" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as 'all' | 'completed' | 'pending')}
              className="bg-dark-800 border border-dark-700 rounded-lg px-3 py-2 text-sm text-dark-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">Tous</option>
              <option value="completed">Complétés</option>
              <option value="pending">À faire</option>
            </select>
          </div>
          
          <select
            value={difficultyFilter || ''}
            onChange={(e) => setDifficultyFilter(e.target.value ? parseInt(e.target.value) : null)}
            className="bg-dark-800 border border-dark-700 rounded-lg px-3 py-2 text-sm text-dark-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Toutes difficultés</option>
            <option value="1">★ Facile</option>
            <option value="2">★★ Moyen</option>
            <option value="3">★★★ Difficile</option>
            <option value="4">★★★★ Expert</option>
            <option value="5">★★★★★ Maître</option>
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card text-center">
          <p className="text-3xl font-bold text-white">{projects.length}</p>
          <p className="text-sm text-dark-400">Projets totaux</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-success-400">
            {projects.filter(p => p.completed).length}
          </p>
          <p className="text-sm text-dark-400">Complétés</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-primary-400">
            {projects.filter(p => !p.completed).length}
          </p>
          <p className="text-sm text-dark-400">À faire</p>
        </div>
      </div>

      {/* Liste des projets */}
      <div className="grid md:grid-cols-2 gap-4">
        {filteredProjects.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>

      {filteredProjects.length === 0 && (
        <div className="text-center py-12">
          <p className="text-dark-400">Aucun projet ne correspond aux filtres</p>
        </div>
      )}
    </div>
  );
}

function ProjectCard({ project }: { project: Project }) {
  return (
    <Link
      to={`/projects/${project.slug}`}
      className="card-hover group"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          {project.module?.icon && (
            <span className="text-xl">{project.module.icon}</span>
          )}
          <span className="text-sm text-dark-500">{project.module?.title}</span>
        </div>
        {project.completed ? (
          <span className="badge-success flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            Complété
          </span>
        ) : (
          <span className="badge-primary flex items-center gap-1">
            <Play className="w-3 h-3" />
            À faire
          </span>
        )}
      </div>

      <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-primary-400 transition-colors">
        {project.title}
      </h3>
      <p className="text-sm text-dark-400 line-clamp-2 mb-4">
        {project.description}
      </p>

      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-4 text-dark-500">
          <span className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            {project.timeLimitMinutes} min
          </span>
          <span className="flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
              <Star 
                key={i}
                className={`w-3 h-3 ${
                  i < project.difficulty 
                    ? 'text-yellow-400 fill-yellow-400' 
                    : 'text-dark-600'
                }`}
              />
            ))}
          </span>
        </div>
        <span className="text-primary-400 font-medium">
          +{project.pointsReward} pts
        </span>
      </div>
    </Link>
  );
}
