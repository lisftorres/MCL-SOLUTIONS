

import React, { useState } from 'react';
import { Ticket, PeriodicCheck, MaintenanceEvent, Club, User, UserRole } from '../types';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Ticket as TicketIcon, ClipboardCheck, AlertTriangle, Wrench, Plus, X, Trash2, Bell, CheckSquare, PenTool, Edit } from 'lucide-react';

interface MaintenanceScheduleProps {
  tickets: Ticket[];
  checks: PeriodicCheck[];
  clubs: Club[];
  currentUser: User;
  maintenanceEvents?: MaintenanceEvent[];
  onAddEvent?: (event: Partial<MaintenanceEvent>) => void;
  onEditEvent?: (event: MaintenanceEvent) => void;
  onDeleteEvent?: (id: string) => void;
}

const MaintenanceSchedule: React.FC<MaintenanceScheduleProps> = ({ 
  tickets, 
  checks, 
  clubs,
  currentUser,
  maintenanceEvents = [], 
  onAddEvent, 
  onEditEvent, 
  onDeleteEvent 
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  // Filtrer les clubs accessibles
  // MODIFICATION: Technicien voit tout comme l'admin
  const allowedClubs = (currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.TECHNICIAN)
    ? clubs 
    : clubs.filter(c => currentUser.clubIds.includes(c.id));
  const allowedClubIds = allowedClubs.map(c => c.id);
  
  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<MaintenanceEvent>>({
    title: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
    notifyOnDashboard: false,
    clubId: '',
    checklist: [],
    signatures: {}
  });

  // Utilitaires de dates
  const getStartOfWeek = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Ajuster pour commencer Lundi
    return new Date(d.setDate(diff));
  };

  const addDays = (date: Date, days: number) => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  };

  const startOfWeek = getStartOfWeek(currentDate);
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(startOfWeek, i));

  const formatDateKey = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  // Navigation
  const handlePrevWeek = () => setCurrentDate(addDays(currentDate, -7));
  const handleNextWeek = () => setCurrentDate(addDays(currentDate, 7));
  const handleToday = () => setCurrentDate(new Date());

  // Gestion des événements
  const handleOpenCreate = () => {
    setIsEditing(false);
    setFormData({
      title: '',
      date: new Date().toISOString().split('T')[0],
      description: '',
      notifyOnDashboard: false,
      clubId: allowedClubs[0]?.id || '',
      checklist: allowedClubs[0]?.spaces.map(s => ({ space: s, checked: false })) || [],
      signatures: {}
    });
    setShowModal(true);
  };

  const handleOpenEdit = (event: MaintenanceEvent, e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
    // Ensure legacy events have checklist structure if missing
    let checklist = event.checklist;
    if (!checklist && event.clubId) {
       const club = clubs.find(c => c.id === event.clubId);
       if (club) {
         checklist = club.spaces.map(s => ({ space: s, checked: false }));
       }
    }

    setFormData({ 
      ...event,
      checklist: checklist || [] 
    });
    setShowModal(true);
  };

  const handleDeleteDirectly = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDeleteEvent && window.confirm("Êtes-vous sûr de vouloir supprimer cette maintenance planifiée ?")) {
      onDeleteEvent(id);
    }
  };

  const handleClubChange = (clubId: string) => {
    const club = clubs.find(c => c.id === clubId);
    if (club) {
      setFormData(prev => ({
        ...prev,
        clubId: clubId,
        checklist: club.spaces.map(s => ({ space: s, checked: false }))
      }));
    } else {
      setFormData(prev => ({ ...prev, clubId: clubId }));
    }
  };

  const handleToggleChecklist = (spaceName: string) => {
    setFormData(prev => {
      const newChecklist = prev.checklist ? [...prev.checklist] : [];
      const itemIndex = newChecklist.findIndex(i => i.space === spaceName);
      if (itemIndex >= 0) {
        newChecklist[itemIndex].checked = !newChecklist[itemIndex].checked;
      } else {
        newChecklist.push({ space: spaceName, checked: true });
      }
      return { ...prev, checklist: newChecklist };
    });
  };

  const handleSign = (role: 'TECH' | 'MANAGER') => {
    const now = new Date().toISOString();
    setFormData(prev => {
      const sigs = { ...prev.signatures };
      if (role === 'TECH') {
        sigs.technician = { name: currentUser.name, date: now };
      } else {
        sigs.manager = { name: currentUser.name, date: now };
      }
      return { ...prev, signatures: sigs };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditing && formData.id && onEditEvent) {
      onEditEvent(formData as MaintenanceEvent);
    } else if (onAddEvent) {
      onAddEvent(formData);
    }
    setShowModal(false);
  };

  const handleDelete = () => {
    if (formData.id && onDeleteEvent) {
      if(window.confirm("Supprimer cette maintenance ?")) {
        onDeleteEvent(formData.id);
        setShowModal(false);
      }
    }
  };

  // Filtrage des données pour la semaine
  const getEventsForDay = (date: Date) => {
    const dateKey = formatDateKey(date);

    const dayTickets = tickets
      .filter(t => allowedClubIds.includes(t.clubId))
      .filter(t => t.createdAt.startsWith(dateKey));
    
    const dayChecks = checks
      .filter(c => allowedClubIds.includes(c.clubId))
      .filter(c => c.nextDueDate.startsWith(dateKey));
    
    const dayMaintenance = maintenanceEvents
      .filter(m => !m.clubId || allowedClubIds.includes(m.clubId))
      .filter(m => m.date === dateKey);

    return { dayTickets, dayChecks, dayMaintenance };
  };

  const formatDayName = (date: Date) => {
    return new Intl.DateTimeFormat('fr-FR', { weekday: 'long' }).format(date);
  };

  const formatDayNumber = (date: Date) => {
    return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' }).format(date);
  };

  return (
    <div className="space-y-6">
      {/* Header et Navigation */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-gym-light p-4 rounded-lg shadow-lg">
        <div className="flex items-center gap-3 mb-4 md:mb-0">
          <CalendarIcon className="text-gym-yellow" size={24} />
          <h2 className="text-xl font-bold text-white capitalize">
            {new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(currentDate)}
          </h2>
        </div>
        
        <div className="flex items-center gap-4">
          {currentUser.role !== UserRole.MANAGER && (
            <button 
              onClick={handleOpenCreate}
              className="hidden md:flex bg-gym-yellow text-gym-dark font-bold px-3 py-2 rounded items-center gap-2 hover:bg-yellow-400 transition"
            >
              <Plus size={18} /> Planifier maintenance
            </button>
          )}

          <div className="flex bg-gym-dark rounded-lg p-1">
            <button onClick={handlePrevWeek} className="p-2 hover:bg-gray-700 rounded-lg text-gray-300">
              <ChevronLeft size={20} />
            </button>
            <button onClick={handleToday} className="px-4 py-2 text-sm font-bold text-white hover:bg-gray-700 rounded-lg transition">
              Aujourd'hui
            </button>
            <button onClick={handleNextWeek} className="p-2 hover:bg-gray-700 rounded-lg text-gray-300">
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>
      
      {/* Bouton Mobile */}
      {currentUser.role !== UserRole.MANAGER && (
        <button 
          onClick={handleOpenCreate}
          className="md:hidden w-full bg-gym-yellow text-gym-dark font-bold px-3 py-3 rounded flex justify-center items-center gap-2 hover:bg-yellow-400 transition"
        >
          <Plus size={18} /> Planifier maintenance
        </button>
      )}

      {/* Grille Calendrier */}
      <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
        {weekDays.map((day, index) => {
          const { dayTickets, dayChecks, dayMaintenance } = getEventsForDay(day);
          const isCurrentDay = isToday(day);

          return (
            <div 
              key={index} 
              className={`min-h-[200px] rounded-xl border flex flex-col ${
                isCurrentDay 
                  ? 'bg-gym-light border-gym-yellow shadow-[0_0_10px_rgba(247,206,62,0.2)]' 
                  : 'bg-gym-light/50 border-gray-700'
              }`}
            >
              {/* En-tête du jour */}
              <div className={`p-3 border-b ${isCurrentDay ? 'border-gym-yellow/30 bg-gym-yellow/10' : 'border-gray-700'}`}>
                <p className={`text-xs font-semibold uppercase mb-1 ${isCurrentDay ? 'text-gym-yellow' : 'text-gray-400'}`}>
                  {formatDayName(day)}
                </p>
                <p className="text-lg font-bold text-white">
                  {formatDayNumber(day)}
                </p>
              </div>

              {/* Contenu */}
              <div className="p-2 space-y-2 flex-1 overflow-y-auto custom-scrollbar">
                
                {/* Maintenance Events */}
                {dayMaintenance.map(event => (
                   <div 
                    key={event.id} 
                    onClick={(e) => handleOpenEdit(event, e)}
                    className="bg-purple-500/10 border-l-2 border-purple-500 p-2 rounded text-xs hover:bg-purple-500/20 transition cursor-pointer group relative"
                   >
                     <div className="font-bold text-purple-200 flex justify-between items-start mb-1">
                        <span className="truncate flex-1 mr-1">{event.title}</span>
                        <div className="flex gap-1 shrink-0">
                          {event.notifyOnDashboard && <Bell size={12} className="text-purple-400" />}
                          <button className="text-purple-300 hover:text-white" title="Modifier">
                             <Edit size={12} />
                          </button>
                          {currentUser.role !== UserRole.MANAGER && (
                            <button 
                              onClick={(e) => handleDeleteDirectly(event.id, e)}
                              className="text-red-400 hover:text-white transition" 
                              title="Supprimer"
                            >
                              <Trash2 size={12} />
                            </button>
                          )}
                        </div>
                     </div>
                     <div className="flex items-center gap-1 mt-1 text-gray-500">
                        <Wrench size={10} />
                        <span>Maintenance</span>
                     </div>
                     {(event.signatures?.technician || event.signatures?.manager) && (
                        <div className="mt-1 flex gap-1">
                          {event.signatures.technician && <div className="w-2 h-2 rounded-full bg-green-500" title="Validé par Tech"></div>}
                          {event.signatures.manager && <div className="w-2 h-2 rounded-full bg-blue-500" title="Validé par Manager"></div>}
                        </div>
                     )}
                   </div>
                ))}

                {/* Tickets */}
                {dayTickets.map(ticket => (
                  <div key={ticket.id} className="bg-red-500/10 border-l-2 border-red-500 p-2 rounded text-xs hover:bg-red-500/20 transition cursor-pointer group">
                    <div className="flex justify-between items-start">
                      <span className="font-bold text-red-200 truncate w-20">{ticket.trade}</span>
                      {ticket.urgency === 'CRITIQUE' && <AlertTriangle size={10} className="text-red-500 animate-pulse" />}
                    </div>
                    <p className="text-gray-400 mt-1 line-clamp-2">{ticket.description}</p>
                    <div className="flex items-center gap-1 mt-1 text-gray-500">
                       <TicketIcon size={10} />
                       <span>Ticket</span>
                    </div>
                  </div>
                ))}

                {/* Vérifications */}
                {dayChecks.map(check => (
                  <div key={check.id} className="bg-blue-500/10 border-l-2 border-blue-500 p-2 rounded text-xs hover:bg-blue-500/20 transition cursor-pointer">
                    <div className="font-bold text-blue-200 truncate">{check.title}</div>
                    <p className="text-gray-400 mt-1 truncate">{check.space}</p>
                    <div className="flex items-center gap-1 mt-1 text-gray-500">
                       <ClipboardCheck size={10} />
                       <span>{check.frequencyMonths} mois</span>
                    </div>
                  </div>
                ))}

                {dayTickets.length === 0 && dayChecks.length === 0 && dayMaintenance.length === 0 && (
                  <div className="h-full flex items-center justify-center opacity-20">
                    <p className="text-xs text-gray-500 italic">Rien de prévu</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Légende */}
      <div className="flex flex-wrap gap-4 justify-center text-sm text-gray-400">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-purple-500/20 border border-purple-500 rounded"></div>
          <span>Maintenance planifiée</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-red-500/20 border border-red-500 rounded"></div>
          <span>Tickets signalés</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-500/20 border border-blue-500 rounded"></div>
          <span>Vérifications planifiées</span>
        </div>
      </div>

      {/* MODAL FORM */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-gym-light w-full max-w-2xl rounded-xl shadow-2xl border border-gray-600 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-700 sticky top-0 bg-gym-light z-10">
              <h2 className="text-xl font-bold text-white">
                {isEditing ? 'Suivi Maintenance' : 'Planifier une maintenance'}
              </h2>
              <button onClick={() => setShowModal(false)}><X className="text-gray-400 hover:text-white" /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-sm text-gray-400 mb-1">Titre de l'intervention</label>
                  <input 
                    type="text" 
                    required
                    className="w-full bg-gym-dark border border-gray-600 rounded p-2 text-white focus:border-gym-yellow outline-none"
                    value={formData.title}
                    onChange={e => setFormData({...formData, title: e.target.value})}
                    placeholder="Ex: Remplacement filtres CTA"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1">Date prévue</label>
                  <input 
                    type="date" 
                    required
                    className="w-full bg-gym-dark border border-gray-600 rounded p-2 text-white focus:border-gym-yellow outline-none"
                    value={formData.date}
                    onChange={e => setFormData({...formData, date: e.target.value})}
                  />
                </div>

                <div>
                   <label className="block text-sm text-gray-400 mb-1">Club Concerné</label>
                   <select 
                     className="w-full bg-gym-dark border border-gray-600 rounded p-2 text-white outline-none"
                     value={formData.clubId || ''}
                     onChange={(e) => handleClubChange(e.target.value)}
                   >
                     <option value="" disabled>Sélectionner un club</option>
                     {allowedClubs.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                   </select>
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Description / Notes</label>
                <textarea 
                  rows={3}
                  className="w-full bg-gym-dark border border-gray-600 rounded p-2 text-white focus:border-gym-yellow outline-none"
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  placeholder="Détails de l'intervention..."
                />
              </div>

              {/* Checklist Espaces */}
              {formData.clubId && (formData.checklist?.length || 0) > 0 && (
                 <div className="bg-gym-dark p-4 rounded border border-gray-600">
                   <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                     <CheckSquare size={16} className="text-gym-yellow" /> 
                     Validation par Espace
                   </h3>
                   <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                     {formData.checklist?.map((item, idx) => (
                       <label key={idx} className="flex items-center space-x-2 bg-gym-light/30 p-2 rounded cursor-pointer hover:bg-gym-light/50">
                         <input 
                           type="checkbox" 
                           checked={item.checked} 
                           onChange={() => handleToggleChecklist(item.space)}
                           className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-gym-yellow focus:ring-gym-yellow"
                         />
                         <span className={`text-sm ${item.checked ? 'text-green-400' : 'text-gray-300'}`}>
                            {item.space}
                         </span>
                       </label>
                     ))}
                   </div>
                 </div>
              )}

              {/* Signatures */}
              <div className="border-t border-gray-700 pt-4 mt-4">
                 <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                    <PenTool size={16} className="text-blue-400" /> Validation & Signatures
                 </h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    {/* Technicien */}
                    <div className={`p-4 rounded border ${formData.signatures?.technician ? 'bg-green-500/10 border-green-500/50' : 'bg-gym-dark border-gray-600'}`}>
                       <div className="text-xs text-gray-400 uppercase font-semibold mb-2">Technicien</div>
                       {formData.signatures?.technician ? (
                          <div>
                             <p className="text-white font-bold">{formData.signatures.technician.name}</p>
                             <p className="text-xs text-gray-400">{new Date(formData.signatures.technician.date).toLocaleString()}</p>
                          </div>
                       ) : (
                          <button 
                             type="button"
                             disabled={currentUser.role === UserRole.MANAGER} // Manager cannot sign as Tech
                             onClick={() => handleSign('TECH')}
                             className="w-full py-2 bg-gym-yellow/10 text-gym-yellow border border-gym-yellow/30 rounded hover:bg-gym-yellow/20 disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                             Valider Intervention
                          </button>
                       )}
                    </div>

                    {/* Manager */}
                    <div className={`p-4 rounded border ${formData.signatures?.manager ? 'bg-blue-500/10 border-blue-500/50' : 'bg-gym-dark border-gray-600'}`}>
                       <div className="text-xs text-gray-400 uppercase font-semibold mb-2">Responsable / Manager</div>
                       {formData.signatures?.manager ? (
                          <div>
                             <p className="text-white font-bold">{formData.signatures.manager.name}</p>
                             <p className="text-xs text-gray-400">{new Date(formData.signatures.manager.date).toLocaleString()}</p>
                          </div>
                       ) : (
                          <button 
                             type="button"
                             disabled={currentUser.role === UserRole.TECHNICIAN} // Tech cannot sign as Manager
                             onClick={() => handleSign('MANAGER')}
                             className="w-full py-2 bg-blue-500/10 text-blue-400 border border-blue-500/30 rounded hover:bg-blue-500/20 disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                             Valider Maintenance
                          </button>
                       )}
                    </div>

                 </div>
              </div>

              <div className="flex items-center space-x-3 mt-2">
                <input 
                  type="checkbox" 
                  id="notify"
                  className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-gym-yellow focus:ring-gym-yellow"
                  checked={formData.notifyOnDashboard}
                  onChange={e => setFormData({...formData, notifyOnDashboard: e.target.checked})}
                />
                <label htmlFor="notify" className="text-sm text-gray-400 cursor-pointer select-none">
                  Afficher un rappel sur le Tableau de Bord
                </label>
              </div>

              <div className="pt-4 flex gap-3 border-t border-gray-700">
                {isEditing && currentUser.role !== UserRole.MANAGER && (
                  <button 
                    type="button"
                    onClick={handleDelete}
                    className="p-3 bg-red-500/20 text-red-400 rounded border border-red-500/50 hover:bg-red-500/30"
                    title="Supprimer"
                  >
                    <Trash2 size={20} />
                  </button>
                )}
                <button 
                  type="submit"
                  className="flex-1 bg-gym-yellow text-gym-dark font-bold py-3 rounded hover:bg-yellow-400 transition"
                >
                  {isEditing ? 'Mettre à jour' : 'Planifier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default MaintenanceSchedule;
