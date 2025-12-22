
import React, { useState } from 'react';
import { Club, TradeType, NotificationPreferences } from '../types';
import { MapPin, Plus, Trash2, Building, Layers, Wrench, X, Bell, BellRing, Smartphone, AlertTriangle } from 'lucide-react';

interface SettingsManagerProps {
  clubs: Club[];
  failureTypes: Record<TradeType, string[]>;
  onAddClub: (club: Club) => void;
  onDeleteClub: (clubId: string) => void;
  onUpdateClubSpaces: (clubId: string, spaces: string[]) => void;
  onUpdateFailureTypes: (trade: TradeType, failures: string[]) => void;
  userPreferences?: NotificationPreferences;
  onUpdatePreferences?: (prefs: NotificationPreferences) => void;
}

const SettingsManager: React.FC<SettingsManagerProps> = ({ 
  clubs = [], 
  failureTypes = {}, 
  onAddClub, 
  onDeleteClub, 
  onUpdateClubSpaces, 
  onUpdateFailureTypes,
  userPreferences,
  onUpdatePreferences
}) => {
  const [activeTab, setActiveTab] = useState<'clubs' | 'trades' | 'notifications'>('clubs');

  // Club States
  const [showClubModal, setShowClubModal] = useState(false);
  const [newClubName, setNewClubName] = useState('');
  const [newClubAddress, setNewClubAddress] = useState('');
  
  // Space Management State
  const [newSpaceName, setNewSpaceName] = useState('');
  const [activeClubIdForSpaces, setActiveClubIdForSpaces] = useState<string | null>(null);

  // Trade States
  const [selectedTrade, setSelectedTrade] = useState<TradeType>(TradeType.ELECTRICITY);
  const [newFailureType, setNewFailureType] = useState('');

  // Liste des espaces standards demandés
  const DEFAULT_GYM_SPACES = [
    'ACCUEIL', 
    'CROSS', 
    'FORCE', 
    'GUIDEE', 
    'VESTIAIRE HOMME', 
    'VESTIAIRE FEMME', 
    'SISMO', 
    'YANGA', 
    'HYDROMASSAGE'
  ];

  // Handlers for Clubs
  const handleCreateClub = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClubName || !newClubAddress) return;
    
    const newClub: Club = {
      id: `c${Date.now()}`,
      name: newClubName,
      address: newClubAddress,
      spaces: [...DEFAULT_GYM_SPACES] // Initialisation avec les 9 espaces standards
    };
    
    onAddClub(newClub);
    setNewClubName('');
    setNewClubAddress('');
    setShowClubModal(false);
  };

  const handleAddSpace = (clubId: string) => {
    if (!newSpaceName) return;
    const club = clubs.find(c => c.id === clubId);
    if (club) {
      onUpdateClubSpaces(clubId, [...(club.spaces || []), newSpaceName.toUpperCase()]);
      setNewSpaceName('');
      setActiveClubIdForSpaces(null);
    }
  };

  const handleDeleteSpace = (clubId: string, spaceIndex: number) => {
    const club = clubs.find(c => c.id === clubId);
    if (club) {
      const newSpaces = [...(club.spaces || [])];
      newSpaces.splice(spaceIndex, 1);
      onUpdateClubSpaces(clubId, newSpaces);
    }
  };

  const handleAddFailureType = () => {
    if (!newFailureType) return;
    const currentFailures = failureTypes[selectedTrade] || [];
    if (!currentFailures.includes(newFailureType)) {
      onUpdateFailureTypes(selectedTrade, [...currentFailures, newFailureType]);
    }
    setNewFailureType('');
  };

  const handleDeleteFailureType = (failure: string) => {
    const currentFailures = failureTypes[selectedTrade] || [];
    onUpdateFailureTypes(selectedTrade, currentFailures.filter(f => f !== failure));
  };

  const handleTogglePreference = (key: keyof NotificationPreferences) => {
    if (userPreferences && onUpdatePreferences) {
      onUpdatePreferences({
        ...userPreferences,
        [key]: !userPreferences[key]
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex space-x-1 border-b border-gray-700 pb-2 overflow-x-auto">
        <button 
          onClick={() => setActiveTab('clubs')}
          className={`flex items-center gap-2 px-6 py-3 rounded-t-xl transition-all whitespace-nowrap font-black uppercase tracking-tighter text-xs ${activeTab === 'clubs' ? 'bg-brand-yellow text-brand-dark shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
        >
          <Building size={16} /> Clubs & Espaces
        </button>
        <button 
          onClick={() => setActiveTab('trades')}
          className={`flex items-center gap-2 px-6 py-3 rounded-t-xl transition-all whitespace-nowrap font-black uppercase tracking-tighter text-xs ${activeTab === 'trades' ? 'bg-brand-yellow text-brand-dark shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
        >
          <Wrench size={16} /> Types de Pannes
        </button>
        <button 
          onClick={() => setActiveTab('notifications')}
          className={`flex items-center gap-2 px-6 py-3 rounded-t-xl transition-all whitespace-nowrap font-black uppercase tracking-tighter text-xs ${activeTab === 'notifications' ? 'bg-brand-yellow text-brand-dark shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
        >
          <Bell size={16} /> Notifications
        </button>
      </div>

      {activeTab === 'clubs' && (
        <div className="space-y-6 animate-fade-in">
          <div className="flex justify-between items-center bg-brand-light p-4 rounded-xl border border-gray-700 shadow-xl">
            <h3 className="text-xl font-black text-white uppercase tracking-tight">Vos Clubs</h3>
            <button 
              onClick={() => setShowClubModal(true)}
              className="bg-brand-yellow text-brand-dark font-black uppercase tracking-tight px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-yellow-400 transition shadow-xl"
            >
              <Plus size={18} /> Nouveau Club
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {clubs.map(club => (
              <div key={club.id} className="bg-brand-light rounded-2xl border border-gray-700 overflow-hidden shadow-2xl transition-all hover:border-brand-yellow/30">
                <div className="p-5 bg-brand-darker border-b border-gray-700 flex justify-between items-center">
                   <div>
                     <h4 className="font-black text-lg text-white uppercase tracking-tight">{club.name}</h4>
                     <p className="text-xs text-gray-400 flex items-center gap-1 font-black uppercase tracking-widest"><MapPin size={10} className="text-brand-yellow"/> {club.address}</p>
                   </div>
                   <button 
                    onClick={() => { if(window.confirm('Supprimer ce club ?')) onDeleteClub(club.id); }}
                    className="text-red-400 hover:bg-red-500/20 p-2.5 rounded-full transition"
                   >
                     <Trash2 size={18} />
                   </button>
                </div>
                
                <div className="p-6">
                  <h5 className="text-[10px] font-black text-gray-500 mb-4 flex items-center gap-2 uppercase tracking-widest">
                    <Layers size={14} className="text-brand-yellow" /> Espaces configurés
                  </h5>
                  <div className="flex flex-wrap gap-2 mb-6 min-h-[40px]">
                    {(club.spaces || []).map((space, idx) => (
                      <span key={idx} className="bg-brand-dark px-3 py-1.5 rounded-lg text-xs font-black text-gray-300 flex items-center gap-2 group border border-gray-700 uppercase tracking-tighter">
                        {space}
                        <button onClick={() => handleDeleteSpace(club.id, idx)} className="text-gray-500 hover:text-red-400 transition-colors">
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                  
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="Nom du nouvel espace..."
                      className="flex-1 bg-brand-dark border border-gray-600 rounded-xl px-4 py-3 text-sm text-white font-black uppercase focus:border-brand-yellow outline-none transition-all placeholder:text-gray-500"
                      value={activeClubIdForSpaces === club.id ? newSpaceName : ''}
                      onChange={(e) => {
                          setActiveClubIdForSpaces(club.id);
                          setNewSpaceName(e.target.value);
                      }}
                      onKeyDown={(e) => {
                          if (e.key === 'Enter') handleAddSpace(club.id);
                      }}
                    />
                    <button 
                      onClick={() => handleAddSpace(club.id)}
                      className="bg-brand-yellow text-brand-dark p-3 rounded-xl hover:bg-yellow-400 transition shadow-lg"
                    >
                      <Plus size={20} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'trades' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">
          <div className="col-span-1 bg-brand-light rounded-2xl border border-gray-700 overflow-hidden shadow-2xl">
            <div className="p-4 bg-brand-darker border-b border-gray-700 font-black text-white uppercase tracking-tight text-sm">
              Métiers du Bâtiment
            </div>
            <div className="overflow-y-auto max-h-[600px] custom-scrollbar">
              {Object.values(TradeType).map(trade => (
                <button
                  key={trade}
                  onClick={() => setSelectedTrade(trade)}
                  className={`w-full text-left p-4 border-b border-gray-700/50 hover:bg-white/5 transition flex justify-between items-center text-xs font-black uppercase tracking-tighter ${selectedTrade === trade ? 'bg-brand-yellow text-brand-dark' : 'text-gray-400'}`}
                >
                  {trade}
                  <span className="text-[10px] bg-black/40 px-2 py-0.5 rounded-full font-black">
                    {failureTypes[trade]?.length || 0}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="col-span-1 md:col-span-2 space-y-4">
             <div className="bg-brand-light p-8 rounded-2xl border border-gray-700 shadow-2xl">
               <h3 className="text-2xl font-black text-white mb-2 flex items-center gap-3 uppercase tracking-tight">
                 <Wrench className="text-brand-yellow" />
                 {selectedTrade}
               </h3>
               <p className="text-gray-400 text-sm mb-8 font-black uppercase tracking-widest">
                 Personnalisez les types de pannes pour ce métier.
               </p>

               <div className="flex gap-3 mb-8">
                 <input 
                   type="text" 
                   placeholder="Nouveau type de panne..."
                   className="flex-1 bg-brand-dark border border-gray-600 rounded-xl px-4 py-4 text-white font-black uppercase focus:border-brand-yellow outline-none transition-all placeholder:text-gray-500"
                   value={newFailureType}
                   onChange={(e) => setNewFailureType(e.target.value)}
                   onKeyDown={(e) => { if(e.key === 'Enter') handleAddFailureType(); }}
                 />
                 <button onClick={handleAddFailureType} className="bg-brand-yellow text-brand-dark font-black uppercase tracking-tight px-8 py-2 rounded-xl hover:bg-yellow-400 transition shadow-xl">
                   Ajouter
                 </button>
               </div>

               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 {(failureTypes[selectedTrade] || []).map((failure, idx) => (
                   <div key={idx} className="bg-brand-dark border border-gray-700 p-4 rounded-xl flex justify-between items-center group hover:border-brand-yellow/30 transition-all">
                     <span className="text-gray-200 font-black text-sm uppercase tracking-tighter">{failure}</span>
                     <button onClick={() => handleDeleteFailureType(failure)} className="text-gray-500 hover:text-red-400 transition-colors">
                       <Trash2 size={16} />
                     </button>
                   </div>
                 ))}
               </div>
             </div>
          </div>
        </div>
      )}

      {showClubModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-fade-in-up flex flex-col">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50">
              <h2 className="text-xl font-black text-black uppercase tracking-tight">Nouveau Club</h2>
              <button onClick={() => setShowClubModal(false)} className="text-gray-400 hover:text-black transition-colors"><X size={24} /></button>
            </div>
            <form onSubmit={handleCreateClub} className="p-8 space-y-6">
              <div className="space-y-1">
                <label className="block text-[11px] font-black text-black uppercase tracking-widest">Nom du club</label>
                <input 
                  type="text" 
                  required
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-black font-black uppercase outline-none focus:ring-2 focus:ring-brand-yellow transition-all placeholder:text-gray-400"
                  value={newClubName}
                  onChange={e => setNewClubName(e.target.value)}
                  placeholder="Ex: Fitness Park Neyrpic"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-[11px] font-black text-black uppercase tracking-widest">Adresse complète</label>
                <input 
                  type="text" 
                  required
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-black font-black uppercase outline-none focus:ring-2 focus:ring-brand-yellow transition-all placeholder:text-gray-400"
                  value={newClubAddress}
                  onChange={e => setNewClubAddress(e.target.value)}
                  placeholder="Rue, Code Postal, Ville"
                />
              </div>
              <div className="pt-6 flex gap-4 border-t border-gray-100">
                <button type="button" onClick={() => setShowClubModal(false)} className="flex-1 bg-gray-100 text-black font-black uppercase py-4 rounded-xl">Annuler</button>
                <button type="submit" className="flex-1 bg-brand-yellow text-brand-dark font-black uppercase py-4 rounded-xl hover:bg-yellow-400 shadow-xl shadow-brand-yellow/30">Créer le club</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsManager;
