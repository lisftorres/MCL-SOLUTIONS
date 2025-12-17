
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

  const allowedClubs = (currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.TECHNICIAN)
    ? clubs 
    : clubs.filter(c => currentUser.clubIds.includes(c.id));
  const allowedClubIds = allowedClubs.map(c => c.id);
  
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

  const getStartOfWeek = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  };

  const addDays = (date: Date, days: number) => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  };

  const startOfWeek = getStartOfWeek(currentDate);
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(startOfWeek, i));

  const formatDateKey = (date: Date) => date.toISOString().split('T')[0];

  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  const handlePrevWeek = () => setCurrentDate(addDays(currentDate, -7));
  const handleNextWeek = () => setCurrentDate(addDays(currentDate, 7));
  const handleToday = () => setCurrentDate(new Date());

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
    let checklist = event.checklist;
    if (!checklist && event.clubId) {
       const club = clubs.find(c => c.id === event.clubId);
       if (club) {
         checklist = club.spaces.map(s => ({ space: s, checked: false }));
       }
    }
    setFormData({ ...event, checklist: checklist || [] });
    setShowModal(true);
  };

  const handleDeleteDirectly = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDeleteEvent && window.confirm("Supprimer cette maintenance planifiée ?")) {
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

  const getEventsForDay = (date: Date) => {
    const dateKey = formatDateKey(date);
    const dayTickets = tickets.filter(t => allowedClubIds.includes(t.clubId)).filter(t => t.createdAt.startsWith(dateKey));
    const dayChecks = checks.filter(c => allowedClubIds.includes(c.clubId)).filter(c => c.nextDueDate.startsWith(dateKey));
    const dayMaintenance = maintenanceEvents.filter(m => !m.clubId || allowedClubIds.includes(m.clubId)).filter(m => m.date === dateKey);
    return { dayTickets, dayChecks, dayMaintenance };
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center bg-brand-light p-4 rounded-lg shadow-lg">
        <div className="flex items-center gap-3 mb-4 md:mb-0">
          <CalendarIcon className="text-brand-yellow" size={24} />
          <h2 className="text-xl font-bold text-white capitalize">
            {new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(currentDate)}
          </h2>
        </div>
        <div className="flex items-center gap-4">
          {currentUser.role !== UserRole.MANAGER && (
            <button onClick={handleOpenCreate} className="hidden md:flex bg-brand-yellow text-brand-dark font-bold px-3 py-2 rounded items-center gap-2 hover:bg-yellow-400 transition shadow-lg">
              <Plus size={18} /> Planifier maintenance
            </button>
          )}
          <div className="flex bg-brand-dark rounded-lg p-1 border border-brand-light/20">
            <button onClick={handlePrevWeek} className="p-2 hover:bg-gray-700 rounded-lg text-gray-300 transition-colors"><ChevronLeft size={20} /></button>
            <button onClick={handleToday} className="px-4 py-2 text-sm font-bold text-white hover:bg-gray-700 rounded-lg transition-all">Aujourd'hui</button>
            <button onClick={handleNextWeek} className="p-2 hover:bg-gray-700 rounded-lg text-gray-300 transition-colors"><ChevronRight size={20} /></button>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
        {weekDays.map((day, index) => {
          const { dayTickets, dayChecks, dayMaintenance } = getEventsForDay(day);
          const isCurrentDay = isToday(day);
          return (
            <div key={index} className={`min-h-[220px] rounded-xl border flex flex-col transition-all ${isCurrentDay ? 'bg-brand-light border-brand-yellow shadow-xl' : 'bg-brand-light/50 border-gray-700 hover:border-gray-500'}`}>
              <div className={`p-3 border-b ${isCurrentDay ? 'border-brand-yellow/30 bg-brand-yellow/5' : 'border-gray-700'}`}>
                <p className={`text-[10px] font-black uppercase mb-1 tracking-widest ${isCurrentDay ? 'text-brand-yellow' : 'text-gray-400'}`}>{new Intl.DateTimeFormat('fr-FR', { weekday: 'short' }).format(day)}</p>
                <p className="text-xl font-black text-white">{new Intl.DateTimeFormat('fr-FR', { day: 'numeric' }).format(day)}</p>
              </div>
              <div className="p-2 space-y-2 flex-1 overflow-y-auto custom-scrollbar">
                {dayMaintenance.map(event => (
                   <div key={event.id} onClick={(e) => handleOpenEdit(event, e)} className="bg-purple-500/10 border-l-4 border-purple-500 p-2 rounded text-[10px] hover:bg-purple-500/20 transition cursor-pointer group relative">
                     <div className="font-bold text-purple-200 flex justify-between items-start mb-1">
                        <span className="truncate flex-1 mr-1">{event.title}</span>
                        {currentUser.role !== UserRole.MANAGER && (
                          <button onClick={(e) => handleDeleteDirectly(event.id, e)} className="text-red-400 hover:text-white transition opacity-0 group-hover:opacity-100" title="Supprimer"><Trash2 size={10} /></button>
                        )}
                     </div>
                     <div className="flex items-center gap-1 mt-1 text-gray-500 font-bold uppercase tracking-tighter">Maintenance</div>
                   </div>
                ))}
                {dayTickets.map(ticket => (
                  <div key={ticket.id} className="bg-red-500/10 border-l-4 border-red-500 p-2 rounded text-[10px] hover:bg-red-500/20 transition cursor-pointer">
                    <span className="font-bold text-red-200 block truncate">{ticket.trade}</span>
                    <p className="text-gray-400 mt-1 line-clamp-1 italic">{ticket.description}</p>
                  </div>
                ))}
                {dayChecks.map(check => (
                  <div key={check.id} className="bg-blue-500/10 border-l-4 border-blue-500 p-2 rounded text-[10px] hover:bg-blue-500/20 transition cursor-pointer">
                    <div className="font-bold text-blue-200 truncate">{check.title}</div>
                    <div className="text-gray-500 text-[8px] font-black uppercase tracking-widest mt-1">Vérification</div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl rounded-xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-fade-in-up">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50 rounded-t-xl">
              <h2 className="text-xl font-black text-black uppercase tracking-tight">
                {isEditing ? 'Suivi Maintenance' : 'Planifier une maintenance'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-black transition-colors"><X size={24} /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 space-y-6 overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="col-span-full space-y-1">
                  <label className="block text-xs font-black text-black uppercase tracking-widest">Titre de l'intervention</label>
                  <input 
                    type="text" 
                    required
                    className="w-full bg-gray-50 border border-gray-300 rounded-lg p-3 text-black font-black outline-none focus:ring-2 focus:ring-brand-yellow transition-all"
                    value={formData.title}
                    onChange={e => setFormData({...formData, title: e.target.value})}
                    placeholder="Ex: Remplacement filtres CTA"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-black text-black uppercase tracking-widest">Date prévue</label>
                  <input 
                    type="date" 
                    required
                    className="w-full bg-gray-50 border border-gray-300 rounded-lg p-3 text-black font-black outline-none focus:ring-2 focus:ring-brand-yellow transition-all"
                    value={formData.date}
                    onChange={e => setFormData({...formData, date: e.target.value})}
                  />
                </div>

                <div className="space-y-1">
                   <label className="block text-xs font-black text-black uppercase tracking-widest">Club Concerné</label>
                   <select 
                     className="w-full bg-gray-50 border border-gray-300 rounded-lg p-3 text-black font-black outline-none"
                     value={formData.clubId || ''}
                     onChange={(e) => handleClubChange(e.target.value)}
                   >
                     <option value="" disabled>Sélectionner...</option>
                     {allowedClubs.map(c => <option key={c.id} value={c.id} className="text-black">{c.name}</option>)}
                   </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-black text-black uppercase tracking-widest">Description / Notes</label>
                <textarea 
                  rows={3}
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg p-3 text-black font-bold outline-none focus:ring-2 focus:ring-brand-yellow"
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  placeholder="Détails de l'intervention..."
                />
              </div>

              {formData.clubId && (formData.checklist?.length || 0) > 0 && (
                 <div className="bg-gray-100 p-5 rounded-xl border border-gray-200">
                   <h3 className="text-xs font-black text-black uppercase tracking-widest mb-4 flex items-center gap-2">
                     <CheckSquare size={16} className="text-brand-yellow" /> Validation par Espace
                   </h3>
                   <div className="grid grid-cols-2 gap-3 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                     {formData.checklist?.map((item, idx) => (
                       <label key={idx} className="flex items-center space-x-3 bg-white p-3 rounded-lg border border-gray-300 cursor-pointer hover:border-brand-yellow transition-all group shadow-sm">
                         <input 
                           type="checkbox" 
                           checked={item.checked} 
                           onChange={() => handleToggleChecklist(item.space)}
                           className="w-5 h-5 rounded border-gray-300 text-brand-yellow focus:ring-brand-yellow transition-all"
                         />
                         <span className={`text-sm font-black transition-colors ${item.checked ? 'text-green-600' : 'text-black group-hover:text-black'}`}>
                            {item.space}
                         </span>
                       </label>
                     ))}
                   </div>
                 </div>
              )}

              <div className="border-t border-gray-100 pt-6">
                 <h3 className="text-xs font-black text-black uppercase tracking-widest mb-4 flex items-center gap-2">
                    <PenTool size={16} className="text-blue-500" /> Validation & Signatures
                 </h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className={`p-4 rounded-xl border-2 transition-all ${formData.signatures?.technician ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-300'}`}>
                       <div className="text-[10px] text-black uppercase font-black tracking-widest mb-3">Technicien</div>
                       {formData.signatures?.technician ? (
                          <div>
                             <p className="text-black font-black text-sm">{formData.signatures.technician.name}</p>
                             <p className="text-[10px] text-gray-600 font-bold">{new Date(formData.signatures.technician.date).toLocaleString('fr-FR')}</p>
                          </div>
                       ) : (
                          <button 
                             type="button"
                             disabled={currentUser.role === UserRole.MANAGER}
                             onClick={() => handleSign('TECH')}
                             className="w-full py-3 bg-white text-brand-yellow border-2 border-brand-yellow/30 font-black text-xs uppercase tracking-tighter rounded-lg hover:bg-brand-yellow hover:text-brand-dark transition-all disabled:opacity-20 cursor-pointer"
                          >
                             Signer l'intervention
                          </button>
                       )}
                    </div>

                    <div className={`p-4 rounded-xl border-2 transition-all ${formData.signatures?.manager ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-300'}`}>
                       <div className="text-[10px] text-black uppercase font-black tracking-widest mb-3">Responsable Club</div>
                       {formData.signatures?.manager ? (
                          <div>
                             <p className="text-black font-black text-sm">{formData.signatures.manager.name}</p>
                             <p className="text-[10px] text-gray-600 font-bold">{new Date(formData.signatures.manager.date).toLocaleString('fr-FR')}</p>
                          </div>
                       ) : (
                          <button 
                             type="button"
                             disabled={currentUser.role === UserRole.TECHNICIAN}
                             onClick={() => handleSign('MANAGER')}
                             className="w-full py-3 bg-white text-blue-500 border-2 border-blue-500/30 font-black text-xs uppercase tracking-tighter rounded-lg hover:bg-blue-500 hover:text-white transition-all disabled:opacity-20 cursor-pointer"
                          >
                             Valider la maintenance
                          </button>
                       )}
                    </div>
                 </div>
              </div>

              <div className="flex items-center space-x-3 p-4 bg-gray-100 rounded-xl border border-gray-300">
                <input 
                  type="checkbox" 
                  id="notify"
                  className="w-6 h-6 rounded border-gray-300 text-brand-yellow focus:ring-brand-yellow transition-all"
                  checked={formData.notifyOnDashboard}
                  onChange={e => setFormData({...formData, notifyOnDashboard: e.target.checked})}
                />
                <label htmlFor="notify" className="text-sm font-black text-black cursor-pointer select-none">
                  Afficher un rappel sur le Tableau de Bord
                </label>
              </div>

              <div className="pt-6 flex gap-4 border-t border-gray-100 sticky bottom-0 bg-white">
                {isEditing && currentUser.role !== UserRole.MANAGER && (
                  <button type="button" onClick={handleDelete} className="p-4 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-all shadow-sm cursor-pointer"><Trash2 size={24} /></button>
                )}
                <button type="submit" className="flex-1 bg-brand-yellow text-brand-dark font-black uppercase tracking-tight py-4 rounded-xl hover:bg-yellow-400 transition-all shadow-xl shadow-brand-yellow/20 cursor-pointer">
                  {isEditing ? 'Mettre à jour' : 'Enregistrer le planning'}
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
