
import React, { useState } from 'react';
import { PeriodicCheck, CheckStatus, UserRole, User, Club, TradeType } from '../types';
import { Calendar, CheckSquare, AlertOctagon, ChevronDown, ChevronUp, History, Clock, Plus, Edit2, Trash2, X, User as UserIcon, AlertTriangle, List, ChevronLeft, ChevronRight } from 'lucide-react';

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

  const filteredChecks = checks.filter(c => allowedClubs.map(club => club.id).includes(c.clubId) && !c.deleted);

  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<PeriodicCheck>>({
    title: '',
    clubId: allowedClubs[0]?.id || '',
    space: '',
    trade: TradeType.ELECTRICITY,
    frequencyMonths: 1,
    nextDueDate: new Date().toISOString().split('T')[0],
    checklistItems: [{ label: 'Point de contrôle 1', checked: false }]
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

  const handleToggleItem = (checkId: string, itemLabel: string) => {
    if (user.role !== UserRole.TECHNICIAN && user.role !== UserRole.ADMIN && user.role !== UserRole.MANAGER) return;
    const check = checks.find(c => c.id === checkId);
    if (!check) return;
    const newItems = check.checklistItems.map(item => item.label === itemLabel ? { ...item, checked: !item.checked } : item);
    const allChecked = newItems.every(i => i.checked);
    const newStatus = allChecked ? CheckStatus.COMPLETED : check.status === CheckStatus.COMPLETED ? CheckStatus.UPCOMING : check.status;
    onUpdateCheck(checkId, newItems, newStatus);
  };

  const handleOpenCreate = () => {
    setIsEditing(false);
    setFormData({
      title: '',
      clubId: allowedClubs[0]?.id || '',
      space: allowedClubs[0]?.spaces[0] || '',
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
    setFormData({ ...check, nextDueDate: check.nextDueDate.split('T')[0] });
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditing && formData.id) onEditCheck(formData as PeriodicCheck);
    else onCreateCheck(formData);
    setShowModal(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-brand-light p-5 rounded-2xl border border-gray-700 shadow-2xl">
        <h2 className="text-xl font-black text-white uppercase tracking-tight">Vérifications Périodiques</h2>
        <div className="flex gap-4 items-center">
            <div className="flex bg-brand-dark rounded-xl p-1 border border-gray-700 shadow-inner">
                <button onClick={() => setViewMode('LIST')} className={`p-2.5 rounded-lg transition-all ${viewMode === 'LIST' ? 'bg-brand-yellow text-brand-dark shadow-md' : 'text-gray-400 hover:text-white'}`}><List size={20} /></button>
                <button onClick={() => setViewMode('CALENDAR')} className={`p-2.5 rounded-lg transition-all ${viewMode === 'CALENDAR' ? 'bg-brand-yellow text-brand-dark shadow-md' : 'text-gray-400 hover:text-white'}`}><Calendar size={20} /></button>
            </div>
            {user.role === UserRole.ADMIN && (
              <button onClick={handleOpenCreate} className="bg-brand-yellow text-brand-dark font-black uppercase tracking-tight px-5 py-2.5 rounded-xl flex items-center gap-2 hover:bg-yellow-400 transition shadow-xl shadow-brand-yellow/20"><Plus size={18} /> Ajouter</button>
            )}
        </div>
      </div>

      {viewMode === 'LIST' && (
        <div className="space-y-4">
          {filteredChecks.map(check => {
            const style = getStatusStyle(check.status);
            const isExpanded = expandedId === check.id;
            const progress = Math.round((check.checklistItems.filter(i => i.checked).length / check.checklistItems.length) * 100);
            return (
              <div key={check.id} className={`bg-brand-light rounded-2xl border ${style.border} overflow-hidden shadow-xl transition-all hover:border-brand-yellow/30`}>
                <div className="p-5 flex items-center justify-between cursor-pointer hover:bg-white/5" onClick={() => setExpandedId(isExpanded ? null : check.id)}>
                  <div className="flex items-center space-x-5">
                    <div className={`p-3 rounded-xl border ${style.bg} ${style.border}`}>
                      {check.status === CheckStatus.LATE ? <AlertOctagon className={style.color} size={24} /> : <CheckSquare className={style.color} size={24} />}
                    </div>
                    <div>
                      <h4 className="font-black text-white uppercase tracking-tight">{check.title}</h4>
                      <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">{check.space} • {check.trade}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-6">
                    <div className="text-right hidden sm:block">
                      <div className={`text-[10px] font-black uppercase tracking-widest mb-1 ${style.color}`}>{check.status.replace(/_/g, ' ')}</div>
                      <div className="text-xs text-gray-500 font-bold flex items-center justify-end gap-1"><Calendar size={12}/> {new Date(check.nextDueDate).toLocaleDateString('fr-FR')}</div>
                    </div>
                    {isExpanded ? <ChevronUp className="text-gray-400" /> : <ChevronDown className="text-gray-400" />}
                  </div>
                </div>
                {isExpanded && (
                  <div className="bg-brand-darker/40 p-6 border-t border-gray-700 animate-fade-in-up">
                    <div className="flex justify-end gap-2 mb-6">
                      <button onClick={(e) => { e.stopPropagation(); setSelectedCheckForHistory(check); setShowHistoryModal(true); }} className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gray-300 hover:text-white px-4 py-2 bg-gray-700/50 hover:bg-gray-700 rounded-xl border border-gray-600 transition-all">
                        <History size={14} /> Historique
                      </button>
                      {user.role === UserRole.ADMIN && (
                        <>
                          <button onClick={(e) => handleOpenEdit(check, e)} className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-blue-400 hover:text-blue-300 px-4 py-2 bg-blue-500/10 rounded-xl border border-blue-500/20 transition-all">
                            <Edit2 size={14} /> Modifier
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); setCheckToDelete(check.id); setShowDeleteConfirm(true); }} className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-red-400 hover:text-red-300 px-4 py-2 bg-red-500/10 rounded-xl border border-red-500/20 transition-all">
                            <Trash2 size={14} /> Supprimer
                          </button>
                        </>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-8">
                        <div className="bg-brand-dark p-4 rounded-xl border border-gray-700 flex items-center space-x-5">
                          <div className="bg-gray-700/50 p-3 rounded-xl text-gray-400"><History size={20} /></div>
                          <div>
                              <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-0.5">Dernière visite</p>
                              <p className="text-base font-black text-white">{check.lastChecked ? new Date(check.lastChecked).toLocaleDateString('fr-FR') : 'Jamais'}</p>
                          </div>
                        </div>
                        <div className={`bg-brand-dark p-4 rounded-xl border flex items-center space-x-5 ${check.status === CheckStatus.LATE ? 'border-red-500/50 bg-red-500/5' : 'border-gray-700'}`}>
                          <div className={`p-3 rounded-xl ${check.status === CheckStatus.LATE ? 'bg-red-500/20 text-red-500' : 'bg-brand-yellow/20 text-brand-yellow'}`}><Clock size={20} /></div>
                          <div>
                              <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-0.5">Prochaine visite</p>
                              <p className={`text-base font-black ${check.status === CheckStatus.LATE ? 'text-red-400' : 'text-white'}`}>{new Date(check.nextDueDate).toLocaleDateString('fr-FR')}</p>
                          </div>
                        </div>
                    </div>
                    <div className="mb-6">
                      <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2"><span>Progression</span><span>{progress}%</span></div>
                      <div className="w-full bg-gray-800 h-2.5 rounded-full overflow-hidden shadow-inner"><div className="h-full bg-brand-yellow transition-all duration-500 shadow-lg shadow-brand-yellow/50" style={{ width: `${progress}%` }}></div></div>
                    </div>
                    <div className="space-y-3">
                      {check.checklistItems.map((item, idx) => (
                        <label key={idx} className="flex items-center space-x-4 p-4 bg-brand-dark rounded-xl border border-gray-700 cursor-pointer hover:border-brand-yellow/30 transition-all group">
                          <input type="checkbox" checked={item.checked} onChange={() => handleToggleItem(check.id, item.label)} className="w-6 h-6 rounded-lg border-gray-600 bg-gray-800 text-brand-yellow focus:ring-brand-yellow transition-all" />
                          <span className={`text-sm font-bold uppercase tracking-tight transition-all ${item.checked ? 'text-gray-600 line-through' : 'text-gray-200 group-hover:text-white'}`}>{item.label}</span>
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

      {/* Main Form Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-fade-in-up flex flex-col max-h-[95vh]">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50">
              <h2 className="text-xl font-black text-brand-dark uppercase tracking-tight">{isEditing ? 'Modifier la vérification' : 'Programmer une vérification'}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-black transition-colors"><X size={24}/></button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-6 overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="col-span-full space-y-1">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Titre de la vérification</label>
                  <input type="text" required className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-black font-black outline-none focus:ring-2 focus:ring-brand-yellow transition-all" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="Ex: Contrôle Extincteurs"/>
                </div>
                <div className="space-y-1">
                   <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Club</label>
                   <select className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-black font-black outline-none focus:ring-2 focus:ring-brand-yellow transition-all cursor-pointer" value={formData.clubId} onChange={e => setFormData({...formData, clubId: e.target.value})}>
                      {allowedClubs.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                   </select>
                </div>
                <div className="space-y-1">
                   <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Espace</label>
                   <input type="text" required className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-black font-black outline-none focus:ring-2 focus:ring-brand-yellow transition-all" value={formData.space} onChange={e => setFormData({...formData, space: e.target.value})} placeholder="Ex: Local Technique"/>
                </div>
                <div className="space-y-1">
                   <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Métier</label>
                   <select className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-black font-black outline-none focus:ring-2 focus:ring-brand-yellow transition-all cursor-pointer" value={formData.trade} onChange={e => setFormData({...formData, trade: e.target.value as TradeType})}>
                      {Object.values(TradeType).map(t => <option key={t} value={t}>{t}</option>)}
                   </select>
                </div>
                <div className="space-y-1">
                   <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Fréquence (Mois)</label>
                   <input type="number" min="1" className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-black font-black outline-none focus:ring-2 focus:ring-brand-yellow transition-all" value={formData.frequencyMonths} onChange={e => setFormData({...formData, frequencyMonths: parseInt(e.target.value)})}/>
                </div>
                <div className="col-span-full space-y-1">
                   <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Prochaine échéance</label>
                   <input type="date" required className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-black font-black outline-none focus:ring-2 focus:ring-brand-yellow transition-all" value={formData.nextDueDate ? String(formData.nextDueDate).split('T')[0] : ''} onChange={e => setFormData({...formData, nextDueDate: e.target.value})}/>
                </div>
              </div>
              
              <div className="pt-6 border-t border-gray-100 flex gap-4 sticky bottom-0 bg-white">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-gray-100 text-gray-500 font-black uppercase py-4 rounded-xl transition-all">Annuler</button>
                <button type="submit" className="flex-1 bg-brand-yellow text-brand-dark font-black uppercase py-4 rounded-xl hover:bg-yellow-400 shadow-xl shadow-brand-yellow/30 transition-all">{isEditing ? 'Enregistrer' : 'Confirmer'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-8 animate-fade-in-up text-center border border-red-50">
            <div className="w-20 h-20 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm border border-red-100"><AlertTriangle className="text-red-500" size={40} /></div>
            <h3 className="text-2xl font-black text-brand-dark uppercase tracking-tight mb-2">Attention</h3>
            <p className="text-gray-500 font-bold mb-8 leading-relaxed uppercase text-xs tracking-widest">Voulez-vous supprimer définitivement ce contrôle ?</p>
            <div className="flex gap-4">
              <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 bg-gray-100 text-gray-500 font-black uppercase py-4 rounded-xl hover:bg-gray-200 transition-all">Annuler</button>
              <button onClick={() => { if(checkToDelete) onDeleteCheck(checkToDelete); setShowDeleteConfirm(false); }} className="flex-1 bg-red-500 text-white font-black uppercase py-4 rounded-xl hover:bg-red-600 shadow-xl shadow-red-500/30 transition-all">Supprimer</button>
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      {showHistoryModal && selectedCheckForHistory && (
         <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl flex flex-col max-h-[85vh] animate-fade-in-up">
               <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50 rounded-t-2xl">
                  <div>
                    <h3 className="text-xl font-black text-brand-dark uppercase tracking-tight">Historique des contrôles</h3>
                    <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mt-1">{selectedCheckForHistory.title}</p>
                  </div>
                  <button onClick={() => setShowHistoryModal(false)} className="text-gray-400 hover:text-brand-dark transition-colors"><X size={24} /></button>
               </div>
               <div className="p-8 overflow-y-auto custom-scrollbar bg-white">
                  {(!selectedCheckForHistory.history || selectedCheckForHistory.history.length === 0) ? (
                    <div className="text-center py-16 text-gray-300 flex flex-col items-center gap-5"><History size={64} className="opacity-10" /><p className="font-black uppercase tracking-widest text-xs">Aucun historique disponible.</p></div>
                  ) : (
                    <div className="relative border-l-4 border-gray-100 ml-4 space-y-12">
                      {selectedCheckForHistory.history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((log, idx) => (
                        <div key={idx} className="relative pl-10 group">
                           <div className={`absolute -left-[14px] top-0 w-6 h-6 rounded-lg border-4 border-white shadow-md transition-transform group-hover:scale-110 ${log.status === CheckStatus.COMPLETED ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                           <div className="flex flex-col gap-2">
                              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{new Date(log.date).toLocaleDateString('fr-FR')}</span>
                              <div className="flex items-center gap-3">
                                <span className={`text-[9px] px-2.5 py-1 rounded-full font-black uppercase tracking-tighter ${log.status === CheckStatus.COMPLETED ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-gray-50 text-gray-500'}`}>{log.status === CheckStatus.COMPLETED ? 'Validé' : log.status}</span>
                                <span className="text-xs text-brand-dark font-black uppercase tracking-tighter flex items-center gap-2"><UserIcon size={12} className="text-brand-yellow" /> {log.technicianName}</span>
                              </div>
                              {log.notes && <div className="mt-3 bg-gray-50 p-4 rounded-xl border border-gray-100 text-sm text-gray-600 font-bold italic shadow-inner">"{log.notes}"</div>}
                           </div>
                        </div>
                      ))}
                    </div>
                  )}
               </div>
               <div className="p-6 border-t border-gray-100 bg-gray-50 rounded-b-2xl sticky bottom-0">
                 <button onClick={() => setShowHistoryModal(false)} className="w-full bg-brand-dark text-white font-black uppercase py-4 rounded-xl hover:bg-brand-darker transition-all shadow-xl shadow-brand-dark/20">Fermer</button>
               </div>
            </div>
         </div>
      )}
    </div>
  );
};

export default CheckManager;
