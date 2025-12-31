import { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { 
  ArrowLeft, 
  Play, 
  Clock, 
  Star,
  CheckCircle,
  XCircle,
  Lightbulb,
  RotateCcw,
  Send,
  Loader2
} from 'lucide-react';
import { projectsApi } from '../services/api';
import type { Project, TestResult } from '../types';
import toast from 'react-hot-toast';

export default function ProjectPage() {
  const { slug } = useParams<{ slug: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[] | null>(null);
  const [currentHintIndex, setCurrentHintIndex] = useState(-1);
  const [hints, setHints] = useState<string[]>([]);
  const editorRef = useRef<unknown>(null);

  useEffect(() => {
    const fetchProject = async () => {
      if (!slug) return;
      
      try {
        const data = await projectsApi.getBySlug(slug);
        setProject(data);
        setCode(data.starterCode || '// Écrivez votre code ici\n');
      } catch (error) {
        console.error('Erreur lors du chargement:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProject();
  }, [slug]);

  const handleEditorMount = (editor: unknown) => {
    editorRef.current = editor;
  };

  const handleSubmit = async () => {
    if (!project || !code.trim()) return;
    
    setIsSubmitting(true);
    setTestResults(null);
    
    try {
      const result = await projectsApi.submit(project.slug, code);
      setTestResults(result.results);
      
      if (result.status === 'passed') {
        toast.success(`Projet réussi ! +${result.pointsEarned} points`);
      } else {
        toast.error(`${result.testsPassed}/${result.testsTotal} tests passés`);
      }
    } catch (error) {
      toast.error('Erreur lors de la soumission');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGetHint = async () => {
    if (!project) return;
    
    const nextIndex = currentHintIndex + 1;
    
    if (nextIndex >= project.hints.length) {
      toast.error('Plus d\'indices disponibles');
      return;
    }
    
    try {
      const result = await projectsApi.getHint(project.slug, nextIndex);
      setHints([...hints, result.hint]);
      setCurrentHintIndex(nextIndex);
      toast.success('Nouvel indice débloqué');
    } catch (error) {
      toast.error('Erreur lors de la récupération de l\'indice');
    }
  };

  const handleReset = () => {
    if (project) {
      setCode(project.starterCode || '// Écrivez votre code ici\n');
      setTestResults(null);
      toast.success('Code réinitialisé');
    }
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 w-48 bg-dark-800 rounded" />
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="h-96 bg-dark-800 rounded-xl" />
          <div className="h-96 bg-dark-800 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <p className="text-dark-400">Projet non trouvé</p>
        <Link to="/projects" className="btn-primary mt-4">
          Retour aux projets
        </Link>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col animate-fade-in">
      {/* En-tête */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <Link 
            to={`/topics/${project.topic.slug}`}
            className="p-2 text-dark-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-white">{project.title}</h1>
            <div className="flex items-center gap-3 text-sm text-dark-400">
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
              <span className="text-primary-400">+{project.pointsReward} pts</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={handleGetHint}
            disabled={currentHintIndex >= project.hints.length - 1}
            className="btn-ghost btn-sm"
            title="Obtenir un indice"
          >
            <Lightbulb className="w-4 h-4 mr-1" />
            Indice ({currentHintIndex + 1}/{project.hints.length})
          </button>
          <button
            onClick={handleReset}
            className="btn-ghost btn-sm"
            title="Réinitialiser le code"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="btn-primary btn-sm"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Validation...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Soumettre
              </>
            )}
          </button>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="flex-1 grid lg:grid-cols-2 gap-4 min-h-0">
        {/* Panneau gauche - Instructions */}
        <div className="flex flex-col gap-4 overflow-y-auto">
          {/* Description */}
          <div className="card">
            <h2 className="font-semibold text-white mb-3">Description</h2>
            <p className="text-dark-300">{project.description}</p>
          </div>

          {/* Exigences */}
          <div className="card">
            <h2 className="font-semibold text-white mb-3">Exigences</h2>
            <ul className="space-y-2">
              {project.requirements.map((req, index) => (
                <li key={index} className="flex items-start gap-2 text-dark-300">
                  <span className="text-primary-400">•</span>
                  {req}
                </li>
              ))}
            </ul>
          </div>

          {/* Tests */}
          <div className="card">
            <h2 className="font-semibold text-white mb-3">
              Tests ({project.testCases.length})
            </h2>
            <div className="space-y-2">
              {project.testCases.map((test, index) => {
                const result = testResults?.[index];
                return (
                  <div 
                    key={index}
                    className={`flex items-center justify-between p-3 rounded-lg ${
                      result 
                        ? result.passed 
                          ? 'bg-success-900/20 border border-success-800/50' 
                          : 'bg-red-900/20 border border-red-800/50'
                        : 'bg-dark-800/50'
                    }`}
                  >
                    <span className="text-sm text-dark-300">{test.name}</span>
                    {result && (
                      result.passed ? (
                        <CheckCircle className="w-5 h-5 text-success-400" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-400" />
                      )
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Indices débloqués */}
          {hints.length > 0 && (
            <div className="card">
              <h2 className="font-semibold text-white mb-3 flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-yellow-400" />
                Indices débloqués
              </h2>
              <div className="space-y-2">
                {hints.map((hint, index) => (
                  <div 
                    key={index}
                    className="p-3 bg-yellow-900/20 border border-yellow-800/30 rounded-lg"
                  >
                    <p className="text-sm text-yellow-200">{hint}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Panneau droit - Éditeur */}
        <div className="flex flex-col gap-4 min-h-0">
          {/* Éditeur de code */}
          <div className="flex-1 card p-0 overflow-hidden min-h-[400px]">
            <div className="flex items-center justify-between px-4 py-2 bg-dark-900 border-b border-dark-700">
              <span className="text-sm text-dark-400">main.c</span>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <div className="w-3 h-3 rounded-full bg-green-500" />
              </div>
            </div>
            <Editor
              height="100%"
              defaultLanguage="c"
              value={code}
              onChange={(value) => setCode(value || '')}
              onMount={handleEditorMount}
              theme="vs-dark"
              options={{
                fontSize: 14,
                fontFamily: 'Fira Code, Monaco, Consolas, monospace',
                fontLigatures: true,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                lineNumbers: 'on',
                renderLineHighlight: 'all',
                tabSize: 4,
                insertSpaces: true,
                automaticLayout: true,
                padding: { top: 16, bottom: 16 },
              }}
            />
          </div>

          {/* Résultats de compilation */}
          {testResults && (
            <div className="card max-h-48 overflow-y-auto">
              <h3 className="font-semibold text-white mb-2">Résultats</h3>
              <div className="space-y-2">
                {testResults.map((result, index) => (
                  <div 
                    key={index}
                    className={`p-2 rounded text-sm ${
                      result.passed 
                        ? 'bg-success-900/20 text-success-300' 
                        : 'bg-red-900/20 text-red-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {result.passed ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        <XCircle className="w-4 h-4" />
                      )}
                      <span className="font-medium">{result.name}</span>
                    </div>
                    {result.message && (
                      <p className="mt-1 text-xs opacity-80">{result.message}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
