import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Trophy, Medal, Flame, Crown } from 'lucide-react';
import { leaderboardApi } from '../services/api';
import { useAuthStore } from '../stores/authStore';
import type { LeaderboardEntry } from '../types';

type TabType = 'global' | 'weekly' | 'streaks';

export default function LeaderboardPage() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<TabType>('global');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setIsLoading(true);
      try {
        let data;
        switch (activeTab) {
          case 'weekly':
            data = await leaderboardApi.getWeekly();
            setLeaderboard(data);
            setUserRank(null);
            break;
          case 'streaks':
            data = await leaderboardApi.getStreaks();
            setLeaderboard(data);
            setUserRank(null);
            break;
          default:
            data = await leaderboardApi.getGlobal();
            setLeaderboard(data.leaderboard);
            setUserRank(data.userRank);
        }
      } catch (error) {
        console.error('Erreur lors du chargement:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchLeaderboard();
  }, [activeTab]);

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="w-6 h-6 text-yellow-400" />;
    if (rank === 2) return <Medal className="w-6 h-6 text-gray-400" />;
    if (rank === 3) return <Medal className="w-6 h-6 text-amber-600" />;
    return null;
  };

  const getRankStyle = (rank: number) => {
    if (rank === 1) return 'bg-gradient-to-r from-yellow-900/30 to-yellow-800/10 border-yellow-700/50';
    if (rank === 2) return 'bg-gradient-to-r from-gray-800/30 to-gray-700/10 border-gray-600/50';
    if (rank === 3) return 'bg-gradient-to-r from-amber-900/30 to-amber-800/10 border-amber-700/50';
    return '';
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Trophy className="w-7 h-7 text-yellow-400" />
            Classement
          </h1>
          <p className="text-dark-400">
            Comparez votre progression avec les autres apprenants
          </p>
        </div>
        
        {userRank && (
          <div className="card py-3 px-4">
            <p className="text-sm text-dark-400">Votre rang</p>
            <p className="text-2xl font-bold text-primary-400">#{userRank}</p>
          </div>
        )}
      </div>

      {/* Onglets */}
      <div className="flex gap-2 p-1 bg-dark-800 rounded-lg">
        <TabButton 
          active={activeTab === 'global'} 
          onClick={() => setActiveTab('global')}
        >
          <Trophy className="w-4 h-4" />
          Global
        </TabButton>
        <TabButton 
          active={activeTab === 'weekly'} 
          onClick={() => setActiveTab('weekly')}
        >
          <Medal className="w-4 h-4" />
          Cette semaine
        </TabButton>
        <TabButton 
          active={activeTab === 'streaks'} 
          onClick={() => setActiveTab('streaks')}
        >
          <Flame className="w-4 h-4" />
          Séries
        </TabButton>
      </div>

      {/* Liste */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="h-16 bg-dark-800 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {leaderboard.map((entry) => (
            <Link
              key={entry.id}
              to={`/profile/${entry.username}`}
              className={`card flex items-center gap-4 hover:bg-dark-700 transition-colors ${
                entry.isCurrentUser || entry.id === user?.id 
                  ? 'ring-2 ring-primary-500/50' 
                  : ''
              } ${getRankStyle(entry.rank)}`}
            >
              {/* Rang */}
              <div className="w-12 text-center">
                {getRankIcon(entry.rank) || (
                  <span className="text-lg font-bold text-dark-400">
                    #{entry.rank}
                  </span>
                )}
              </div>

              {/* Avatar */}
              <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center text-white font-medium">
                {entry.avatarUrl ? (
                  <img 
                    src={entry.avatarUrl} 
                    alt={entry.username} 
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  entry.username.charAt(0).toUpperCase()
                )}
              </div>

              {/* Infos */}
              <div className="flex-1">
                <p className="font-medium text-white">
                  {entry.username}
                  {(entry.isCurrentUser || entry.id === user?.id) && (
                    <span className="ml-2 text-xs text-primary-400">(vous)</span>
                  )}
                </p>
                <p className="text-sm text-dark-400">
                  Niveau {entry.currentLevel}
                </p>
              </div>

              {/* Score */}
              <div className="text-right">
                {activeTab === 'streaks' ? (
                  <div className="flex items-center gap-1 text-orange-400">
                    <Flame className="w-5 h-5" />
                    <span className="text-lg font-bold">{entry.streakDays}</span>
                    <span className="text-sm">jours</span>
                  </div>
                ) : (
                  <div>
                    <p className="text-lg font-bold text-primary-400">
                      {(activeTab === 'weekly' 
                        ? (entry as LeaderboardEntry & { weeklyPoints?: number }).weeklyPoints 
                        : entry.totalPoints
                      )?.toLocaleString()}
                    </p>
                    <p className="text-xs text-dark-500">points</p>
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      {!isLoading && leaderboard.length === 0 && (
        <div className="text-center py-12">
          <Trophy className="w-12 h-12 text-dark-600 mx-auto mb-4" />
          <p className="text-dark-400">Aucun classement disponible</p>
        </div>
      )}
    </div>
  );
}

function TabButton({ 
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
      className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
        active 
          ? 'bg-primary-600 text-white' 
          : 'text-dark-400 hover:text-white hover:bg-dark-700'
      }`}
    >
      {children}
    </button>
  );
}
