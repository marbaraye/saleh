import { Outlet, Link } from 'react-router-dom';
import { Code2 } from 'lucide-react';

export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-dark-950 flex">
      {/* Panneau gauche - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-900 via-dark-900 to-dark-950 p-12 flex-col justify-between">
        <Link to="/" className="flex items-center gap-3">
          <Code2 className="w-10 h-10 text-primary-400" />
          <span className="text-2xl font-bold text-white">C Mastery</span>
        </Link>
        
        <div className="space-y-6">
          <h1 className="text-4xl font-bold text-white leading-tight">
            Maîtrisez le C Avancé
          </h1>
          <p className="text-lg text-dark-300">
            Une feuille de route interactive pour devenir expert en programmation système, 
            gestion mémoire, réseaux et concurrence.
          </p>
          
          <div className="grid grid-cols-2 gap-4 pt-8">
            <div className="bg-dark-800/50 rounded-lg p-4">
              <div className="text-3xl font-bold text-primary-400">6</div>
              <div className="text-sm text-dark-400">Modules complets</div>
            </div>
            <div className="bg-dark-800/50 rounded-lg p-4">
              <div className="text-3xl font-bold text-success-400">240h</div>
              <div className="text-sm text-dark-400">De contenu</div>
            </div>
            <div className="bg-dark-800/50 rounded-lg p-4">
              <div className="text-3xl font-bold text-yellow-400">20+</div>
              <div className="text-sm text-dark-400">Projets pratiques</div>
            </div>
            <div className="bg-dark-800/50 rounded-lg p-4">
              <div className="text-3xl font-bold text-purple-400">∞</div>
              <div className="text-sm text-dark-400">Progression sauvegardée</div>
            </div>
          </div>
        </div>
        
        <div className="text-sm text-dark-500">
          © 2024 C Mastery. Tous droits réservés.
        </div>
      </div>
      
      {/* Panneau droit - Formulaire */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Logo mobile */}
          <Link to="/" className="flex lg:hidden items-center gap-3 mb-8 justify-center">
            <Code2 className="w-10 h-10 text-primary-400" />
            <span className="text-2xl font-bold text-white">C Mastery</span>
          </Link>
          
          <Outlet />
        </div>
      </div>
    </div>
  );
}
