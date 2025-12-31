import { useEffect, useState } from 'react';
import { Award, Lock, CheckCircle } from 'lucide-react';
import { badgesApi } from '../services/api';
import type { Badge } from '../types';
import toast from 'react-hot-toast';

export default function BadgesPage() {
  const [badges, setBadges] = useState<Badge[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'earned' | 'locked'>('all');

  useEffect(() => {
    const fetchBadges = async () => {
      try {
        const data = await badgesApi.getAll();
        setBadges(data);
      } catch (error) {
        console.error('Erreur lors du chargement:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchBadges();
  }, []);

  const handleCheckBadges = async () => {
    try {
      const result = await badgesApi.checkNewBadges();
      if (result.newBadges.length > 0) {
        toast.success(result.message);
        // Recharger les badges
        const data = await badgesApi.getAll();
        setBadges(data);
      } else {
        toast.success(result.message);
      }
    } catch (error) {
      toast.error('Erreur lors de la vérification');
    }
  };

  const filteredBadges = badges.filter(badge => {
    if (filter === 'earned') return badge.earned;
    if (filter === 'locked') return !badge.earned;
    return true;
  });

  const earnedCount = badges.filter(b => b.earned).length;
  const totalPoints = badges.filter(b => b.earned).reduce((sum, b) => sum + b.pointsBonus, 0);

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return 'from-yellow-500 to-amber-600';
      case 'epic': return 'from-purple-500 to-pink-600';
      case 'rare': return 'from-blue-500 to-cyan-600';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  const getRarityBorder = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return 'border-yellow-500/50';
      case 'epic': return 'border-purple-500/50';
      case 'rare': return 'border-blue-500/50';
      default: return 'border-dark-600';
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(12)].map((_, i) => (
          <div key={i} className="h-40 bg-dark-800 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Award className="w-7 h-7 text-purple-400" />
            Badges
          </h1>
          <p className="text-dark-400">
            Collectionnez des badges en progressant dans votre apprentissage
          </p>
        </div>
        
        <button
          onClick={handleCheckBadges}
          className="btn-primary"
        >
          Vérifier les nouveaux badges
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card text-center">
          <p className="text-3xl font-bold text-white">{earnedCount}</p>
          <p className="text-sm text-dark-400">Badges obtenus</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-dark-500">{badges.length - earnedCount}</p>
          <p className="text-sm text-dark-400">À débloquer</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-primary-400">+{totalPoints}</p>
          <p className="text-sm text-dark-400">Points bonus gagnés</p>
        </div>
      </div>

      {/* Filtres */}
      <div className="flex gap-2">
        <FilterButton active={filter === 'all'} onClick={() => setFilter('all')}>
          Tous ({badges.length})
        </FilterButton>
        <FilterButton active={filter === 'earned'} onClick={() => setFilter('earned')}>
          Obtenus ({earnedCount})
        </FilterButton>
        <FilterButton active={filter === 'locked'} onClick={() => setFilter('locked')}>
          À débloquer ({badges.length - earnedCount})
        </FilterButton>
      </div>

      {/* Grille de badges */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredBadges.map((badge) => (
          <div
            key={badge.id}
            className={`card relative overflow-hidden transition-all duration-300 ${
              badge.earned 
                ? `border-2 ${getRarityBorder(badge.rarity)} hover:scale-105` 
                : 'opacity-60 grayscale hover:opacity-80 hover:grayscale-0'
            }`}
          >
            {/* Fond gradient pour les badges obtenus */}
            {badge.earned && (
              <div 
                className={`absolute inset-0 bg-gradient-to-br ${getRarityColor(badge.rarity)} opacity-10`}
              />
            )}
            
            <div className="relative text-center">
              {/* Icône */}
              <div className="relative inline-block">
                <span className="text-5xl">{badge.icon}</span>
                {badge.earned ? (
                  <CheckCircle className="absolute -bottom-1 -right-1 w-5 h-5 text-success-400 bg-dark-800 rounded-full" />
                ) : (
                  <Lock className="absolute -bottom-1 -right-1 w-5 h-5 text-dark-500 bg-dark-800 rounded-full p-0.5" />
                )}
              </div>

              {/* Nom */}
              <h3 className="font-semibold text-white mt-3 mb-1">{badge.name}</h3>
              
              {/* Description */}
              <p className="text-xs text-dark-400 line-clamp-2 mb-2">
                {badge.description}
              </p>

              {/* Rareté et points */}
              <div className="flex items-center justify-center gap-2">
                <span className={`text-xs capitalize ${
                  badge.rarity === 'legendary' ? 'text-yellow-400' :
                  badge.rarity === 'epic' ? 'text-purple-400' :
                  badge.rarity === 'rare' ? 'text-blue-400' :
                  'text-dark-500'
                }`}>
                  {badge.rarity}
                </span>
                {badge.pointsBonus > 0 && (
                  <span className="text-xs text-primary-400">
                    +{badge.pointsBonus} pts
                  </span>
                )}
              </div>

              {/* Date d'obtention */}
              {badge.earned && badge.earnedAt && (
                <p className="text-xs text-dark-500 mt-2">
                  Obtenu le {new Date(badge.earnedAt).toLocaleDateString('fr-FR')}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredBadges.length === 0 && (
        <div className="text-center py-12">
          <Award className="w-12 h-12 text-dark-600 mx-auto mb-4" />
          <p className="text-dark-400">Aucun badge dans cette catégorie</p>
        </div>
      )}
    </div>
  );
}

function FilterButton({ 
  active, 
  onClick, 
  children 
}: { 
  active: boolean; 
  onClick: () => void; 
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
        active 
          ? 'bg-primary-600 text-white' 
          : 'bg-dark-800 text-dark-400 hover:text-white hover:bg-dark-700'
      }`}
    >
      {children}
    </button>
  );
}
