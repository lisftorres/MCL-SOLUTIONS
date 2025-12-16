
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
  
  // Filtrer les clubs accessibles
  // MODIFICATION: Technicien voit tout comme l'admin
  const allowedClubs = (user.role === UserRole.ADMIN || user.role === UserRole.TECHNICIAN)
    ? clubs 
    : clubs.filter(c => user.clubIds.includes(c.id));
  const allowedClubIds = allowedClubs.map(c => c.id);

  // Filtrer les checks accessibles
  const filteredChecks = checks.filter(c => allowedClubIds.includes(c.clubId));

  // Modal State
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

  // History Modal State
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedCheckForHistory, setSelectedCheckForHistory] = useState<PeriodicCheck | null>(null);

  // Delete Confirmation State
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [checkToDelete, setCheckToDelete] = useState<string | null>(null);

  // Status visual helpers
  const getStatusStyle = (status: CheckStatus) => {
    switch (status) {
      case CheckStatus.UPCOMING: return { color: 'text-blue-400', border: 'border-blue-500/30', bg: 'bg-blue-500/10' };
      case CheckStatus.WARNING_MONTH: return { color: 'text-yellow-400', border: 'border-yellow-500/30', bg: 'bg-yellow-500/10' };
      case CheckStatus.WARNING_WEEK: return { color: 'text-orange-500', border: 'border-orange-500/30', bg: 'bg-orange-500/10' };
      case CheckStatus.LATE: return { color: 'text-red-500', border: 'border-red-500/30', bg: 'bg-red-500/10' };
      case CheckStatus.COMPLETED: return { color: 'text-green-500', border: 'border-green-500/30', bg: 'bg-green-500/10' };
      default: return { color: 'text-gray-400', border: 'border-gray-600', bg: 'bg-gray-800' };
    }
  };

  // Calendar Helpers
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    const day = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    return day === 0 ? 6 : day - 1; // Adjust for Monday start (0=Mon, 6=Sun)
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

    // Determine new status automatically if all checked
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
      nextDueDate: check.nextDueDate.split('T')[0] // Format for input date
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

  // Render Calendar Cell
  const renderCalendarCell = (day: number) => {
    const cellDateStr = new Date(calendarDate.getFullYear(), calendarDate.getMonth(), day).toISOString().split('T')[0];
    
    // 1. Prochaines échéances
    const dueChecks = filteredChecks.filter(c => c.nextDueDate.split('T')[0] === cellDateStr);
    
    // 2. Historique (Vérifications passées)
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
            
            {/* Future/Due */}
            {dueChecks.map(check => (
                <div 
                   key={`due-${check.id}`}
                   onClick={(e) => handleOpenEdit(check, e)}
                   className={`text-[10px] p-1 rounded border truncate cursor-pointer hover:opacity-80 ${
                       check.status === CheckStatus.LATE ? 'bg-red-500/20 border-red-500 text-red-200' : 
                       check.status === CheckStatus.WARNING_WEEK ? 'bg-orange-500/20 border-orange-500 text-orange-200' :
                       'bg-blue-500/20 border-blue-500 text-blue-200'
                   }`}
                   title={`${check.title} - ${check.status}`}
                >
                    <Clock size={8} className="inline mr-1" />
                    {check.title}
                </div>
            ))}

            {/* History */}
            {historyEvents.map((item, idx) => (
                <div 
                   key={`hist-${idx}`}
                   onClick={(e) => handleOpenHistory(item.check, e)}
                   className="text-[10px] p-1 rounded border truncate cursor-pointer hover:opacity-80 bg-green-500/20 border-green-500 text-green-200"
                   title={`Effectué par ${item.log.technicianName}`}
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
      
      {/* Header Actions */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-gym-light p-4 rounded-lg">
        <h2 className="text-xl font-bold text-white">Vérifications Périodiques</h2>
        
        <div className="flex gap-4 items-center">
            {/* View Toggle */}
            <div className="flex bg-gym-dark rounded-lg p-1 border border-gray-600">
                <button 
                  onClick={() => setViewMode('LIST')}
                  className={`p-2 rounded transition ${viewMode === 'LIST' ? 'bg-gym-yellow text-gym-dark' : 'text-gray-400 hover:text-white'}`}
                  title="Vue Liste"
                >
                    <List size={20} />
                </button>
                <button 
                  onClick={() => setViewMode('CALENDAR')}
                  className={`p-2 rounded transition ${viewMode === 'CALENDAR' ? 'bg-gym-yellow text-gym-dark' : 'text-gray-400 hover:text-white'}`}
                  title="Vue Calendrier"
                >
                    <Calendar size={20} />
                </button>
            </div>

            {user.role === UserRole.ADMIN && (
            <button 
                onClick={handleOpenCreate}
                className="bg-gym-yellow text-gym-dark font-bold px-4 py-2 rounded flex items-center gap-2 hover:bg-yellow-400 transition"
            >
                <Plus size={18} />
                <span className="hidden md:inline">Ajouter</span>
            </button>
            )}
        </div>
      </div>

      {/* VIEW: CALENDAR */}
      {viewMode === 'CALENDAR' && (
          <div className="bg-gym-light rounded-xl border border-gray-700 shadow-lg p-4 animate-fade-in">
              <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-white capitalize flex items-center gap-2">
                      <Calendar className="text-gym-yellow" />
                      {new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(calendarDate)}
                  </h3>
                  <div className="flex bg-gym-dark rounded p-1">
                      <button onClick={handlePrevMonth} className="p-2 hover:bg-gray-700 rounded text-white"><ChevronLeft size={20}/></button>
                      <button onClick={() => setCalendarDate(new Date())} className="px-3 text-sm font-bold text-white hover:bg-gray-700 rounded">Aujourd'hui</button>
                      <button onClick={handleNextMonth} className="p-2 hover:bg-gray-700 rounded text-white"><ChevronRight size={20}/></button>
                  </div>
              </div>

              {/* Legend */}
              <div className="flex gap-4 mb-4 text-xs text-gray-400">
                  <div className="flex items-center gap-1"><div className="w-3 h-3 bg-blue-500/50 rounded"></div> A venir</div>
                  <div className="flex items-center gap-1"><div className="w-3 h-3 bg-red-500/50 rounded"></div> En retard</div>
                  <div className="flex items-center gap-1"><div className="w-3 h-3 bg-green-500/50 rounded"></div> Validé (Historique)</div>
              </div>

              <div className="grid grid-cols-7 gap-px bg-gray-700 border border-gray-700 rounded overflow-hidden">
                  {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(day => (
                      <div key={day} className="bg-gym-darker p-2 text-center text-sm font-bold text-gray-400 uppercase">
                          {day}
                      </div>
                  ))}
                  
                  {/* Empty cells for offset */}
                  {Array.from({ length: getFirstDayOfMonth(calendarDate) }).map((_, i) => (
                      <div key={`empty-${i}`} className="bg-gym-dark/50 min-h-[100px]"></div>
                  ))}

                  {/* Days */}
                  {Array.from({ length: getDaysInMonth(calendarDate) }).map((_, i) => (
                      <div key={i + 1} className="bg-gym-dark hover:bg-white/5 transition border-t border-l border-gray-700/50">
                          {renderCalendarCell(i + 1)}
                      </div>
                  ))}
              </div>
          </div>
      )}

      {/* VIEW: LIST (Original) */}
      {viewMode === 'LIST' && (
      <div className="space-y-4 animate-fade-in">
        {filteredChecks.map(check => {
          const style = getStatusStyle(check.status);
          const isExpanded = expandedId === check.id;
          const progress = Math.round((check.checklistItems.filter(i => i.checked).length / check.checklistItems.length) * 100);

          return (
            <div key={check.id} className={`bg-gym-light rounded-lg border ${style.border} overflow-hidden transition-all duration-300`}>
              
              {/* Header / Summary */}
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

              {/* Expanded Checklist */}
              {isExpanded && (
                <div className="bg-gym-darker p-4 border-t border-gray-700 animate-fade-in">
                  
                  {/* Action Buttons (Edit/Delete/History) */}
                  <div className="flex justify-end gap-2 mb-4">
                    <button 
                      onClick={(e) => handleOpenHistory(check, e)}
                      className="flex items-center gap-1 text-sm text-gray-300 hover:text-white px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded border border-gray-600"
                    >
                      <History size={14} /> Historique
                    </button>
                    {user.role === UserRole.ADMIN && (
                      <>
                        <button 
                          onClick={(e) => handleOpenEdit(check, e)}
                          className="flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300 px-3 py-1 bg-blue-500/10 rounded border border-blue-500/20"
                        >
                          <Edit2 size={14} /> Modifier
                        </button>
                        <button 
                          onClick={(e) => handleDeleteClick(check.id, e)}
                          className="flex items-center gap-1 text-sm text-red-400 hover:text-red-300 px-3 py-1 bg-red-500/10 rounded border border-red-500/20"
                        >
                          <Trash2 size={14} /> Supprimer
                        </button>
                      </>
                    )}
                  </div>

                  {/* CALENDAR SECTION */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                      {/* Last Visit Card */}
                      <div className="bg-gym-dark p-3 rounded-lg border border-gray-600 flex items-center space-x-4 relative overflow-hidden group">
                        <div className="absolute right-0 top-0 opacity-10 transform translate-x-2 -translate-y-2">
                            <History size={64} />
                        </div>
                        <div className="bg-gray-700 p-3 rounded-lg text-gray-300 z-10">
                            <History size={20} />
                        </div>
                        <div className="z-10">
                            <p className="text-xs text-gray-400 uppercase font-semibold mb-0.5">Dernière visite</p>
                            <p className="text-base font-bold text-white">
                              {check.lastChecked 
                                  ? new Date(check.lastChecked).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) 
                                  : <span className="text-gray-500 italic">Jamais effectuée</span>
                              }
                            </p>
                        </div>
                      </div>

                      {/* Next Visit Card */}
                      <div className={`bg-gym-dark p-3 rounded-lg border flex items-center space-x-4 relative overflow-hidden ${check.status === CheckStatus.LATE ? 'border-red-500/50' : 'border-gray-600'}`}>
                        <div className={`absolute right-0 top-0 opacity-10 transform translate-x-2 -translate-y-2 ${check.status === CheckStatus.LATE ? 'text-red-500' : 'text-gym-yellow'}`}>
                            <Calendar size={64} />
                        </div>
                        <div className={`p-3 rounded-lg z-10 ${check.status === CheckStatus.LATE ? 'bg-red-500/20 text-red-500' : 'bg-gym-yellow/20 text-gym-yellow'}`}>
                            <Clock size={20} />
                        </div>
                        <div className="z-10">
                            <p className="text-xs text-gray-400 uppercase font-semibold mb-0.5">Prochaine visite</p>
                            <p className={`text-base font-bold ${check.status === CheckStatus.LATE ? 'text-red-400' : 'text-white'}`}>
                              {new Date(check.nextDueDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </p>
                        </div>
                      </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                        <span>Progression de la checklist</span>
                        <span>{progress}%</span>
                    </div>
                    <div className="w-full bg-gray-700 h-2 rounded-full overflow-hidden">
                        <div className="h-full bg-gym-yellow transition-all duration-500" style={{ width: `${progress}%` }}></div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {check.checklistItems.map((item, idx) => (
                      <label key={idx} className="flex items-center space-x-3 p-3 bg-gym-dark rounded cursor-pointer hover:bg-gray-700 transition">
                        <input 
                          type="checkbox" 
                          checked={item.checked} 
                          onChange={() => handleToggleItem(check.id, item.label)}
                          disabled={user.role === UserRole.TECHNICIAN && false} // Hack to keep enabled for everyone with access
                          className="w-5 h-5 rounded border-gray-600 bg-gray-800 text-gym-yellow focus:ring-gym-yellow"
                        />
                        <span className={`${item.checked ? 'text-gray-500 line-through' : 'text-gray-200'}`}>
                          {item.label}
                        </span>
                      </label>
                    ))}
                  </div>

                  {check.status === CheckStatus.COMPLETED && (
                    <div className="mt-4 flex items-center gap-2 text-green-500 text-sm bg-green-900/20 p-2 rounded justify-center border border-green-900/50">
                      <Save size={16} />
                      <span>Vérification validée et archivée</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
      )}

      {/* Modal for Create/Edit */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-gym-light w-full max-w-2xl rounded-xl shadow-2xl border border-gray-600 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-700 sticky top-0 bg-gym-light z-10">
              <h2 className="text-xl font-bold text-white">{isEditing ? 'Modifier la vérification' : 'Programmer une vérification'}</h2>
              <button onClick={() => setShowModal(false)}><X className="text-gray-400 hover:text-white" /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-sm text-gray-400 mb-1">Titre de la vérification</label>
                  <input 
                    type="text" 
                    required
                    className="w-full bg-gym-dark border border-gray-600 rounded p-2 text-white focus:border-gym-yellow outline-none"
                    value={formData.title}
                    onChange={e => setFormData({...formData, title: e.target.value})}
                    placeholder="Ex: Contrôle Extincteurs"
                  />
                </div>
                
                <div>
                   <label className="block text-sm text-gray-400 mb-1">Club</label>
                   <select 
                     className="w-full bg-gym-dark border border-gray-600 rounded p-2 text-white outline-none"
                     value={formData.clubId}
                     onChange={e => setFormData({...formData, clubId: e.target.value})}
                   >
                      {allowedClubs.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                   </select>
                </div>
                <div>
                   <label className="block text-sm text-gray-400 mb-1">Espace</label>
                   <input 
                    type="text"
                    required 
                    className="w-full bg-gym-dark border border-gray-600 rounded p-2 text-white outline-none"
                    value={formData.space}
                    onChange={e => setFormData({...formData, space: e.target.value})}
                    placeholder="Ex: Local TGBT"
                   />
                </div>

                <div>
                   <label className="block text-sm text-gray-400 mb-1">Métier</label>
                   <select 
                     className="w-full bg-gym-dark border border-gray-600 rounded p-2 text-white outline-none"
                     value={formData.trade}
                     onChange={e => setFormData({...formData, trade: e.target.value as TradeType})}
                   >
                      {Object.values(TradeType).map(t => <option key={t} value={t}>{t}</option>)}
                   </select>
                </div>
                <div>
                   <label className="block text-sm text-gray-400 mb-1">Fréquence (Mois)</label>
                   <input 
                    type="number" 
                    min="1"
                    className="w-full bg-gym-dark border border-gray-600 rounded p-2 text-white outline-none"
                    value={formData.frequencyMonths}
                    onChange={e => setFormData({...formData, frequencyMonths: parseInt(e.target.value)})}
                   />
                </div>
                <div>
                   <label className="block text-sm text-gray-400 mb-1">Prochaine échéance</label>
                   <input 
                    type="date"
                    required 
                    className="w-full bg-gym-dark border border-gray-600 rounded p-2 text-white outline-none"
                    value={formData.nextDueDate ? String(formData.nextDueDate).split('T')[0] : ''}
                    onChange={e => setFormData({...formData, nextDueDate: e.target.value})}
                   />
                </div>
              </div>

              {/* Checklist Builder */}
              <div className="border-t border-gray-700 pt-4 mt-4">
                 <div className="flex justify-between items-center mb-2">
                    <label className="text-sm text-gray-400">Points de contrôle (Checklist)</label>
                    <button type="button" onClick={handleAddChecklistItem} className="text-xs text-gym-yellow hover:underline flex items-center gap-1">
                       <Plus size={12} /> Ajouter un point
                    </button>
                 </div>
                 <div className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                    {formData.checklistItems?.map((item, idx) => (
                       <div key={idx} className="flex gap-2">
                          <input 
                             type="text"
                             className="flex-1 bg-gym-dark border border-gray-600 rounded p-1.5 text-sm text-white outline-none"
                             value={item.label}
                             onChange={(e) => handleUpdateChecklistItem(idx, e.target.value)}
                             placeholder={`Point de contrôle ${idx + 1}`}
                          />
                          <button 
                             type="button" 
                             onClick={() => handleRemoveChecklistItem(idx)}
                             className="text-red-400 hover:text-red-300 p-1"
                          >
                             <Trash2 size={16} />
                          </button>
                       </div>
                    ))}
                 </div>
              </div>

              <div className="pt-4 flex gap-4">
                <button 
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-transparent border border-gray-600 text-gray-300 py-3 rounded hover:bg-gray-800 transition"
                >
                  Annuler
                </button>
                <button 
                  type="submit"
                  className="flex-1 bg-gym-yellow text-gym-dark font-bold py-3 rounded hover:bg-yellow-400 transition"
                >
                  {isEditing ? 'Sauvegarder les modifications' : 'Créer la vérification'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-gym-light w-full max-w-md rounded-xl shadow-2xl border border-gray-600 p-6 animate-fade-in">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/20">
                <AlertTriangle className="text-red-500" size={32} />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Confirmer la suppression</h3>
              <p className="text-gray-400 text-sm">
                Êtes-vous sûr de vouloir supprimer définitivement cette vérification programmée ? Cette action est irréversible et supprimera également l'historique associé.
              </p>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 bg-transparent border border-gray-600 text-gray-300 py-2.5 rounded hover:bg-gray-800 transition"
              >
                Annuler
              </button>
              <button 
                onClick={confirmDelete}
                className="flex-1 bg-red-500 text-white font-bold py-2.5 rounded hover:bg-red-600 transition shadow-lg shadow-red-500/20"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      {showHistoryModal && selectedCheckForHistory && (
         <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
            <div className="bg-gym-light w-full max-w-lg rounded-xl shadow-2xl border border-gray-600 max-h-[80vh] flex flex-col">
               <div className="flex justify-between items-center p-4 border-b border-gray-700 bg-gym-darker rounded-t-xl">
                  <div>
                    <h3 className="text-lg font-bold text-white">Historique des contrôles</h3>
                    <p className="text-xs text-gray-400">{selectedCheckForHistory.title}</p>
                  </div>
                  <button onClick={() => setShowHistoryModal(false)}><X className="text-gray-400 hover:text-white" /></button>
               </div>
               
               <div className="p-6 overflow-y-auto custom-scrollbar">
                  {(!selectedCheckForHistory.history || selectedCheckForHistory.history.length === 0) ? (
                    <div className="text-center py-8 text-gray-500 flex flex-col items-center">
                        <History size={40} className="mb-2 opacity-50" />
                        <p>Aucun historique disponible pour cet équipement.</p>
                    </div>
                  ) : (
                    <div className="relative border-l-2 border-gray-700 ml-3 space-y-8">
                      {selectedCheckForHistory.history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((log, idx) => (
                        <div key={idx} className="relative pl-6">
                           {/* Timeline Dot */}
                           <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 border-gym-light ${log.status === CheckStatus.COMPLETED ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                           
                           <div className="flex flex-col gap-1">
                              <span className="text-sm font-mono text-gym-yellow font-bold">
                                {new Date(log.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                              </span>
                              <div className="flex items-center gap-2">
                                <span className={`text-xs px-2 py-0.5 rounded ${log.status === CheckStatus.COMPLETED ? 'bg-green-500/20 text-green-400' : 'bg-gray-700 text-gray-300'}`}>
                                  {log.status === CheckStatus.COMPLETED ? 'Validé' : log.status}
                                </span>
                                <span className="text-xs text-gray-400 flex items-center gap-1">
                                  <UserIcon size={10} /> {log.technicianName}
                                </span>
                              </div>
                              {log.notes && (
                                <div className="mt-2 bg-gym-dark p-2 rounded text-xs text-gray-300 italic flex gap-2">
                                  <FileText size={12} className="shrink-0 mt-0.5" />
                                  <p>{log.notes}</p>
                                </div>
                              )}
                           </div>
                        </div>
                      ))}
                    </div>
                  )}
               </div>
               
               <div className="p-4 border-t border-gray-700 bg-gym-light rounded-b-xl">
                 <button 
                   onClick={() => setShowHistoryModal(false)}
                   className="w-full bg-gray-700 text-white py-2 rounded hover:bg-gray-600 transition"
                 >
                   Fermer
                 </button>
               </div>
            </div>
         </div>
      )}
    </div>
  );
};

export default CheckManager;
