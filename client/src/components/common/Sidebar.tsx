import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Map, 
  FolderCode, 
  Trophy, 
  Award,
  BookOpen,
  Settings,
  HelpCircle
} from 'lucide-react';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/roadmap', icon: Map, label: 'Feuille de route' },
  { to: '/projects', icon: FolderCode, label: 'Projets' },
  { to: '/leaderboard', icon: Trophy, label: 'Classement' },
  { to: '/badges', icon: Award, label: 'Badges' },
];

const secondaryItems = [
  { to: '/settings', icon: Settings, label: 'Paramètres' },
];

export default function Sidebar() {
  return (
    <aside className="hidden lg:flex flex-col fixed left-0 top-16 bottom-0 w-64 bg-dark-900 border-r border-dark-700 p-4">
      {/* Navigation principale */}
      <nav className="flex-1 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-primary-600/20 text-primary-400'
                  : 'text-dark-400 hover:text-white hover:bg-dark-800'
              }`
            }
          >
            <item.icon className="w-5 h-5" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Séparateur */}
      <div className="border-t border-dark-700 my-4" />

      {/* Navigation secondaire */}
      <nav className="space-y-1">
        {secondaryItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-primary-600/20 text-primary-400'
                  : 'text-dark-400 hover:text-white hover:bg-dark-800'
              }`
            }
          >
            <item.icon className="w-5 h-5" />
            <span>{item.label}</span>
          </NavLink>
        ))}
        
        {/* Lien d'aide */}
        <a
          href="https://github.com"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-dark-400 hover:text-white hover:bg-dark-800 transition-colors"
        >
          <HelpCircle className="w-5 h-5" />
          <span>Aide</span>
        </a>
      </nav>

      {/* Carte de progression */}
      <div className="mt-4 p-4 bg-gradient-to-br from-primary-900/50 to-dark-800 rounded-xl border border-primary-800/30">
        <div className="flex items-center gap-2 mb-2">
          <BookOpen className="w-5 h-5 text-primary-400" />
          <span className="font-medium text-white">Continuer</span>
        </div>
        <p className="text-sm text-dark-400 mb-3">
          Reprenez là où vous vous êtes arrêté
        </p>
        <NavLink
          to="/roadmap"
          className="btn-primary btn-sm w-full"
        >
          Reprendre
        </NavLink>
      </div>
    </aside>
  );
}
