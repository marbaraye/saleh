import { useState } from 'react';
import { User, Lock, Bell, Palette, Trash2 } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { usersApi, authApi } from '../services/api';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const { user, updateUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState('profile');
  
  // États du formulaire profil
  const [username, setUsername] = useState(user?.username || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  
  // États du formulaire mot de passe
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingProfile(true);
    
    try {
      await usersApi.updateProfile({ username, bio });
      updateUser({ username, bio });
      toast.success('Profil mis à jour');
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }
    
    if (newPassword.length < 8) {
      toast.error('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }
    
    setIsUpdatingPassword(true);
    
    try {
      await authApi.changePassword(currentPassword, newPassword);
      toast.success('Mot de passe mis à jour');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      toast.error('Erreur lors de la mise à jour du mot de passe');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profil', icon: User },
    { id: 'security', label: 'Sécurité', icon: Lock },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'appearance', label: 'Apparence', icon: Palette },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">Paramètres</h1>
        <p className="text-dark-400">Gérez votre compte et vos préférences</p>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Navigation */}
        <nav className="md:w-48 flex-shrink-0">
          <ul className="space-y-1">
            {tabs.map((tab) => (
              <li key={tab.id}>
                <button
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-left transition-colors ${
                    activeTab === tab.id
                      ? 'bg-primary-600/20 text-primary-400'
                      : 'text-dark-400 hover:text-white hover:bg-dark-800'
                  }`}
                >
                  <tab.icon className="w-5 h-5" />
                  {tab.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Contenu */}
        <div className="flex-1">
          {activeTab === 'profile' && (
            <div className="card">
              <h2 className="text-lg font-semibold text-white mb-6">
                Informations du profil
              </h2>
              
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-2">
                    Nom d'utilisateur
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="input"
                    minLength={3}
                    maxLength={50}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={user?.email || ''}
                    className="input bg-dark-900"
                    disabled
                  />
                  <p className="text-xs text-dark-500 mt-1">
                    L'email ne peut pas être modifié
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-2">
                    Bio
                  </label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="input min-h-[100px]"
                    maxLength={500}
                    placeholder="Parlez-nous de vous..."
                  />
                </div>
                
                <button
                  type="submit"
                  disabled={isUpdatingProfile}
                  className="btn-primary"
                >
                  {isUpdatingProfile ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </form>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6">
              <div className="card">
                <h2 className="text-lg font-semibold text-white mb-6">
                  Changer le mot de passe
                </h2>
                
                <form onSubmit={handleUpdatePassword} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-dark-300 mb-2">
                      Mot de passe actuel
                    </label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="input"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-dark-300 mb-2">
                      Nouveau mot de passe
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="input"
                      required
                      minLength={8}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-dark-300 mb-2">
                      Confirmer le nouveau mot de passe
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="input"
                      required
                    />
                  </div>
                  
                  <button
                    type="submit"
                    disabled={isUpdatingPassword}
                    className="btn-primary"
                  >
                    {isUpdatingPassword ? 'Mise à jour...' : 'Mettre à jour'}
                  </button>
                </form>
              </div>

              <div className="card border-red-900/50">
                <h2 className="text-lg font-semibold text-red-400 mb-4 flex items-center gap-2">
                  <Trash2 className="w-5 h-5" />
                  Zone dangereuse
                </h2>
                <p className="text-dark-400 mb-4">
                  La suppression de votre compte est irréversible. Toutes vos données seront perdues.
                </p>
                <button className="btn-danger">
                  Supprimer mon compte
                </button>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="card">
              <h2 className="text-lg font-semibold text-white mb-6">
                Préférences de notification
              </h2>
              
              <div className="space-y-4">
                <NotificationToggle
                  label="Rappels d'apprentissage"
                  description="Recevez des rappels pour maintenir votre série"
                  defaultChecked={true}
                />
                <NotificationToggle
                  label="Nouveaux badges"
                  description="Soyez notifié lorsque vous débloquez un badge"
                  defaultChecked={true}
                />
                <NotificationToggle
                  label="Mises à jour du contenu"
                  description="Nouveaux modules et topics disponibles"
                  defaultChecked={true}
                />
                <NotificationToggle
                  label="Emails marketing"
                  description="Conseils et astuces pour progresser"
                  defaultChecked={false}
                />
              </div>
            </div>
          )}

          {activeTab === 'appearance' && (
            <div className="card">
              <h2 className="text-lg font-semibold text-white mb-6">
                Apparence
              </h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-3">
                    Thème
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    <ThemeOption label="Sombre" active={true} />
                    <ThemeOption label="Clair" active={false} disabled />
                    <ThemeOption label="Système" active={false} disabled />
                  </div>
                  <p className="text-xs text-dark-500 mt-2">
                    Seul le thème sombre est disponible pour le moment
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-3">
                    Taille de police de l'éditeur
                  </label>
                  <select className="input w-auto">
                    <option value="12">12px</option>
                    <option value="14" selected>14px</option>
                    <option value="16">16px</option>
                    <option value="18">18px</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function NotificationToggle({ 
  label, 
  description, 
  defaultChecked 
}: { 
  label: string; 
  description: string; 
  defaultChecked: boolean;
}) {
  const [checked, setChecked] = useState(defaultChecked);
  
  return (
    <div className="flex items-center justify-between py-3 border-b border-dark-700 last:border-0">
      <div>
        <p className="font-medium text-white">{label}</p>
        <p className="text-sm text-dark-400">{description}</p>
      </div>
      <button
        onClick={() => setChecked(!checked)}
        className={`relative w-12 h-6 rounded-full transition-colors ${
          checked ? 'bg-primary-600' : 'bg-dark-600'
        }`}
      >
        <span 
          className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
            checked ? 'left-7' : 'left-1'
          }`}
        />
      </button>
    </div>
  );
}

function ThemeOption({ 
  label, 
  active, 
  disabled 
}: { 
  label: string; 
  active: boolean; 
  disabled?: boolean;
}) {
  return (
    <button
      disabled={disabled}
      className={`p-4 rounded-lg border-2 text-center transition-colors ${
        active 
          ? 'border-primary-500 bg-primary-900/20' 
          : 'border-dark-700 hover:border-dark-600'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <span className={active ? 'text-primary-400' : 'text-dark-400'}>
        {label}
      </span>
    </button>
  );
}
