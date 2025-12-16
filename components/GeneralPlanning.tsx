
import React, { useState } from 'react';
import { PlanningEvent, User } from '../types';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Plus, X, Trash2, Edit, Bell, MapPin, Truck, Users, MoreHorizontal, Clock, ArrowRight } from 'lucide-react';

interface GeneralPlanningProps {
  events: PlanningEvent[];
  currentUser: User;
  onAddEvent: (event: Partial<PlanningEvent>) => void;
  onEditEvent: (event: PlanningEvent) => void;
  onDeleteEvent: (id: string) => void;
}

const GeneralPlanning: React.FC<GeneralPlanningProps> = ({ 
  events, 
  currentUser, 
  onAddEvent, 
  onEditEvent, 
  onDeleteEvent 
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<PlanningEvent>>({
    title: '',
    date: new Date().toISOString().split('T')[0],
    startTime: '09:00',
    type: 'RDV',
    description: '',
    location: '',
    alert: false,
    createdBy: currentUser.id
  });

  // Utilitaires de dates
  const getStartOfWeek = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Lundi
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

  // Actions
  const handleOpenCreate = () => {
    setIsEditing(false);
    setFormData({
      title: '',
      date: new Date().toISOString().split('T')[0],
      startTime: '09:00',
      type: 'RDV',
      description: '',
      location: '',
      alert: false,
      createdBy: currentUser.id
    });
    setShowModal(true);
  };

  const handleOpenEdit = (event: PlanningEvent, e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
    setFormData({ ...event });
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditing && formData.id) {
      onEditEvent(formData as PlanningEvent);
    } else {
      onAddEvent(formData);
    }
    setShowModal(false);
  };

  const handleDelete = () => {
    if (formData.id && window.confirm("Supprimer cet événement du planning ?")) {
      onDeleteEvent(formData.id);
      setShowModal(false);
    }
  };

  // Styles
  const getEventTypeStyle = (type: string) => {
    switch (type) {
        case 'RDV': return { bg: 'bg-blue-500/10', border: 'border-blue-500', text: 'text-blue-200', icon: Users };
        case 'LIVRAISON': return { bg: 'bg-green-500/10', border: 'border-green-500', text: 'text-green-200', icon: Truck };
        default: return { bg: 'bg-gray-700/50', border: 'border-gray-500', text: 'text-gray-300', icon: MoreHorizontal };
    }
  };

  // Logic for upcoming events
  const todayStr = new Date().toISOString().split('T')[0];
  const upcomingEvents = events
    .filter(e => e.date >= todayStr)
    .sort((a, b) => {
      // Sort by date then by time
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return a.startTime.localeCompare(b.startTime);
    });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-gym-light p-4 rounded-lg shadow-lg">
        <div className="flex items-center gap-3 mb-4 md:mb-0">
          <CalendarIcon className="text-gym-yellow" size={24} />
          <div>
             <h2 className="text-xl font-bold text-white capitalize">Planning Général</h2>
             <p className="text-xs text-gray-400 capitalize">
                {new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(currentDate)}
             </p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={handleOpenCreate}
            className="hidden md:flex bg-gym-yellow text-gym-dark font-bold px-3 py-2 rounded items-center gap-2 hover:bg-yellow-400 transition"
          >
            <Plus size={18} /> Ajouter un événement
          </button>

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

      <button 
        onClick={handleOpenCreate}
        className="md:hidden w-full bg-gym-yellow text-gym-dark font-bold px-3 py-3 rounded flex justify-center items-center gap-2 hover:bg-yellow-400 transition"
      >
        <Plus size={18} /> Ajouter
      </button>

      {/* Calendar Grid */}
      <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
        {weekDays.map((day, index) => {
          const dateKey = formatDateKey(day);
          const dayEvents = events.filter(e => e.date === dateKey).sort((a,b) => a.startTime.localeCompare(b.startTime));
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
              <div className={`p-3 border-b ${isCurrentDay ? 'border-gym-yellow/30 bg-gym-yellow/10' : 'border-gray-700'}`}>
                <p className={`text-xs font-semibold uppercase mb-1 ${isCurrentDay ? 'text-gym-yellow' : 'text-gray-400'}`}>
                   {new Intl.DateTimeFormat('fr-FR', { weekday: 'long' }).format(day)}
                </p>
                <p className="text-lg font-bold text-white">
                   {new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' }).format(day)}
                </p>
              </div>

              <div className="p-2 space-y-2 flex-1 overflow-y-auto custom-scrollbar">
                {dayEvents.map(event => {
                    const style = getEventTypeStyle(event.type);
                    const Icon = style.icon;
                    return (
                        <div 
                            key={event.id}
                            onClick={(e) => handleOpenEdit(event, e)}
                            className={`${style.bg} border-l-2 ${style.border} p-2 rounded hover:brightness-110 transition cursor-pointer group`}
                        >
                            <div className="flex justify-between items-start mb-1">
                                <span className="text-xs font-mono text-gray-400">{event.startTime}</span>
                                {event.alert && <Bell size={10} className="text-gym-yellow animate-pulse" />}
                            </div>
                            <div className={`font-bold text-sm ${style.text} truncate mb-1`}>{event.title}</div>
                            <div className="flex items-center gap-1 text-gray-500 text-xs">
                                <Icon size={10} />
                                <span>{event.type}</span>
                            </div>
                        </div>
                    );
                })}
                {dayEvents.length === 0 && (
                  <div className="h-full flex items-center justify-center opacity-10">
                    <p className="text-xs text-gray-500 italic">Rien</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* SECTION: Planning à venir */}
      <div className="bg-gym-light p-6 rounded-lg shadow-lg border border-gray-700 mt-6">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Clock className="text-gym-yellow" size={20} />
            Planning à venir
          </h3>
          <div className="space-y-3">
            {upcomingEvents.length === 0 ? (
                <div className="text-center py-8 text-gray-500 italic border border-dashed border-gray-700 rounded-lg">
                    Aucun événement futur programmé.
                </div>
            ) : (
                upcomingEvents.map(event => {
                    const style = getEventTypeStyle(event.type);
                    const Icon = style.icon;
                    return (
                        <div 
                            key={event.id}
                            onClick={(e) => handleOpenEdit(event, e)}
                            className="flex flex-col md:flex-row md:items-center justify-between bg-gym-dark p-4 rounded-lg border border-gray-600 hover:border-gym-yellow/50 hover:bg-white/5 cursor-pointer transition group gap-4"
                        >
                            <div className="flex items-start gap-4">
                                <div className={`p-3 rounded-lg shrink-0 ${style.bg} ${style.text}`}>
                                    <Icon size={24} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-white text-lg">{event.title}</h4>
                                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-400 mt-1">
                                        <span className="flex items-center gap-1">
                                           <CalendarIcon size={14} className="text-gym-yellow" />
                                           <span className="capitalize">
                                             {new Date(event.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                                           </span>
                                        </span>
                                        <span className="flex items-center gap-1 font-mono text-gray-300 bg-gray-800 px-1.5 rounded">
                                           <Clock size={12} /> {event.startTime}
                                        </span>
                                    </div>
                                    {event.location && (
                                        <p className="text-xs text-gray-500 flex items-center gap-1 mt-2">
                                            <MapPin size={12} /> {event.location}
                                        </p>
                                    )}
                                    {event.description && (
                                        <p className="text-xs text-gray-500 mt-1 line-clamp-1 italic">
                                            "{event.description}"
                                        </p>
                                    )}
                                </div>
                            </div>
                            
                            <div className="flex items-center justify-between md:justify-end gap-3 w-full md:w-auto mt-2 md:mt-0 pt-2 md:pt-0 border-t md:border-t-0 border-gray-700">
                                 <span className={`text-xs px-2 py-1 rounded border ${style.border} ${style.text} bg-transparent font-bold uppercase tracking-wider`}>
                                    {event.type}
                                 </span>
                                 <div className="flex items-center gap-2 text-gray-600 group-hover:text-gym-yellow transition">
                                     <span className="text-xs hidden md:inline">Modifier</span>
                                     <ArrowRight size={18} />
                                 </div>
                            </div>
                        </div>
                    );
                })
            )}
          </div>
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-gym-light w-full max-w-md rounded-xl shadow-2xl border border-gray-600">
            <div className="flex justify-between items-center p-6 border-b border-gray-700">
              <h2 className="text-xl font-bold text-white">
                {isEditing ? 'Modifier Événement' : 'Nouvel Événement'}
              </h2>
              <button onClick={() => setShowModal(false)}><X className="text-gray-400 hover:text-white" /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Titre</label>
                <input 
                  type="text" 
                  required
                  className="w-full bg-gym-dark border border-gray-600 rounded p-2 text-white focus:border-gym-yellow outline-none"
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                  placeholder="Ex: Livraison TechnoGym"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Date</label>
                    <input 
                        type="date" 
                        required
                        className="w-full bg-gym-dark border border-gray-600 rounded p-2 text-white focus:border-gym-yellow outline-none"
                        value={formData.date}
                        onChange={e => setFormData({...formData, date: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Heure</label>
                    <input 
                        type="time" 
                        required
                        className="w-full bg-gym-dark border border-gray-600 rounded p-2 text-white focus:border-gym-yellow outline-none"
                        value={formData.startTime}
                        onChange={e => setFormData({...formData, startTime: e.target.value})}
                    />
                  </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-sm text-gray-400 mb-1">Type</label>
                    <select 
                        className="w-full bg-gym-dark border border-gray-600 rounded p-2 text-white outline-none"
                        value={formData.type}
                        onChange={e => setFormData({...formData, type: e.target.value as any})}
                    >
                        <option value="RDV">Rendez-vous</option>
                        <option value="LIVRAISON">Livraison</option>
                        <option value="AUTRE">Autre</option>
                    </select>
                 </div>
                 <div>
                    <label className="block text-sm text-gray-400 mb-1">Alerte</label>
                    <div className="flex items-center h-full">
                        <label className="flex items-center space-x-2 cursor-pointer">
                            <input 
                                type="checkbox"
                                checked={formData.alert}
                                onChange={e => setFormData({...formData, alert: e.target.checked})}
                                className="w-5 h-5 rounded border-gray-600 bg-gray-800 text-gym-yellow focus:ring-gym-yellow"
                            />
                            <span className="text-sm text-gray-300">Activer notif</span>
                        </label>
                    </div>
                 </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Lieu (Optionnel)</label>
                <div className="relative">
                    <MapPin className="absolute left-3 top-2.5 text-gray-500" size={16} />
                    <input 
                        type="text" 
                        className="w-full bg-gym-dark border border-gray-600 rounded pl-10 pr-4 py-2 text-white focus:border-gym-yellow outline-none"
                        value={formData.location}
                        onChange={e => setFormData({...formData, location: e.target.value})}
                        placeholder="Ex: Club Paris 12"
                    />
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Description</label>
                <textarea 
                  rows={3}
                  className="w-full bg-gym-dark border border-gray-600 rounded p-2 text-white focus:border-gym-yellow outline-none"
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  placeholder="Détails supplémentaires..."
                />
              </div>

              <div className="pt-4 flex gap-3 border-t border-gray-700">
                {isEditing && (
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

export default GeneralPlanning;
