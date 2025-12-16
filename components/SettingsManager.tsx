

import React, { useState } from 'react';
import { Club, TradeType, NotificationPreferences } from '../types';
import { MapPin, Plus, Trash2, Building, Layers, Wrench, X, Bell, BellRing, Smartphone } from 'lucide-react';

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
  clubs, 
  failureTypes, 
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

  // Handlers for Clubs
  const handleCreateClub = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClubName || !newClubAddress) return;
    
    const newClub: Club = {
      id: `c${Date.now()}`,
      name: newClubName,
      address: newClubAddress,
      spaces: ['Accueil'] // Default space
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
      onUpdateClubSpaces(clubId, [...club.spaces, newSpaceName]);
      setNewSpaceName('');
    }
  };

  const handleDeleteSpace = (clubId: string, spaceIndex: number) => {
    const club = clubs.find(c => c.id === clubId);
    if (club) {
      const newSpaces = [...club.spaces];
      newSpaces.splice(spaceIndex, 1);
      onUpdateClubSpaces(clubId, newSpaces);
    }
  };

  // Handlers for Failures
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

  // Handler for Notifications
  const handleTogglePreference = (key: keyof NotificationPreferences) => {
    if (userPreferences && onUpdatePreferences) {
      onUpdatePreferences({
        ...userPreferences,
        [key]: !userPreferences[key]
      });
    }
  };

  const handleRequestBrowserPermission = async () => {
    if (!('Notification' in window)) {
      alert("Ce navigateur ne supporte pas les notifications.");
      return;
    }

    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
       if (userPreferences && onUpdatePreferences) {
         onUpdatePreferences({ ...userPreferences, browserPush: true });
       }
    } else {
       alert("Permission refusée. Vous devez autoriser les notifications dans les paramètres de votre navigateur.");
       if (userPreferences && onUpdatePreferences) {
         onUpdatePreferences({ ...userPreferences, browserPush: false });
       }
    }
  };

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex space-x-1 border-b border-gray-700 pb-2 overflow-x-auto">
        <button 
          onClick={() => setActiveTab('clubs')}
          className={`flex items-center gap-2 px-4 py-2 rounded-t-lg transition-colors whitespace-nowrap ${activeTab === 'clubs' ? 'bg-gym-yellow text-gym-dark font-bold' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
        >
          <Building size={18} />
          Clubs & Espaces
        </button>
        <button 
          onClick={() => setActiveTab('trades')}
          className={`flex items-center gap-2 px-4 py-2 rounded-t-lg transition-colors whitespace-nowrap ${activeTab === 'trades' ? 'bg-gym-yellow text-gym-dark font-bold' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
        >
          <Wrench size={18} />
          Types de Pannes
        </button>
        <button 
          onClick={() => setActiveTab('notifications')}
          className={`flex items-center gap-2 px-4 py-2 rounded-t-lg transition-colors whitespace-nowrap ${activeTab === 'notifications' ? 'bg-gym-yellow text-gym-dark font-bold' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
        >
          <Bell size={18} />
          Notifications
        </button>
      </div>

      {/* CLUBS TAB */}
      {activeTab === 'clubs' && (
        <div className="space-y-6 animate-fade-in">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold text-white">Vos Clubs</h3>
            <button 
              onClick={() => setShowClubModal(true)}
              className="bg-gym-light border border-gym-yellow text-gym-yellow hover:bg-gym-yellow hover:text-gym-dark px-4 py-2 rounded flex items-center gap-2 transition"
            >
              <Plus size={18} /> Nouveau Club
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {clubs.map(club => (
              <div key={club.id} className="bg-gym-light rounded-xl border border-gray-700 overflow-hidden shadow-lg">
                <div className="p-4 bg-gym-darker border-b border-gray-600 flex justify-between items-center">
                   <div>
                     <h4 className="font-bold text-lg text-white">{club.name}</h4>
                     <p className="text-sm text-gray-400 flex items-center gap-1"><MapPin size={12}/> {club.address}</p>
                   </div>
                   <button 
                    onClick={() => {
                        if(window.confirm('Supprimer ce club ?')) onDeleteClub(club.id);
                    }}
                    className="text-red-400 hover:bg-red-500/20 p-2 rounded"
                   >
                     <Trash2 size={18} />
                   </button>
                </div>
                
                <div className="p-4">
                  <h5 className="text-sm font-semibold text-gray-400 mb-3 flex items-center gap-2">
                    <Layers size={14} /> Espaces configurés
                  </h5>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {club.spaces.map((space, idx) => (
                      <span key={idx} className="bg-gym-dark px-3 py-1 rounded text-sm text-gray-200 flex items-center gap-2 group">
                        {space}
                        <button 
                          onClick={() => handleDeleteSpace(club.id, idx)}
                          className="text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                  
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="Nom du nouvel espace..."
                      className="flex-1 bg-gym-dark border border-gray-600 rounded px-3 py-2 text-sm text-white focus:border-gym-yellow outline-none"
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
                      className="bg-gray-700 hover:bg-gray-600 text-white p-2 rounded"
                    >
                      <Plus size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TRADES TAB */}
      {activeTab === 'trades' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">
          
          {/* List of Trades */}
          <div className="col-span-1 bg-gym-light rounded-xl border border-gray-700 overflow-hidden">
            <div className="p-3 bg-gym-darker border-b border-gray-700 font-bold text-white">
              Métiers du Bâtiment
            </div>
            <div className="overflow-y-auto max-h-[600px]">
              {Object.values(TradeType).map(trade => (
                <button
                  key={trade}
                  onClick={() => setSelectedTrade(trade)}
                  className={`w-full text-left p-3 border-b border-gray-700 hover:bg-white/5 transition flex justify-between items-center ${selectedTrade === trade ? 'bg-gym-yellow text-gym-dark font-bold' : 'text-gray-300'}`}
                >
                  {trade}
                  <span className="text-xs bg-black/20 px-2 py-0.5 rounded-full opacity-60">
                    {failureTypes[trade]?.length || 0}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Failure Types for Selected Trade */}
          <div className="col-span-1 md:col-span-2 space-y-4">
             <div className="bg-gym-light p-6 rounded-xl border border-gray-700">
               <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                 <Wrench className="text-gym-yellow" />
                 {selectedTrade}
               </h3>
               <p className="text-gray-400 text-sm mb-6">
                 Configurez ici les pannes courantes pour ce métier. Ces options apparaîtront dans la création de tickets pour faciliter le signalement.
               </p>

               {/* Add New */}
               <div className="flex gap-2 mb-6">
                 <input 
                   type="text" 
                   placeholder="Ajouter un type de panne (ex: Fuite d'eau, Court-circuit...)"
                   className="flex-1 bg-gym-dark border border-gray-600 rounded px-4 py-3 text-white focus:border-gym-yellow outline-none"
                   value={newFailureType}
                   onChange={(e) => setNewFailureType(e.target.value)}
                   onKeyDown={(e) => {
                       if(e.key === 'Enter') handleAddFailureType();
                   }}
                 />
                 <button 
                   onClick={handleAddFailureType}
                   className="bg-gym-yellow text-gym-dark font-bold px-6 py-2 rounded hover:bg-yellow-400 transition"
                 >
                   Ajouter
                 </button>
               </div>

               {/* List */}
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                 {(failureTypes[selectedTrade] || []).map((failure, idx) => (
                   <div key={idx} className="bg-gym-dark border border-gray-600 p-3 rounded flex justify-between items-center group">
                     <span className="text-gray-200">{failure}</span>
                     <button 
                       onClick={() => handleDeleteFailureType(failure)}
                       className="text-gray-600 hover:text-red-400"
                     >
                       <Trash2 size={16} />
                     </button>
                   </div>
                 ))}
                 {(failureTypes[selectedTrade] || []).length === 0 && (
                   <div className="col-span-2 text-center text-gray-500 py-8 italic border border-dashed border-gray-700 rounded">
                     Aucune panne type configurée pour ce métier.
                   </div>
                 )}
               </div>
             </div>
          </div>
        </div>
      )}

      {/* NOTIFICATIONS TAB */}
      {activeTab === 'notifications' && userPreferences && (
         <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
            <div className="bg-gym-light p-6 rounded-xl border border-gray-700">
               <div className="flex items-start gap-4 mb-6">
                  <div className="bg-gym-dark p-3 rounded-full">
                     <BellRing className="text-gym-yellow" size={24} />
                  </div>
                  <div>
                     <h3 className="text-xl font-bold text-white">Préférences de Notification</h3>
                     <p className="text-gray-400 text-sm mt-1">
                        Choisissez les types d'alertes que vous souhaitez recevoir pour rester informé de l'activité de vos clubs.
                     </p>
                  </div>
               </div>

               <div className="space-y-4">
                  {/* Browser Push */}
                  <div className="bg-gym-darker p-4 rounded-lg flex justify-between items-center border border-gray-600 mb-6">
                     <div className="flex items-center gap-3">
                        <Smartphone className="text-blue-400" />
                        <div>
                           <div className="font-bold text-white">Notifications Navigateur</div>
                           <div className="text-xs text-gray-400">Recevoir des pop-ups même si l'application est en arrière-plan.</div>
                        </div>
                     </div>
                     <button 
                        onClick={handleRequestBrowserPermission}
                        className={`px-4 py-2 rounded font-bold text-sm transition ${userPreferences.browserPush && Notification.permission === 'granted' ? 'bg-green-500/20 text-green-400 border border-green-500/50' : 'bg-gym-yellow text-gym-dark hover:bg-yellow-400'}`}
                     >
                        {userPreferences.browserPush && Notification.permission === 'granted' ? 'Actif' : 'Activer'}
                     </button>
                  </div>

                  {/* Toggles */}
                  <div className="space-y-3">
                     <label className="flex items-center justify-between p-3 bg-gym-dark rounded border border-gray-700 cursor-pointer hover:border-gym-yellow/50 transition">
                        <div>
                           <div className="font-semibold text-white">Nouveaux Tickets Urgents</div>
                           <div className="text-xs text-gray-400">Alertes pour les tickets de niveau 'Haute' ou 'Critique'.</div>
                        </div>
                        <div className="relative inline-block w-12 h-6 transition duration-200 ease-in-out">
                           <input 
                              type="checkbox" 
                              className="opacity-0 w-0 h-0"
                              checked={userPreferences.tickets}
                              onChange={() => handleTogglePreference('tickets')}
                           />
                           <span className={`absolute cursor-pointer top-0 left-0 right-0 bottom-0 rounded-full transition-colors duration-200 ${userPreferences.tickets ? 'bg-gym-yellow' : 'bg-gray-600'}`}></span>
                           <span className={`absolute left-1 bottom-1 bg-white w-4 h-4 rounded-full transition-transform duration-200 transform ${userPreferences.tickets ? 'translate-x-6' : 'translate-x-0'}`}></span>
                        </div>
                     </label>

                     <label className="flex items-center justify-between p-3 bg-gym-dark rounded border border-gray-700 cursor-pointer hover:border-gym-yellow/50 transition">
                        <div>
                           <div className="font-semibold text-white">Vérifications en Retard</div>
                           <div className="text-xs text-gray-400">Alertes quand une vérification périodique dépasse sa date limite.</div>
                        </div>
                        <div className="relative inline-block w-12 h-6 transition duration-200 ease-in-out">
                           <input 
                              type="checkbox" 
                              className="opacity-0 w-0 h-0"
                              checked={userPreferences.checks}
                              onChange={() => handleTogglePreference('checks')}
                           />
                           <span className={`absolute cursor-pointer top-0 left-0 right-0 bottom-0 rounded-full transition-colors duration-200 ${userPreferences.checks ? 'bg-gym-yellow' : 'bg-gray-600'}`}></span>
                           <span className={`absolute left-1 bottom-1 bg-white w-4 h-4 rounded-full transition-transform duration-200 transform ${userPreferences.checks ? 'translate-x-6' : 'translate-x-0'}`}></span>
                        </div>
                     </label>

                     <label className="flex items-center justify-between p-3 bg-gym-dark rounded border border-gray-700 cursor-pointer hover:border-gym-yellow/50 transition">
                        <div>
                           <div className="font-semibold text-white">Nouvelles Maintenances</div>
                           <div className="text-xs text-gray-400">Alertes lors de la planification d'une intervention.</div>
                        </div>
                        <div className="relative inline-block w-12 h-6 transition duration-200 ease-in-out">
                           <input 
                              type="checkbox" 
                              className="opacity-0 w-0 h-0"
                              checked={userPreferences.maintenance}
                              onChange={() => handleTogglePreference('maintenance')}
                           />
                           <span className={`absolute cursor-pointer top-0 left-0 right-0 bottom-0 rounded-full transition-colors duration-200 ${userPreferences.maintenance ? 'bg-gym-yellow' : 'bg-gray-600'}`}></span>
                           <span className={`absolute left-1 bottom-1 bg-white w-4 h-4 rounded-full transition-transform duration-200 transform ${userPreferences.maintenance ? 'translate-x-6' : 'translate-x-0'}`}></span>
                        </div>
                     </label>
                  </div>
               </div>
            </div>
         </div>
      )}

      {/* Modal New Club */}
      {showClubModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-gym-light w-full max-w-md rounded-xl shadow-2xl border border-gray-600">
            <div className="flex justify-between items-center p-6 border-b border-gray-700">
              <h2 className="text-xl font-bold text-white">Nouveau Club</h2>
              <button onClick={() => setShowClubModal(false)}><X className="text-gray-400 hover:text-white" /></button>
            </div>
            <form onSubmit={handleCreateClub} className="p-6 space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Nom du club</label>
                <input 
                  type="text" 
                  required
                  className="w-full bg-gym-dark border border-gray-600 rounded p-2 text-white focus:border-gym-yellow outline-none"
                  value={newClubName}
                  onChange={e => setNewClubName(e.target.value)}
                  placeholder="Ex: MCL Bordeaux"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Adresse</label>
                <input 
                  type="text" 
                  required
                  className="w-full bg-gym-dark border border-gray-600 rounded p-2 text-white focus:border-gym-yellow outline-none"
                  value={newClubAddress}
                  onChange={e => setNewClubAddress(e.target.value)}
                  placeholder="Ex: 10 Rue Sainte-Catherine"
                />
              </div>
              <button 
                type="submit"
                className="w-full bg-gym-yellow text-gym-dark font-bold py-3 rounded hover:bg-yellow-400 transition mt-4"
              >
                Créer le club
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsManager;