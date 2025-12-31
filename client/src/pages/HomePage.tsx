import { Link } from 'react-router-dom';
import { 
  Code2, 
  Cpu, 
  Network, 
  Layers, 
  Zap, 
  Shield,
  ArrowRight,
  CheckCircle,
  Star
} from 'lucide-react';

const features = [
  {
    icon: Cpu,
    title: 'Gestion Mémoire',
    description: 'Maîtrisez malloc, mmap, et créez vos propres allocateurs'
  },
  {
    icon: Layers,
    title: 'Pointeurs Avancés',
    description: 'Triple pointeurs, inline assembly, manipulation de bits'
  },
  {
    icon: Network,
    title: 'Programmation Réseau',
    description: 'Sockets, epoll, serveurs haute performance'
  },
  {
    icon: Zap,
    title: 'Concurrence',
    description: 'Threads POSIX, synchronisation, structures lock-free'
  },
  {
    icon: Shield,
    title: 'Système Linux',
    description: 'Processus, IPC, drivers kernel, sécurité'
  },
  {
    icon: Code2,
    title: 'Projets Pratiques',
    description: 'Validez vos compétences avec des projets réels'
  }
];

const modules = [
  { name: 'Maîtrise de la Mémoire', hours: 40, color: 'bg-purple-500' },
  { name: 'Pointeurs & Bas Niveau', hours: 35, color: 'bg-red-500' },
  { name: 'Système de Fichiers', hours: 30, color: 'bg-green-500' },
  { name: 'Sockets Réseau', hours: 40, color: 'bg-blue-500' },
  { name: 'Threads & Concurrence', hours: 45, color: 'bg-yellow-500' },
  { name: 'Programmation Système', hours: 50, color: 'bg-indigo-500' }
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-dark-950">
      {/* Hero Section */}
      <header className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-900/20 via-dark-950 to-dark-950" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        
        {/* Navbar */}
        <nav className="relative z-10 px-6 py-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <Code2 className="w-8 h-8 text-primary-500" />
              <span className="text-xl font-bold text-white">C Mastery</span>
            </Link>
            <div className="flex items-center gap-4">
              <Link to="/login" className="text-dark-300 hover:text-white transition-colors">
                Connexion
              </Link>
              <Link to="/register" className="btn-primary">
                Commencer gratuitement
              </Link>
            </div>
          </div>
        </nav>

        {/* Hero content */}
        <div className="relative z-10 max-w-7xl mx-auto px-6 py-24 lg:py-32">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-900/30 rounded-full text-primary-400 text-sm mb-6">
              <Star className="w-4 h-4" />
              <span>Nouveau : Module Programmation Système disponible</span>
            </div>
            
            <h1 className="text-4xl lg:text-6xl font-bold text-white leading-tight mb-6">
              Devenez expert en{' '}
              <span className="text-gradient">C Avancé</span>
            </h1>
            
            <p className="text-xl text-dark-300 mb-8">
              Une feuille de route interactive pour maîtriser la programmation système, 
              la gestion mémoire, les réseaux et la concurrence. Avec des projets pratiques 
              et un suivi de progression personnalisé.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/register" className="btn-primary btn-lg">
                Commencer maintenant
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
              <Link to="/roadmap-preview" className="btn-secondary btn-lg">
                Voir la feuille de route
              </Link>
            </div>
            
            <div className="flex items-center gap-8 mt-12 text-sm text-dark-400">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-success-500" />
                <span>240+ heures de contenu</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-success-500" />
                <span>20+ projets pratiques</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-success-500" />
                <span>Progression sauvegardée</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Features Section */}
      <section className="py-24 bg-dark-900">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
              Tout ce dont vous avez besoin
            </h2>
            <p className="text-lg text-dark-400 max-w-2xl mx-auto">
              Une plateforme complète pour passer du niveau intermédiaire à expert en C
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="card-hover group"
              >
                <div className="w-12 h-12 rounded-lg bg-primary-900/50 flex items-center justify-center mb-4 group-hover:bg-primary-900 transition-colors">
                  <feature.icon className="w-6 h-6 text-primary-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-dark-400">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Modules Section */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
              6 Modules Complets
            </h2>
            <p className="text-lg text-dark-400 max-w-2xl mx-auto">
              Une progression structurée du niveau intermédiaire à expert
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {modules.map((module, index) => (
              <div 
                key={index}
                className="card-hover relative overflow-hidden"
              >
                <div className={`absolute top-0 left-0 w-1 h-full ${module.color}`} />
                <div className="pl-4">
                  <span className="text-sm text-dark-500">Module {index + 1}</span>
                  <h3 className="text-lg font-semibold text-white mt-1 mb-2">
                    {module.name}
                  </h3>
                  <p className="text-dark-400 text-sm">
                    {module.hours} heures estimées
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br from-primary-900/30 via-dark-900 to-dark-900">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
            Prêt à maîtriser le C avancé ?
          </h2>
          <p className="text-lg text-dark-300 mb-8">
            Rejoignez des centaines de développeurs qui progressent chaque jour
          </p>
          <Link to="/register" className="btn-primary btn-lg">
            Créer un compte gratuit
            <ArrowRight className="w-5 h-5 ml-2" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-dark-800">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Code2 className="w-6 h-6 text-primary-500" />
              <span className="font-semibold text-white">C Mastery</span>
            </div>
            <p className="text-dark-500 text-sm">
              © 2024 C Mastery. Tous droits réservés.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
