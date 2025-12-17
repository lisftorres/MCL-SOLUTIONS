
import React, { useState } from 'react';
import { PeriodicCheck, CheckStatus, UserRole, User, Club, TradeType } from '../types';
import { Calendar, CheckSquare, AlertOctagon, ChevronDown, ChevronUp, Save, History, Clock, Plus, Edit2, Trash2, X, User as UserIcon, FileText, AlertTriangle, LayoutGrid, List, ChevronLeft, ChevronRight } from 'lucide-react';

interface CheckManagerProps {
  checks: PeriodicCheck[];
  clubs: Club[];
  user: User;
  onUpdateCheck: (checkId: string, items: {label: string, checked: boolean}[], status: CheckStatus) => void;
  onCreateCheck: (check: Partial<PeriodicCheck>) => void;
  onEditCheck: (check: PeriodicCheck) => void;
  onDeleteCheck: (checkId: string) => void;
}

const CheckManager: React.FC<CheckManagerProps> = ({ checks, clubs, user, onUpdateCheck, onCreateCheck, onEditCheck, onDeleteCheck }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'LIST' | 'CALENDAR'>('LIST');
  const [calendarDate, setCalendarDate] = useState(new Date());
  
  const allowedClubs = (user.role === UserRole.ADMIN || user.role === UserRole.TECHNICIAN)
    ? clubs 
    : clubs.filter(c => user.clubIds.includes(c.id));
  const allowedClubIds = allowedClubs.map(c => c.id);

  const filteredChecks = checks.filter(c => allowedClubIds.includes(c.clubId) && !c.deleted);

  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<PeriodicCheck>>({
    title: '',
    clubId: allowedClubs[0]?.id || '',
    space: '',
    trade: TradeType.ELECTRICITY,
    frequencyMonths: 1,
    nextDueDate: new Date().toISOString().split('T')[0],
    checklistItems: [{ label: 'Vérification générale', checked: false }]
  });

  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedCheckForHistory, setSelectedCheckForHistory] = useState<PeriodicCheck | null>(null);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [checkToDelete, setCheckToDelete] = useState<string | null>(null);

  const getStatusStyle = (status: CheckStatus) => {
    switch (status) {
      case CheckStatus.UPCOMING: return { color: 'text-blue-500', border: 'border-blue-500/30', bg: 'bg-blue-500/10' };
      case CheckStatus.WARNING_MONTH: return { color: 'text-yellow-600', border: 'border-yellow-500/30', bg: 'bg-yellow-500/10' };
      case CheckStatus.WARNING_WEEK: return { color: 'text-orange-500', border: 'border-orange-500/30', bg: 'bg-orange-500/10' };
      case CheckStatus.LATE: return { color: 'text-red-600', border: 'border-red-500/30', bg: 'bg-red-500/10' };
      case CheckStatus.COMPLETED: return { color: 'text-green-600', border: 'border-green-500/30', bg: 'bg-green-500/10' };
      default: return { color: 'text-gray-400', border: 'border-gray-600', bg: 'bg-gray-800' };
    }
  };

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    const day = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    return day === 0 ? 6 : day - 1; 
  };

  const handlePrevMonth = () => {
    setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1));
  };

  const handleToggleItem = (checkId: string, itemLabel: string) => {
    if (user.role !== UserRole.TECHNICIAN && user.role !== UserRole.ADMIN && user.role !== UserRole.MANAGER) return;
    
    const check = checks.find(c => c.id === checkId);
    if (!check) return;

    const newItems = check.checklistItems.map(item => 
      item.label === itemLabel ? { ...item, checked: !item.checked } : item
    );

    const allChecked = newItems.every(i => i.checked);
    const newStatus = allChecked ? CheckStatus.COMPLETED : check.status === CheckStatus.COMPLETED ? CheckStatus.UPCOMING : check.status;

    onUpdateCheck(checkId, newItems, newStatus);
  };

  const handleOpenCreate = () => {
    setIsEditing(false);
    setFormData({
      title: '',
      clubId: allowedClubs[0]?.id || '',
      space: '',
      trade: TradeType.ELECTRICITY,
      frequencyMonths: 1,
      nextDueDate: new Date().toISOString().split('T')[0],
      checklistItems: [{ label: 'Point de contrôle 1', checked: false }]
    });
    setShowModal(true);
  };

  const handleOpenEdit = (check: PeriodicCheck, e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
    setFormData({
      ...check,
      nextDueDate: check.nextDueDate.split('T')[0] 
    });
    setShowModal(true);
  };

  const handleOpenHistory = (check: PeriodicCheck, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedCheckForHistory(check);
    setShowHistoryModal(true);
  };

  const handleDeleteClick = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCheckToDelete(id);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    if (checkToDelete) {
      onDeleteCheck(checkToDelete);
      setShowDeleteConfirm(false);
      setCheckToDelete(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditing && formData.id) {
      onEditCheck(formData as PeriodicCheck);
    } else {
      onCreateCheck(formData);
    }
    setShowModal(false);
  };

  const handleAddChecklistItem = () => {
    setFormData(prev => ({
      ...prev,
      checklistItems: [...(prev.checklistItems || []), { label: '', checked: false }]
    }));
  };

  const handleUpdateChecklistItem = (index: number, text: string) => {
    const newItems = [...(formData.checklistItems || [])];
    newItems[index].label = text;
    setFormData(prev => ({ ...prev, checklistItems: newItems }));
  };

  const handleRemoveChecklistItem = (index: number) => {
     const newItems = [...(formData.checklistItems || [])];
     newItems.splice(index, 1);
     setFormData(prev => ({ ...prev, checklistItems: newItems }));
  };

  const renderCalendarCell = (day: number) => {
    const cellDateStr = new Date(calendarDate.getFullYear(), calendarDate.getMonth(), day).toISOString().split('T')[0];
    const dueChecks = filteredChecks.filter(c => c.nextDueDate.split('T')[0] === cellDateStr);
    const historyEvents: { check: PeriodicCheck, log: any }[] = [];
    filteredChecks.forEach(c => {
        c.history?.forEach(h => {
            if (h.date.split('T')[0] === cellDateStr) {
                historyEvents.push({ check: c, log: h });
            }
        });
    });

    return (
        <div className="h-full min-h-[100px] p-1 flex flex-col gap-1 overflow-y-auto custom-scrollbar">
            <span className="text-gray-500 font-bold text-sm mb-1">{day}</span>
            {dueChecks.map(check => (
                <div 
                   key={`due-${check.id}`}
                   onClick={(e) => handleOpenEdit(check, e)}
                   className={`text-[10px] p-1 rounded border truncate cursor-pointer hover:opacity-80 font-bold ${
                       check.status === CheckStatus.LATE ? 'bg-red-500 text-white' : 
                       check.status === CheckStatus.WARNING_WEEK ? 'bg-orange-500 text-white' :
                       'bg-blue-500 text-white'
                   }`}
                >
                    {check.title}
                </div>
            ))}
            {historyEvents.map((item, idx) => (
                <div 
                   key={`hist-${idx}`}
                   onClick={(e) => handleOpenHistory(item.check, e)}
                   className="text-[10px] p-1 rounded border truncate cursor-pointer hover:opacity-80 bg-green-100 border-green-300 text-green-800 font-bold"
                >
                    <CheckSquare size={8} className="inline mr-1" />
                    {item.check.title}
                </div>
            ))}
        </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-brand-light p-4 rounded-lg">
        <h2 className="text-xl font-bold text-white uppercase tracking-tight">Vérifications Périodiques</h2>
        <div className="flex gap-4 items-center">
            <div className="flex bg-brand-dark rounded-lg p-1 border border-brand-light">
                <button 
                  onClick={() => setViewMode('LIST')}
                  className={`p-2 rounded transition ${viewMode === 'LIST' ? 'bg-brand-yellow text-brand-dark' : 'text-gray-400 hover:text-white'}`}
                >
                    <List size={20} />
                </button>
                <button 
                  onClick={() => setViewMode('CALENDAR')}
                  className={`p-2 rounded transition ${viewMode === 'CALENDAR' ? 'bg-brand-yellow text-brand-dark' : 'text-gray-400 hover:text-white'}`}
                >
                    <Calendar size={20} />
                </button>
            </div>
            {user.role === UserRole.ADMIN && (
            <button 
                onClick={handleOpenCreate}
                className="bg-brand-yellow text-brand-dark font-black uppercase tracking-tight px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-yellow-400 transition shadow-lg"
            >
                <Plus size={18} />
                <span className="hidden md:inline">Ajouter</span>
            </button>
            )}
        </div>
      </div>

      {viewMode === 'CALENDAR' && (
          <div className="bg-brand-light rounded-xl border border-gray-700 shadow-lg p-4 animate-fade-in">
              <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-white capitalize flex items-center gap-2">
                      <Calendar className="text-brand-yellow" />
                      {new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(calendarDate)}
                  </h3>
                  <div className="flex bg-brand-dark rounded p-1">
                      <button onClick={handlePrevMonth} className="p-2 hover:bg-gray-700 rounded text-white"><ChevronLeft size={20}/></button>
                      <button onClick={() => setCalendarDate(new Date())} className="px-3 text-sm font-bold text-white hover:bg-gray-700 rounded">Aujourd'hui</button>
                      <button onClick={handleNextMonth} className="p-2 hover:bg-gray-700 rounded text-white"><ChevronRight size={20}/></button>
                  </div>
              </div>
              <div className="grid grid-cols-7 gap-px bg-gray-700 border border-gray-700 rounded overflow-hidden">
                  {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(day => (
                      <div key={day} className="bg-brand-darker p-2 text-center text-sm font-bold text-gray-400 uppercase">{day}</div>
                  ))}
                  {Array.from({ length: getFirstDayOfMonth(calendarDate) }).map((_, i) => (
                      <div key={`empty-${i}`} className="bg-brand-dark/50 min-h-[100px]"></div>
                  ))}
                  {Array.from({ length: getDaysInMonth(calendarDate) }).map((_, i) => (
                      <div key={i + 1} className="bg-brand-dark hover:bg-white/5 transition border-t border-l border-gray-700/50">
                          {renderCalendarCell(i + 1)}
                      </div>
                  ))}
              </div>
          </div>
      )}

      {viewMode === 'LIST' && (
      <div className="space-y-4 animate-fade-in">
        {filteredChecks.map(check => {
          const style = getStatusStyle(check.status);
          const isExpanded = expandedId === check.id;
          const progress = Math.round((check.checklistItems.filter(i => i.checked).length / check.checklistItems.length) * 100);

          return (
            <div key={check.id} className={`bg-brand-light rounded-lg border ${style.border} overflow-hidden transition-all duration-300`}>
              <div 
                className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/5"
                onClick={() => setExpandedId(isExpanded ? null : check.id)}
              >
                <div className="flex items-center space-x-4">
                  <div className={`p-2 rounded-full ${style.bg}`}>
                    {check.status === CheckStatus.LATE ? <AlertOctagon className={style.color} size={20} /> : <CheckSquare className={style.color} size={20} />}
                  </div>
                  <div>
                    <h4 className="font-bold text-white">{check.title}</h4>
                    <p className="text-sm text-gray-400">{check.space} • {check.trade}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right hidden sm:block">
                    <div className={`text-xs font-bold uppercase ${style.color}`}>{check.status.replace(/_/g, ' ')}</div>
                    <div className="text-xs text-gray-500 flex items-center justify-end gap-1">
                        <Calendar size={12}/> {new Date(check.nextDueDate).toLocaleDateString('fr-FR')}
                    </div>
                  </div>
                  {isExpanded ? <ChevronUp className="text-gray-400" /> : <ChevronDown className="text-gray-400" />}
                </div>
              </div>
              {isExpanded && (
                <div className="bg-brand-darker p-4 border-t border-gray-700 animate-fade-in">
                  <div className="flex justify-end gap-2 mb-4">
                    <button onClick={(e) => handleOpenHistory(check, e)} className="flex items-center gap-1 text-sm text-gray-300 hover:text-white px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded border border-gray-600">
                      <History size={14} /> Historique
                    </button>
                    {user.role === UserRole.ADMIN && (
                      <>
                        <button onClick={(e) => handleOpenEdit(check, e)} className="flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300 px-3 py-1 bg-blue-500/10 rounded border border-blue-500/20">
                          <Edit2 size={14} /> Modifier
                        </button>
                        <button onClick={(e) => handleDeleteClick(check.id, e)} className="flex items-center gap-1 text-sm text-red-400 hover:text-red-300 px-3 py-1 bg-red-500/10 rounded border border-red-500/20">
                          <Trash2 size={14} /> Supprimer
                        </button>
                      </>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                      <div className="bg-brand-dark p-3 rounded-lg border border-gray-600 flex items-center space-x-4">
                        <div className="bg-gray-700 p-3 rounded-lg text-gray-300"><History size={20} /></div>
                        <div>
                            <p className="text-xs text-gray-400 uppercase font-semibold mb-0.5">Dernière visite</p>
                            <p className="text-base font-bold text-white">{check.lastChecked ? new Date(check.lastChecked).toLocaleDateString('fr-FR') : 'Jamais'}</p>
                        </div>
                      </div>
                      <div className={`bg-brand-dark p-3 rounded-lg border flex items-center space-x-4 ${check.status === CheckStatus.LATE ? 'border-red-500/50' : 'border-gray-600'}`}>
                        <div className={`p-3 rounded-lg ${check.status === CheckStatus.LATE ? 'bg-red-500/20 text-red-500' : 'bg-brand-yellow/20 text-brand-yellow'}`}><Clock size={20} /></div>
                        <div>
                            <p className="text-xs text-gray-400 uppercase font-semibold mb-0.5">Prochaine visite</p>
                            <p className={`text-base font-bold ${check.status === CheckStatus.LATE ? 'text-red-400' : 'text-white'}`}>{new Date(check.nextDueDate).toLocaleDateString('fr-FR')}</p>
                        </div>
                      </div>
                  </div>
                  <div className="mb-4">
                    <div className="flex justify-between text-xs text-gray-400 mb-1"><span>Progression</span><span>{progress}%</span></div>
                    <div className="w-full bg-gray-700 h-2 rounded-full overflow-hidden"><div className="h-full bg-brand-yellow transition-all" style={{ width: `${progress}%` }}></div></div>
                  </div>
                  <div className="space-y-2">
                    {check.checklistItems.map((item, idx) => (
                      <label key={idx} className="flex items-center space-x-3 p-3 bg-brand-dark rounded cursor-pointer hover:bg-gray-700 transition">
                        <input type="checkbox" checked={item.checked} onChange={() => handleToggleItem(check.id, item.label)} className="w-5 h-5 rounded border-gray-600 bg-gray-800 text-brand-yellow" />
                        <span className={`${item.checked ? 'text-gray-500 line-through' : 'text-gray-200'}`}>{item.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl rounded-xl shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50 rounded-t-xl">
              <h2 className="text-xl font-black text-brand-dark uppercase tracking-tight">{isEditing ? 'Modifier la vérification' : 'Programmer une vérification'}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-brand-dark"><X size={24}/></button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="col-span-full space-y-1">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest">Titre de la vérification</label>
                  <input type="text" required className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-black font-bold focus:ring-2 focus:ring-brand-yellow outline-none" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="Ex: Contrôle Extincteurs"/>
                </div>
                <div className="space-y-1">
                   <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest">Club</label>
                   <select className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-black font-bold outline-none" value={formData.clubId} onChange={e => setFormData({...formData, clubId: e.target.value})}>
                      {allowedClubs.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                   </select>
                </div>
                <div className="space-y-1">
                   <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest">Espace</label>
                   <input type="text" required className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-black font-bold outline-none" value={formData.space} onChange={e => setFormData({...formData, space: e.target.value})} placeholder="Ex: Local TGBT"/>
                </div>
                <div className="space-y-1">
                   <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest">Métier</label>
                   <select className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-black font-bold outline-none" value={formData.trade} onChange={e => setFormData({...formData, trade: e.target.value as TradeType})}>
                      {Object.values(TradeType).map(t => <option key={t} value={t}>{t}</option>)}
                   </select>
                </div>
                <div className="space-y-1">
                   <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest">Fréquence (Mois)</label>
                   <input type="number" min="1" className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-black font-bold outline-none" value={formData.frequencyMonths} onChange={e => setFormData({...formData, frequencyMonths: parseInt(e.target.value)})}/>
                </div>
                <div className="space-y-1">
                   <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest">Prochaine échéance</label>
                   <input type="date" required className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-black font-bold outline-none" value={formData.nextDueDate ? String(formData.nextDueDate).split('T')[0] : ''} onChange={e => setFormData({...formData, nextDueDate: e.target.value})}/>
                </div>
              </div>
              <div className="border-t border-gray-100 pt-6">
                 <div className="flex justify-between items-center mb-4">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Points de contrôle</label>
                    <button type="button" onClick={handleAddChecklistItem} className="text-xs font-bold text-brand-yellow hover:text-brand-dark uppercase flex items-center gap-1 transition-colors"><Plus size={14} /> Ajouter un point</button>
                 </div>
                 <div className="space-y-3 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                    {formData.checklistItems?.map((item, idx) => (
                       <div key={idx} className="flex gap-2">
                          <input type="text" className="flex-1 bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-sm text-black font-bold outline-none" value={item.label} onChange={(e) => handleUpdateChecklistItem(idx, e.target.value)} placeholder={`Point n°${idx + 1}`}/>
                          <button type="button" onClick={() => handleRemoveChecklistItem(idx)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"><Trash2 size={18} /></button>
                       </div>
                    ))}
                 </div>
              </div>
              <div className="pt-4 flex gap-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-gray-100 text-gray-600 font-bold py-4 rounded-xl hover:bg-gray-200 transition-all">Annuler</button>
                <button type="submit" className="flex-1 bg-brand-yellow text-brand-dark font-black uppercase tracking-tight py-4 rounded-xl hover:bg-yellow-400 transition-all shadow-xl shadow-brand-yellow/20">{isEditing ? 'Enregistrer' : 'Créer'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-xl shadow-2xl p-8 animate-fade-in-up text-center">
            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6"><AlertTriangle className="text-red-500" size={40} /></div>
            <h3 className="text-2xl font-black text-brand-dark uppercase tracking-tight mb-3">Confirmation</h3>
            <p className="text-gray-600 font-medium mb-8 leading-relaxed">Voulez-vous vraiment supprimer définitivement cette vérification ?</p>
            <div className="flex gap-4">
              <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 bg-gray-100 text-gray-600 font-bold py-4 rounded-xl hover:bg-gray-200 transition-all">Annuler</button>
              <button onClick={confirmDelete} className="flex-1 bg-red-500 text-white font-black uppercase tracking-tight py-4 rounded-xl hover:bg-red-600 transition-all shadow-xl shadow-red-500/20">Supprimer</button>
            </div>
          </div>
        </div>
      )}

      {showHistoryModal && selectedCheckForHistory && (
         <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white w-full max-w-lg rounded-xl shadow-2xl flex flex-col max-h-[85vh]">
               <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50 rounded-t-xl">
                  <div><h3 className="text-xl font-black text-brand-dark uppercase tracking-tight">Historique des contrôles</h3><p className="text-xs text-gray-500 font-bold mt-1">{selectedCheckForHistory.title}</p></div>
                  <button onClick={() => setShowHistoryModal(false)} className="text-gray-400 hover:text-brand-dark"><X size={24} /></button>
               </div>
               <div className="p-8 overflow-y-auto custom-scrollbar">
                  {(!selectedCheckForHistory.history || selectedCheckForHistory.history.length === 0) ? (
                    <div className="text-center py-10 text-gray-400 flex flex-col items-center gap-4"><History size={48} className="opacity-20" /><p className="font-medium italic">Aucun historique pour cet équipement.</p></div>
                  ) : (
                    <div className="relative border-l-2 border-gray-100 ml-4 space-y-10">
                      {selectedCheckForHistory.history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((log, idx) => (
                        <div key={idx} className="relative pl-8">
                           <div className={`absolute -left-[11px] top-0 w-5 h-5 rounded-full border-4 border-white shadow-sm ${log.status === CheckStatus.COMPLETED ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                           <div className="flex flex-col gap-2">
                              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{new Date(log.date).toLocaleDateString('fr-FR')}</span>
                              <div className="flex items-center gap-3">
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-tighter ${log.status === CheckStatus.COMPLETED ? 'bg-green-50 text-green-600' : 'bg-gray-50 text-gray-500'}`}>{log.status === CheckStatus.COMPLETED ? 'Validé' : log.status}</span>
                                <span className="text-xs text-brand-dark font-bold flex items-center gap-1"><UserIcon size={12} className="text-gray-400" /> {log.technicianName}</span>
                              </div>
                              {log.notes && <div className="mt-2 bg-gray-50 p-3 rounded-lg border border-gray-100 text-sm text-gray-600 italic leading-relaxed">{log.notes}</div>}
                           </div>
                        </div>
                      ))}
                    </div>
                  )}
               </div>
               <div className="p-6 border-t border-gray-100 bg-gray-50 rounded-b-xl"><button onClick={() => setShowHistoryModal(false)} className="w-full bg-brand-dark text-white font-bold py-4 rounded-xl hover:bg-brand-darker transition-all shadow-lg">Fermer</button></div>
            </div>
         </div>
      )}
    </div>
  );
};

export default CheckManager;
