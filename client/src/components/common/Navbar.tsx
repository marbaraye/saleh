import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Code2, 
  Menu, 
  X, 
  User, 
  Settings, 
  LogOut,
  Bell,
  Flame,
  Trophy
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-dark-900/95 backdrop-blur-sm border-b border-dark-700">
      <div className="px-4 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to={isAuthenticated ? '/dashboard' : '/'} className="flex items-center gap-2">
            <Code2 className="w-8 h-8 text-primary-500" />
            <span className="text-xl font-bold text-white hidden sm:block">C Mastery</span>
          </Link>

          {/* Navigation desktop */}
          <div className="hidden lg:flex items-center gap-6">
            {isAuthenticated && (
              <>
                <Link 
                  to="/roadmap" 
                  className="text-dark-300 hover:text-white transition-colors"
                >
                  Feuille de route
                </Link>
                <Link 
                  to="/projects" 
                  className="text-dark-300 hover:text-white transition-colors"
                >
                  Projets
                </Link>
                <Link 
                  to="/leaderboard" 
                  className="text-dark-300 hover:text-white transition-colors"
                >
                  Classement
                </Link>
              </>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                {/* Stats rapides */}
                <div className="hidden md:flex items-center gap-4">
                  <div className="flex items-center gap-1.5 text-sm">
                    <Flame className="w-4 h-4 text-orange-500" />
                    <span className="text-dark-300">{user?.streakDays || 0}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm">
                    <Trophy className="w-4 h-4 text-yellow-500" />
                    <span className="text-dark-300">{user?.totalPoints || 0}</span>
                  </div>
                </div>

                {/* Notifications */}
                <button className="p-2 text-dark-400 hover:text-white transition-colors relative">
                  <Bell className="w-5 h-5" />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-primary-500 rounded-full"></span>
                </button>

                {/* Menu utilisateur */}
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-dark-800 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center">
                      {user?.avatarUrl ? (
                        <img 
                          src={user.avatarUrl} 
                          alt={user.username} 
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-sm font-medium text-white">
                          {user?.username?.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <span className="hidden sm:block text-sm text-dark-200">
                      {user?.username}
                    </span>
                  </button>

                  {/* Dropdown menu */}
                  {userMenuOpen && (
                    <>
                      <div 
                        className="fixed inset-0 z-10" 
                        onClick={() => setUserMenuOpen(false)}
                      />
                      <div className="absolute right-0 mt-2 w-56 bg-dark-800 border border-dark-700 rounded-lg shadow-xl z-20">
                        <div className="p-3 border-b border-dark-700">
                          <p className="font-medium text-white">{user?.username}</p>
                          <p className="text-sm text-dark-400">{user?.email}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="badge-primary">Niveau {user?.currentLevel}</span>
                            <span className="text-sm text-dark-400">{user?.totalPoints} pts</span>
                          </div>
                        </div>
                        <div className="p-2">
                          <Link
                            to="/profile"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-3 px-3 py-2 text-dark-300 hover:text-white hover:bg-dark-700 rounded-lg transition-colors"
                          >
                            <User className="w-4 h-4" />
                            Mon profil
                          </Link>
                          <Link
                            to="/settings"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-3 px-3 py-2 text-dark-300 hover:text-white hover:bg-dark-700 rounded-lg transition-colors"
                          >
                            <Settings className="w-4 h-4" />
                            Paramètres
                          </Link>
                          <button
                            onClick={handleLogout}
                            className="flex items-center gap-3 px-3 py-2 text-red-400 hover:text-red-300 hover:bg-dark-700 rounded-lg transition-colors w-full"
                          >
                            <LogOut className="w-4 h-4" />
                            Déconnexion
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <Link to="/login" className="btn-ghost btn-sm">
                  Connexion
                </Link>
                <Link to="/register" className="btn-primary btn-sm">
                  S'inscrire
                </Link>
              </div>
            )}

            {/* Menu mobile */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-dark-400 hover:text-white"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Menu mobile */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-dark-900 border-t border-dark-700">
          <div className="px-4 py-4 space-y-2">
            {isAuthenticated && (
              <>
                <Link
                  to="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-4 py-2 text-dark-300 hover:text-white hover:bg-dark-800 rounded-lg"
                >
                  Dashboard
                </Link>
                <Link
                  to="/roadmap"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-4 py-2 text-dark-300 hover:text-white hover:bg-dark-800 rounded-lg"
                >
                  Feuille de route
                </Link>
                <Link
                  to="/projects"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-4 py-2 text-dark-300 hover:text-white hover:bg-dark-800 rounded-lg"
                >
                  Projets
                </Link>
                <Link
                  to="/leaderboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-4 py-2 text-dark-300 hover:text-white hover:bg-dark-800 rounded-lg"
                >
                  Classement
                </Link>
                <Link
                  to="/badges"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-4 py-2 text-dark-300 hover:text-white hover:bg-dark-800 rounded-lg"
                >
                  Badges
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
