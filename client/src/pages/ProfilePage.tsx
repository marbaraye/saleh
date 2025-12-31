import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { 
  Trophy, 
  Flame, 
  Award,
  Calendar,
  Clock,
  Target,
  TrendingUp
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { usersApi, badgesApi } from '../services/api';
import type { User, Badge } from '../types';

export default function ProfilePage() {
  const { username } = useParams<{ username?: string }>();
  const { user: currentUser } = useAuthStore();
  const [profile, setProfile] = useState<User | null>(null);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const isOwnProfile = !username || username === currentUser?.username;

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        if (isOwnProfile) {
          const [profileData, badgesData] = await Promise.all([
            usersApi.getProfile(),
            badgesApi.getUserBadges()
          ]);
          setProfile(profileData);
          setBadges(badgesData);
        } else {
          const profileData = await usersApi.getPublicProfile(username!);
          setProfile(profileData);
        }
      } catch (error) {
        console.error('Erreur lors du chargement:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProfile();
  }, [username, isOwnProfile]);

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-48 bg-dark-800 rounded-xl" />
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-dark-800 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-12">
        <p className="text-dark-400">Profil non trouvé</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* En-tête du profil */}
      <div className="card">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="w-24 h-24 rounded-full bg-primary-600 flex items-center justify-center text-4xl font-bold text-white">
            {profile.avatarUrl ? (
              <img 
                src={profile.avatarUrl} 
                alt={profile.username} 
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              profile.username.charAt(0).toUpperCase()
            )}
          </div>
          
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-2xl font-bold text-white">{profile.username}</h1>
            {profile.bio && (
              <p className="text-dark-400 mt-1">{profile.bio}</p>
            )}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mt-4">
              <span className="badge-primary text-sm">
                Niveau {profile.currentLevel}
              </span>
              {profile.rank && (
                <span className="text-dark-400 text-sm flex items-center gap-1">
                  <TrendingUp className="w-4 h-4" />
                  Rang #{profile.rank}
                </span>
              )}
              <span className="text-dark-400 text-sm flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                Membre depuis {new Date(profile.createdAt).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={<Trophy className="w-5 h-5" />}
          label="Points totaux"
          value={profile.totalPoints.toLocaleString()}
          color="text-yellow-400"
          bgColor="bg-yellow-900/30"
        />
        <StatCard
          icon={<Flame className="w-5 h-5" />}
          label="Série actuelle"
          value={`${profile.streakDays} jours`}
          color="text-orange-400"
          bgColor="bg-orange-900/30"
        />
        <StatCard
          icon={<Target className="w-5 h-5" />}
          label="Topics complétés"
          value={String(profile.topicsCompleted || 0)}
          color="text-primary-400"
          bgColor="bg-primary-900/30"
        />
        <StatCard
          icon={<Award className="w-5 h-5" />}
          label="Badges obtenus"
          value={String(profile.badgesCount || badges.length)}
          color="text-purple-400"
          bgColor="bg-purple-900/30"
        />
      </div>

      {/* Badges */}
      {badges.length > 0 && (
        <div className="card">
          <h2 className="text-lg font-semibold text-white mb-4">
            Badges ({badges.length})
          </h2>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
            {badges.map((badge) => (
              <div 
                key={badge.id}
                className="text-center p-3 bg-dark-800/50 rounded-lg hover:bg-dark-800 transition-colors"
                title={badge.description}
              >
                <div className="text-3xl mb-2">{badge.icon}</div>
                <p className="text-xs text-dark-300 truncate">{badge.name}</p>
                <span className={`text-xs ${
                  badge.rarity === 'legendary' ? 'text-yellow-400' :
                  badge.rarity === 'epic' ? 'text-purple-400' :
                  badge.rarity === 'rare' ? 'text-blue-400' :
                  'text-dark-500'
                }`}>
                  {badge.rarity}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Temps d'apprentissage */}
      {profile.totalTimeSpentMinutes !== undefined && (
        <div className="card">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary-400" />
            Temps d'apprentissage
          </h2>
          <div className="text-center">
            <p className="text-4xl font-bold text-white">
              {Math.floor(profile.totalTimeSpentMinutes / 60)}h {profile.totalTimeSpentMinutes % 60}min
            </p>
            <p className="text-dark-400 mt-1">Temps total passé sur la plateforme</p>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ 
  icon, 
  label, 
  value, 
  color, 
  bgColor 
}: { 
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
  bgColor: string;
}) {
  return (
    <div className="card text-center">
      <div className={`w-12 h-12 rounded-lg ${bgColor} flex items-center justify-center mx-auto mb-3 ${color}`}>
        {icon}
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-sm text-dark-400">{label}</p>
    </div>
  );
}
