
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
    if (isEditing && formData.id) onEditEvent(formData as PlanningEvent);
    else onAddEvent(formData);
    setShowModal(false);
  };

  const handleDelete = () => {
    if (formData.id && window.confirm("Supprimer cet événement du planning ?")) {
      onDeleteEvent(formData.id);
      setShowModal(false);
    }
  };

  const getEventTypeStyle = (type: string) => {
    switch (type) {
        case 'RDV': return { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-800', badge: 'bg-blue-600 text-white', icon: Users };
        case 'LIVRAISON': return { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-800', badge: 'bg-green-600 text-white', icon: Truck };
        default: return { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-800', badge: 'bg-gray-600 text-white', icon: MoreHorizontal };
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center bg-brand-light p-4 rounded-lg shadow-lg">
        <div className="flex items-center gap-3 mb-4 md:mb-0">
          <CalendarIcon className="text-brand-yellow" size={24} />
          <div>
             <h2 className="text-xl font-bold text-white capitalize">Planning Général</h2>
             <p className="text-xs text-gray-300 capitalize font-medium">{new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(currentDate)}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={handleOpenCreate} className="hidden md:flex bg-brand-yellow text-brand-dark font-black uppercase tracking-tight px-4 py-2 rounded-lg items-center gap-2 hover:bg-yellow-400 transition shadow-lg shadow-brand-yellow/10"><Plus size={18} /> Ajouter événement</button>
          <div className="flex bg-brand-dark rounded-lg p-1 border border-brand-light/20">
            <button onClick={handlePrevWeek} className="p-2 hover:bg-gray-700 rounded-lg text-gray-300"><ChevronLeft size={20} /></button>
            <button onClick={handleToday} className="px-4 py-2 text-sm font-bold text-white hover:bg-gray-700 rounded-lg transition-all">Aujourd'hui</button>
            <button onClick={handleNextWeek} className="p-2 hover:bg-gray-700 rounded-lg text-gray-300"><ChevronRight size={20} /></button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
        {weekDays.map((day, index) => {
          const dateKey = formatDateKey(day);
          const dayEvents = events.filter(e => e.date === dateKey && !e.deleted).sort((a,b) => a.startTime.localeCompare(b.startTime));
          const isCurrentDay = isToday(day);
          return (
            <div key={index} className={`min-h-[220px] rounded-xl border flex flex-col transition-all duration-300 ${isCurrentDay ? 'bg-brand-light border-brand-yellow shadow-xl' : 'bg-brand-light/40 border-gray-700 hover:border-gray-500'}`}>
              <div className={`p-4 border-b ${isCurrentDay ? 'border-brand-yellow/30 bg-brand-yellow/5' : 'border-gray-700'}`}>
                <p className={`text-[10px] font-black uppercase mb-1 tracking-widest ${isCurrentDay ? 'text-brand-yellow' : 'text-gray-400'}`}>{new Intl.DateTimeFormat('fr-FR', { weekday: 'short' }).format(day)}</p>
                <p className="text-xl font-black text-white">{new Intl.DateTimeFormat('fr-FR', { day: 'numeric' }).format(day)}</p>
              </div>
              <div className="p-2 space-y-2 flex-1 overflow-y-auto custom-scrollbar">
                {dayEvents.map(event => {
                    const style = getEventTypeStyle(event.type);
                    return (
                        <div key={event.id} onClick={(e) => handleOpenEdit(event, e)} className={`${style.bg} border ${style.border} p-2.5 rounded-lg hover:shadow-md transition-all cursor-pointer group animate-fade-in-up`}>
                            <div className="flex justify-between items-start mb-1.5"><span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${style.badge}`}>{event.startTime}</span>{event.alert && <Bell size={12} className="text-orange-500 animate-pulse" />}</div>
                            <div className={`font-bold text-[11px] ${style.text} leading-tight line-clamp-2 uppercase`}>{event.title}</div>
                        </div>
                    );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-fade-in-up">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50">
              <h2 className="text-xl font-black text-black uppercase tracking-tight">Modifier Événement</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-black transition-colors"><X size={24} /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="space-y-1">
                <label className="block text-xs font-black text-black uppercase tracking-widest">Titre de l'événement</label>
                <input type="text" required className="w-full bg-gray-50 border border-gray-300 rounded-xl p-4 text-black font-black outline-none focus:ring-2 focus:ring-brand-yellow transition-all" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="Ex: Livraison FP Comboire" />
              </div>

              <div className="grid grid-cols-2 gap-5">
                  <div className="space-y-1">
                    <label className="block text-xs font-black text-black uppercase tracking-widest">Date</label>
                    <input type="date" required className="w-full bg-gray-50 border border-gray-300 rounded-xl p-4 text-black font-black outline-none" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-black text-black uppercase tracking-widest">Heure</label>
                    <input type="time" required className="w-full bg-gray-50 border border-gray-300 rounded-xl p-4 text-black font-black outline-none" value={formData.startTime} onChange={e => setFormData({...formData, startTime: e.target.value})} />
                  </div>
              </div>

              <div className="grid grid-cols-2 gap-5">
                 <div className="space-y-1">
                    <label className="block text-xs font-black text-black uppercase tracking-widest">Type</label>
                    <select className="w-full bg-gray-50 border border-gray-300 rounded-xl p-4 text-black font-black outline-none" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as any})}>
                        <option value="RDV">Rendez-vous</option>
                        <option value="LIVRAISON">Livraison</option>
                        <option value="AUTRE">Autre</option>
                    </select>
                 </div>
                 <div className="flex items-center pt-6 px-2">
                    <label className="flex items-center space-x-3 cursor-pointer group">
                        <input type="checkbox" checked={formData.alert} onChange={e => setFormData({...formData, alert: e.target.checked})} className="w-6 h-6 rounded border-gray-300 text-brand-yellow focus:ring-brand-yellow" />
                        <span className="text-xs font-black text-black uppercase tracking-tighter">Alerte active</span>
                    </label>
                 </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-black text-black uppercase tracking-widest">Lieu</label>
                <div className="relative group">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-brand-yellow" size={18} />
                    <input type="text" className="w-full bg-gray-50 border border-gray-300 rounded-xl pl-12 pr-4 py-4 text-black font-black outline-none focus:ring-2 focus:ring-brand-yellow transition-all" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} placeholder="Ex: Club Meylan" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-black text-black uppercase tracking-widest">Notes / Description</label>
                <textarea rows={3} className="w-full bg-gray-50 border border-gray-300 rounded-xl p-4 text-black font-bold outline-none focus:ring-2 focus:ring-brand-yellow" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Notes importantes..." />
              </div>

              <div className="pt-6 flex gap-4 border-t border-gray-100">
                {isEditing && (
                  <button type="button" onClick={handleDelete} className="p-4 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-all cursor-pointer"><Trash2 size={24} /></button>
                )}
                <button type="submit" className="flex-1 bg-brand-yellow text-brand-dark font-black uppercase tracking-tight py-4 rounded-xl hover:bg-yellow-400 transition-all shadow-xl shadow-brand-yellow/20 cursor-pointer">
                  {isEditing ? 'Mettre à jour' : 'Confirmer le planning'}
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
