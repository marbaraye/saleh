import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  ArrowRight,
  Clock, 
  Star,
  CheckCircle,
  BookOpen,
  Bookmark,
  BookmarkCheck,
  Play
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { topicsApi, progressApi } from '../services/api';
import type { Topic } from '../types';
import toast from 'react-hot-toast';

export default function TopicPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [topic, setTopic] = useState<Topic | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);

  useEffect(() => {
    const fetchTopic = async () => {
      if (!slug) return;
      
      try {
        const data = await topicsApi.getBySlug(slug);
        setTopic(data);
        setIsBookmarked(data.progress?.bookmarked || false);
        
        // Marquer comme commencé si pas encore fait
        if (data.status === 'not_started') {
          await progressApi.startTopic(data.id);
        }
      } catch (error) {
        console.error('Erreur lors du chargement:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTopic();
  }, [slug]);

  const handleComplete = async () => {
    if (!topic) return;
    
    setIsCompleting(true);
    try {
      const result = await progressApi.completeTopic(topic.id);
      toast.success(`Topic complété ! +${result.pointsEarned} points`);
      
      // Rediriger vers le prochain topic ou le projet
      if (topic.hasProject && topic.project) {
        navigate(`/projects/${topic.project.slug}`);
      } else if (topic.nextTopic) {
        navigate(`/topics/${topic.nextTopic.slug}`);
      } else {
        navigate('/roadmap');
      }
    } catch (error) {
      toast.error('Erreur lors de la complétion');
    } finally {
      setIsCompleting(false);
    }
  };

  const handleBookmark = async () => {
    if (!topic) return;
    
    try {
      await progressApi.toggleBookmark(topic.id, !isBookmarked);
      setIsBookmarked(!isBookmarked);
      toast.success(isBookmarked ? 'Retiré des favoris' : 'Ajouté aux favoris');
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 w-48 bg-dark-800 rounded" />
        <div className="h-64 bg-dark-800 rounded-xl" />
        <div className="h-96 bg-dark-800 rounded-xl" />
      </div>
    );
  }

  if (!topic) {
    return (
      <div className="text-center py-12">
        <p className="text-dark-400">Topic non trouvé</p>
        <Link to="/roadmap" className="btn-primary mt-4">
          Retour à la feuille de route
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Link 
          to={topic.module ? `/modules/${topic.module.slug}` : '/roadmap'}
          className="inline-flex items-center gap-2 text-dark-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {topic.module?.title || 'Retour'}
        </Link>
        
        <button
          onClick={handleBookmark}
          className="p-2 text-dark-400 hover:text-yellow-400 transition-colors"
          title={isBookmarked ? 'Retirer des favoris' : 'Ajouter aux favoris'}
        >
          {isBookmarked ? (
            <BookmarkCheck className="w-5 h-5 text-yellow-400" />
          ) : (
            <Bookmark className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* En-tête */}
      <div className="card">
        <div className="flex items-start gap-4 mb-4">
          {topic.module && (
            <div 
              className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl"
              style={{ backgroundColor: `${topic.module.color || '#3b82f6'}20` }}
            >
              {topic.module.icon}
            </div>
          )}
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-white mb-2">{topic.title}</h1>
            <p className="text-dark-300">{topic.description}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-sm text-dark-400">
          <span className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            {topic.estimatedHours} heures
          </span>
          <span className="flex items-center gap-1">
            Difficulté:
            {[...Array(5)].map((_, i) => (
              <Star 
                key={i}
                className={`w-4 h-4 ${
                  i < topic.difficulty 
                    ? 'text-yellow-400 fill-yellow-400' 
                    : 'text-dark-600'
                }`}
              />
            ))}
          </span>
          <span className="text-primary-400 font-medium">
            +{topic.pointsReward} points
          </span>
          {topic.status === 'completed' && (
            <span className="badge-success flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              Complété
            </span>
          )}
        </div>
      </div>

      {/* Objectifs */}
      {topic.content?.objectives && topic.content.objectives.length > 0 && (
        <div className="card">
          <h2 className="text-lg font-semibold text-white mb-4">
            🎯 Objectifs d'apprentissage
          </h2>
          <ul className="space-y-2">
            {topic.content.objectives.map((objective, index) => (
              <li key={index} className="flex items-start gap-3 text-dark-300">
                <CheckCircle className="w-5 h-5 text-success-400 flex-shrink-0 mt-0.5" />
                {objective}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Contenu théorique */}
      {topic.content?.theory && (
        <div className="card prose prose-invert max-w-none">
          <h2 className="text-lg font-semibold text-white mb-4">
            📚 Théorie
          </h2>
          <ReactMarkdown
            components={{
              code({ node, className, children, ...props }) {
                const match = /language-(\w+)/.exec(className || '');
                const inline = !match;
                return !inline ? (
                  <SyntaxHighlighter
                    style={vscDarkPlus as Record<string, React.CSSProperties>}
                    language={match[1]}
                    PreTag="div"
                    className="rounded-lg"
                  >
                    {String(children).replace(/\n$/, '')}
                  </SyntaxHighlighter>
                ) : (
                  <code className="bg-dark-700 px-1.5 py-0.5 rounded text-primary-400" {...props}>
                    {children}
                  </code>
                );
              }
            }}
          >
            {topic.content.theory}
          </ReactMarkdown>
        </div>
      )}

      {/* Exemples de code */}
      {topic.content?.examples && topic.content.examples.length > 0 && (
        <div className="card">
          <h2 className="text-lg font-semibold text-white mb-4">
            💻 Exemples de code
          </h2>
          <div className="space-y-6">
            {topic.content.examples.map((example, index) => (
              <div key={index}>
                <h3 className="font-medium text-white mb-2">{example.title}</h3>
                <SyntaxHighlighter
                  style={vscDarkPlus as Record<string, React.CSSProperties>}
                  language="c"
                  className="rounded-lg"
                >
                  {example.code}
                </SyntaxHighlighter>
                {example.explanation && (
                  <p className="mt-2 text-sm text-dark-400">{example.explanation}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Checkpoints */}
      {topic.content?.checkpoints && topic.content.checkpoints.length > 0 && (
        <div className="card">
          <h2 className="text-lg font-semibold text-white mb-4">
            ✅ Points de contrôle
          </h2>
          <ul className="space-y-3">
            {topic.content.checkpoints.map((checkpoint, index) => (
              <li key={index} className="flex items-start gap-3">
                <input 
                  type="checkbox" 
                  className="mt-1 w-4 h-4 rounded border-dark-600 bg-dark-800 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-dark-300">{checkpoint}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Ressources */}
      {topic.resources && topic.resources.length > 0 && (
        <div className="card">
          <h2 className="text-lg font-semibold text-white mb-4">
            📖 Ressources complémentaires
          </h2>
          <div className="space-y-2">
            {topic.resources.map((resource) => (
              <a
                key={resource.id}
                href={resource.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 bg-dark-800/50 rounded-lg hover:bg-dark-800 transition-colors"
              >
                <BookOpen className="w-5 h-5 text-primary-400" />
                <div>
                  <p className="font-medium text-white">{resource.title}</p>
                  {resource.description && (
                    <p className="text-sm text-dark-400">{resource.description}</p>
                  )}
                </div>
                {resource.isRequired && (
                  <span className="badge-warning ml-auto">Requis</span>
                )}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="card flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-center sm:text-left">
          {topic.status !== 'completed' ? (
            <>
              <p className="font-medium text-white">Prêt à continuer ?</p>
              <p className="text-sm text-dark-400">
                {topic.hasProject 
                  ? 'Complétez ce topic pour accéder au projet pratique'
                  : 'Marquez ce topic comme complété pour gagner des points'
                }
              </p>
            </>
          ) : (
            <>
              <p className="font-medium text-success-400">Topic complété !</p>
              <p className="text-sm text-dark-400">
                Vous avez gagné {topic.pointsReward} points
              </p>
            </>
          )}
        </div>
        
        <div className="flex items-center gap-3">
          {topic.hasProject && topic.project && (
            <Link 
              to={`/projects/${topic.project.slug}`}
              className="btn-secondary"
            >
              <Play className="w-4 h-4 mr-2" />
              Projet pratique
            </Link>
          )}
          
          {topic.status !== 'completed' ? (
            <button
              onClick={handleComplete}
              disabled={isCompleting}
              className="btn-primary"
            >
              {isCompleting ? 'Validation...' : 'Marquer comme complété'}
              <CheckCircle className="w-4 h-4 ml-2" />
            </button>
          ) : topic.nextTopic ? (
            <Link to={`/topics/${topic.nextTopic.slug}`} className="btn-primary">
              Topic suivant
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          ) : (
            <Link to="/roadmap" className="btn-primary">
              Retour à la feuille de route
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
