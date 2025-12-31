import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, User, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { register, error, clearError } = useAuthStore();
  const navigate = useNavigate();

  // Validation du mot de passe
  const passwordChecks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
  };
  
  const isPasswordValid = Object.values(passwordChecks).every(Boolean);
  const passwordsMatch = password === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    
    if (!isPasswordValid) {
      toast.error('Le mot de passe ne respecte pas les critères');
      return;
    }
    
    if (!passwordsMatch) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await register({ username, email, password });
      toast.success('Inscription réussie ! Bienvenue sur C Mastery');
      navigate('/dashboard');
    } catch {
      // L'erreur est gérée par le store
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-bold text-white mb-2">
        Créer un compte
      </h1>
      <p className="text-dark-400 mb-8">
        Commencez votre parcours vers la maîtrise du C avancé
      </p>

      {error && (
        <div className="flex items-center gap-3 p-4 mb-6 bg-red-900/20 border border-red-800 rounded-lg text-red-400">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="username" className="block text-sm font-medium text-dark-300 mb-2">
            Nom d'utilisateur
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-500" />
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="input pl-11"
              placeholder="votre_pseudo"
              required
              minLength={3}
              maxLength={50}
              pattern="^[a-zA-Z0-9_-]+$"
              autoComplete="username"
            />
          </div>
          <p className="mt-1 text-xs text-dark-500">
            Lettres, chiffres, tirets et underscores uniquement
          </p>
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-dark-300 mb-2">
            Adresse email
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-500" />
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input pl-11"
              placeholder="vous@exemple.com"
              required
              autoComplete="email"
            />
          </div>
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-dark-300 mb-2">
            Mot de passe
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-500" />
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input pl-11 pr-11"
              placeholder="••••••••"
              required
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-500 hover:text-dark-300"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          
          {/* Indicateurs de force du mot de passe */}
          {password && (
            <div className="mt-3 space-y-2">
              <PasswordCheck passed={passwordChecks.length} text="Au moins 8 caractères" />
              <PasswordCheck passed={passwordChecks.uppercase} text="Une lettre majuscule" />
              <PasswordCheck passed={passwordChecks.lowercase} text="Une lettre minuscule" />
              <PasswordCheck passed={passwordChecks.number} text="Un chiffre" />
            </div>
          )}
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-dark-300 mb-2">
            Confirmer le mot de passe
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-500" />
            <input
              id="confirmPassword"
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={`input pl-11 ${confirmPassword && !passwordsMatch ? 'input-error' : ''}`}
              placeholder="••••••••"
              required
              autoComplete="new-password"
            />
          </div>
          {confirmPassword && !passwordsMatch && (
            <p className="mt-1 text-xs text-red-400">
              Les mots de passe ne correspondent pas
            </p>
          )}
        </div>

        <div className="flex items-start gap-2">
          <input
            id="terms"
            type="checkbox"
            required
            className="mt-1 w-4 h-4 rounded border-dark-600 bg-dark-800 text-primary-600 focus:ring-primary-500"
          />
          <label htmlFor="terms" className="text-sm text-dark-400">
            J'accepte les{' '}
            <a href="#" className="text-primary-400 hover:text-primary-300">
              conditions d'utilisation
            </a>{' '}
            et la{' '}
            <a href="#" className="text-primary-400 hover:text-primary-300">
              politique de confidentialité
            </a>
          </label>
        </div>

        <button
          type="submit"
          disabled={isSubmitting || !isPasswordValid || !passwordsMatch}
          className="btn-primary w-full"
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Création du compte...
            </span>
          ) : (
            'Créer mon compte'
          )}
        </button>
      </form>

      <p className="mt-8 text-center text-dark-400">
        Déjà un compte ?{' '}
        <Link to="/login" className="text-primary-400 hover:text-primary-300 font-medium">
          Se connecter
        </Link>
      </p>
    </div>
  );
}

function PasswordCheck({ passed, text }: { passed: boolean; text: string }) {
  return (
    <div className={`flex items-center gap-2 text-xs ${passed ? 'text-success-400' : 'text-dark-500'}`}>
      {passed ? (
        <CheckCircle className="w-4 h-4" />
      ) : (
        <div className="w-4 h-4 rounded-full border border-dark-600" />
      )}
      <span>{text}</span>
    </div>
  );
}
