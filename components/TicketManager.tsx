
import React, { useState, useRef, useEffect } from 'react';
import { Ticket, TicketStatus, Urgency, TradeType, Club, UserRole, User, TicketHistory } from '../types';
import { Search, Filter, Plus, MapPin, AlertTriangle, CheckCircle, Clock, Camera, Sparkles, X, RefreshCw, Trash2, Edit2, History, User as UserIcon, Building, ChevronDown, Ban, Calendar } from 'lucide-react';
import { analyzeTicketDescription } from '../services/geminiService';

interface TicketManagerProps {
  tickets: Ticket[];
  clubs: Club[];
  users: User[]; 
  currentUser: User;
  failureTypes: Record<TradeType, string[]>;
  onCreateTicket: (ticket: Partial<Ticket>) => void;
  onEditTicket: (ticket: Ticket) => void;
  onDeleteTicket: (ticketId: string) => void;
  onUpdateStatus: (ticketId: string, status: TicketStatus) => void;
}

const TicketManager: React.FC<TicketManagerProps> = ({ 
  tickets, 
  clubs, 
  users,
  currentUser, 
  failureTypes, 
  onCreateTicket, 
  onEditTicket,
  onDeleteTicket,
  onUpdateStatus 
}) => {
  const allowedClubs = (currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.TECHNICIAN)
    ? clubs 
    : clubs.filter(c => currentUser.clubIds.includes(c.id));
  const allowedClubIds = allowedClubs.map(c => c.id);

  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterClub, setFilterClub] = useState<string>(
    (currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.TECHNICIAN) ? 'ALL' : allowedClubs[0]?.id || 'ALL'
  );
  
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentTicketId, setCurrentTicketId] = useState<string | null>(null);

  const [ticketDesc, setTicketDesc] = useState('');
  const [ticketSpace, setTicketSpace] = useState('');
  const [ticketTrade, setTicketTrade] = useState<TradeType>(TradeType.ELECTRICITY);
  const [ticketUrgency, setTicketUrgency] = useState<Urgency>(Urgency.LOW);
  const [ticketClub, setTicketClub] = useState(allowedClubs[0]?.id || '');
  const [selectedClubSpaces, setSelectedClubSpaces] = useState<string[]>(allowedClubs[0]?.spaces || []);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiAdvice, setAiAdvice] = useState<string | null>(null);

  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const filteredTickets = tickets.filter(t => {
    if (!allowedClubIds.includes(t.clubId)) return false; 
    if (filterStatus !== 'ALL' && t.status !== filterStatus) return false;
    if (filterClub !== 'ALL' && t.clubId !== filterClub) return false;
    return true;
  });

  const handleClubChange = (clubId: string) => {
      setTicketClub(clubId);
      const club = clubs.find(c => c.id === clubId);
      setSelectedClubSpaces(club ? club.spaces : []);
      if (!isEditing) setTicketSpace(club?.spaces[0] || '');
  };

  const handleAiAnalyze = async () => {
    if (!ticketDesc) return;
    setAiLoading(true);
    setAiAdvice(null);
    const result = await analyzeTicketDescription(ticketDesc);
    if (result) {
      if (result.suggestedTrade) {
        const matchedTrade = Object.values(TradeType).find(t => t === result.suggestedTrade) || TradeType.CLEANING;
        setTicketTrade(matchedTrade);
      }
      if (result.suggestedUrgency) {
         setTicketUrgency(result.suggestedUrgency as Urgency);
      }
      if (result.technicalAdvice) {
        setAiAdvice(result.technicalAdvice);
      }
    }
    setAiLoading(false);
  };

  const startCamera = async () => {
    setIsCameraOpen(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' }
      });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      console.error("Erreur accès caméra:", err);
      alert("Impossible d'accéder à la caméra.");
      setIsCameraOpen(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraOpen(false);
  };

  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setCapturedImage(dataUrl);
        stopCamera();
      }
    }
  };

  useEffect(() => {
    return () => stopCamera();
  }, []);

  const handleOpenCreate = () => {
    setIsEditing(false);
    setCurrentTicketId(null);
    setTicketDesc('');
    setTicketSpace(allowedClubs[0]?.spaces[0] || '');
    setTicketTrade(TradeType.ELECTRICITY);
    setTicketUrgency(Urgency.LOW);
    setTicketClub(allowedClubs[0]?.id || '');
    setCapturedImage(null);
    setAiAdvice(null);
    const club = clubs.find(c => c.id === (allowedClubs[0]?.id || ''));
    setSelectedClubSpaces(club ? club.spaces : []);
    setShowModal(true);
  };

  const handleOpenEdit = (ticket: Ticket) => {
    setIsEditing(true);
    setCurrentTicketId(ticket.id);
    setTicketDesc(ticket.description);
    setTicketSpace(ticket.space);
    setTicketTrade(ticket.trade);
    setTicketUrgency(ticket.urgency);
    setTicketClub(ticket.clubId);
    setCapturedImage(ticket.images && ticket.images.length > 0 ? ticket.images[0] : null);
    setAiAdvice(null);
    const club = clubs.find(c => c.id === ticket.clubId);
    setSelectedClubSpaces(club ? club.spaces : []);
    setShowModal(true);
  };

  const getStatusColor = (status: TicketStatus) => {
    switch (status) {
      case TicketStatus.OPEN: return 'bg-red-500 text-white border-red-600';
      case TicketStatus.IN_PROGRESS: return 'bg-yellow-500 text-brand-dark border-yellow-600';
      case TicketStatus.RESOLVED: return 'bg-green-500 text-white border-green-600';
      case TicketStatus.CANCELLED: return 'bg-gray-500 text-white opacity-60';
    }
  };

  const getUrgencyBadge = (urgency: Urgency) => {
     const styles = {
       [Urgency.LOW]: 'text-gray-400',
       [Urgency.MEDIUM]: 'text-yellow-600',
       [Urgency.HIGH]: 'text-orange-600 font-bold',
       [Urgency.CRITICAL]: 'text-red-600 font-bold animate-pulse'
     };
     return <span className={`text-[10px] uppercase font-black tracking-widest ${styles[urgency]}`}>{urgency}</span>;
  };

  const getCreatorName = (userId: string) => {
    const user = users.find(u => u.id === userId);
    return user ? user.name : "Inconnu";
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const commonData = {
        description: ticketDesc,
        clubId: ticketClub,
        space: ticketSpace,
        trade: ticketTrade,
        urgency: ticketUrgency,
        images: capturedImage ? [capturedImage] : [], 
    };

    if (isEditing && currentTicketId) {
        const originalTicket = tickets.find(t => t.id === currentTicketId);
        if (originalTicket) {
             onEditTicket({ ...originalTicket, ...commonData });
        }
    } else {
        onCreateTicket({
            ...commonData,
            status: TicketStatus.OPEN,
            createdBy: currentUser.id
        });
    }
    stopCamera();
    setShowModal(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between gap-4 bg-brand-light p-4 rounded-lg items-center shadow-lg">
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          <div className="relative group w-full sm:w-auto">
            <Building className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-hover:text-brand-yellow transition-colors" size={16} />
            <select value={filterClub} onChange={(e) => setFilterClub(e.target.value)} className="w-full sm:w-auto bg-brand-dark border border-gray-600 rounded pl-10 pr-8 py-2 text-white focus:border-brand-yellow outline-none appearance-none cursor-pointer min-w-[200px]">
              <option value="ALL">Tous les clubs</option>
              {allowedClubs.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="relative group w-full sm:w-auto">
             <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-hover:text-brand-yellow transition-colors" size={16} />
             <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="w-full sm:w-auto bg-brand-dark border border-gray-600 rounded pl-10 pr-8 py-2 text-white focus:border-brand-yellow outline-none appearance-none cursor-pointer min-w-[200px]">
               <option value="ALL">Tous les statuts</option>
               {Object.values(TicketStatus).map(s => <option key={s} value={s}>{s}</option>)}
             </select>
          </div>
        </div>
        <button onClick={handleOpenCreate} className="w-full md:w-auto bg-brand-yellow text-brand-dark font-black uppercase tracking-tight px-4 py-2 rounded flex items-center justify-center gap-2 hover:bg-yellow-400 transition shadow-xl">
          <Plus size={18} /> Nouveau Ticket
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTickets.map(ticket => {
            const club = clubs.find(c => c.id === ticket.clubId);
            return (
              <div key={ticket.id} className={`bg-brand-light p-6 rounded-2xl border border-gray-700 hover:border-brand-yellow/50 transition-all group shadow-xl flex flex-col ${ticket.status === TicketStatus.CANCELLED ? 'opacity-70 grayscale' : ''}`}>
                <div className="flex justify-between items-start mb-4">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter shadow-sm border ${getStatusColor(ticket.status)}`}>
                    {ticket.status}
                  </span>
                  <div className="flex gap-2">
                     {(currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.MANAGER || ticket.createdBy === currentUser.id) && (
                        <>
                           <button 
                             onClick={(e) => {
                               e.stopPropagation();
                               handleOpenEdit(ticket);
                             }} 
                             className="p-2 text-blue-400 hover:bg-blue-500/10 rounded-full transition" 
                             title="Modifier"
                           >
                             <Edit2 size={16} />
                           </button>
                           <button 
                             onClick={(e) => {
                               e.stopPropagation();
                               if (window.confirm("Envoyer ce ticket à la corbeille ?")) {
                                 onDeleteTicket(ticket.id);
                               }
                             }} 
                             className="p-2 text-red-500 hover:bg-red-500/10 rounded-full transition" 
                             title="Supprimer"
                           >
                             <Trash2 size={16} />
                           </button>
                        </>
                     )}
                  </div>
                </div>

                <div className="flex justify-between items-center mb-1">
                   <h4 className="font-black text-lg text-white line-clamp-1 uppercase tracking-tight">{ticket.trade}</h4>
                   {getUrgencyBadge(ticket.urgency)}
                </div>
                
                {ticket.images && ticket.images.length > 0 && (
                  <div className="mb-4 w-full h-40 overflow-hidden rounded-xl bg-gray-900 shadow-inner">
                    <img src={ticket.images[0]} alt="Ticket" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                  </div>
                )}

                <div className="flex items-center text-brand-yellow text-xs font-bold mb-4 uppercase tracking-widest">
                  <MapPin size={12} className="mr-1.5" /> {club?.name} - {ticket.space}
                </div>

                <p className="text-gray-300 text-sm mb-6 line-clamp-3 bg-brand-dark/30 p-3 rounded-xl flex-1 italic">
                  "{ticket.description}"
                </p>

                <div className="border-t border-gray-700/50 pt-4 mt-auto space-y-4">
                   <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                          <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(getCreatorName(ticket.createdBy))}&background=random`} className="w-6 h-6 rounded-full border border-gray-600" alt="Av" />
                          <span className="text-[10px] text-gray-400 font-bold uppercase">{getCreatorName(ticket.createdBy)}</span>
                      </div>
                      <span className="text-[9px] text-gray-500 font-black uppercase">{new Date(ticket.createdAt).toLocaleDateString('fr-FR')}</span>
                   </div>

                   <div className="flex justify-end gap-2">
                     {(currentUser.role === UserRole.TECHNICIAN || currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.MANAGER) && ticket.status !== TicketStatus.RESOLVED && ticket.status !== TicketStatus.CANCELLED && (
                       <button 
                         onClick={(e) => {
                           e.stopPropagation();
                           onUpdateStatus(ticket.id, TicketStatus.RESOLVED);
                         }} 
                         className="flex-1 bg-green-500 text-white text-[10px] font-black uppercase py-2.5 rounded-lg hover:bg-green-600 transition shadow-lg shadow-green-500/20 flex items-center justify-center gap-2"
                       >
                         <CheckCircle size={14} /> Clôturer
                       </button>
                     )}
                     {(currentUser.role === UserRole.TECHNICIAN || currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.MANAGER) && ticket.status === TicketStatus.OPEN && (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            onUpdateStatus(ticket.id, TicketStatus.IN_PROGRESS);
                          }} 
                          className="flex-1 bg-brand-yellow text-brand-dark text-[10px] font-black uppercase py-2.5 rounded-lg hover:bg-yellow-400 transition shadow-lg shadow-brand-yellow/20 flex items-center justify-center gap-2"
                        >
                          <Clock size={14} /> Prendre
                        </button>
                     )}
                   </div>
                </div>
              </div>
            );
        })}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden max-h-[95vh] flex flex-col animate-fade-in-up">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50">
              <h2 className="text-xl font-black text-black uppercase tracking-tight">
                {isEditing ? 'Modifier le Ticket' : 'Nouveau Signalement'}
              </h2>
              <button onClick={() => { stopCamera(); setShowModal(false); }} className="text-gray-400 hover:text-black transition-colors">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-6 overflow-y-auto custom-scrollbar">
              {isCameraOpen && (
                 <div className="fixed inset-0 bg-black z-[60] flex flex-col items-center justify-center">
                    <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-contain"></video>
                    <div className="absolute bottom-10 flex gap-6 items-center">
                        <button type="button" onClick={stopCamera} className="bg-red-50 p-4 rounded-full text-white shadow-xl"><X size={24} /></button>
                        <button type="button" onClick={takePhoto} className="bg-white p-6 rounded-full border-8 border-white/20 shadow-2xl"><div className="w-12 h-12 bg-brand-yellow rounded-full"></div></button>
                    </div>
                 </div>
              )}

              <div className="space-y-1">
                <label className="block text-xs font-black text-black uppercase tracking-widest">Club concerné</label>
                <select className="w-full bg-gray-50 border border-gray-300 rounded-xl p-4 text-black font-black outline-none focus:ring-2 focus:ring-brand-yellow transition-all" value={ticketClub} onChange={e => handleClubChange(e.target.value)}>
                  {allowedClubs.map(c => <option key={c.id} value={c.id} className="text-black font-black">{c.name}</option>)}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-black text-black uppercase tracking-widest">Zone / Espace</label>
                <select className="w-full bg-gray-50 border border-gray-300 rounded-xl p-4 text-black font-black outline-none focus:ring-2 focus:ring-brand-yellow transition-all" value={ticketSpace} onChange={e => setTicketSpace(e.target.value)}>
                  {selectedClubSpaces.map(s => <option key={s} value={s} className="text-black font-black">{s}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-black text-black uppercase tracking-widest">Métier</label>
                  <select className="w-full bg-gray-50 border border-gray-300 rounded-xl p-4 text-black font-black outline-none focus:ring-2 focus:ring-brand-yellow transition-all" value={ticketTrade} onChange={e => setTicketTrade(e.target.value as TradeType)}>
                    {Object.values(TradeType).map(t => <option key={t} value={t} className="text-black font-black">{t}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-black text-black uppercase tracking-widest">Urgence</label>
                  <select className="w-full bg-gray-50 border border-gray-300 rounded-xl p-4 text-black font-black outline-none focus:ring-2 focus:ring-brand-yellow transition-all" value={ticketUrgency} onChange={e => setTicketUrgency(e.target.value as Urgency)}>
                    {Object.values(Urgency).map(u => <option key={u} value={u} className="text-black font-black">{u}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-black text-black uppercase tracking-widest">Description précise</label>
                <div className="relative">
                  <textarea required rows={4} className="w-full bg-gray-50 border border-gray-300 rounded-xl p-4 text-black font-black outline-none focus:ring-2 focus:ring-brand-yellow transition-all pr-12" value={ticketDesc} onChange={e => setTicketDesc(e.target.value)} placeholder="Quel est le problème ?" />
                  <button type="button" onClick={handleAiAnalyze} disabled={!ticketDesc || aiLoading} className="absolute bottom-4 right-4 text-brand-yellow hover:scale-110 disabled:opacity-30 transition-all"><Sparkles size={28} className={aiLoading ? 'animate-spin' : ''} /></button>
                </div>
                {aiAdvice && <div className="mt-3 bg-brand-yellow/10 border border-brand-yellow/20 p-4 rounded-xl text-xs text-black font-black animate-fade-in"><Sparkles size={14} className="inline mr-2 text-brand-yellow" />Conseil IA: {aiAdvice}</div>}
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-black text-black uppercase tracking-widest">Photo illustrative</label>
                {!capturedImage ? (
                  <button type="button" onClick={startCamera} className="flex flex-col items-center gap-3 text-xs font-black text-gray-400 border-2 border-dashed border-gray-200 hover:border-brand-yellow hover:bg-brand-yellow/5 rounded-2xl p-10 w-full transition-all group">
                    <div className="bg-gray-50 group-hover:bg-brand-yellow/10 p-5 rounded-full transition-all shadow-sm"><Camera size={36} /></div>
                    <span className="font-black uppercase tracking-widest">Prendre une photo</span>
                  </button>
                ) : (
                  <div className="relative rounded-2xl overflow-hidden border border-gray-100 shadow-xl group">
                     <img src={capturedImage} alt="Capture" className="w-full h-56 object-cover" />
                     <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                        <button type="button" onClick={() => { setCapturedImage(null); startCamera(); }} className="bg-white text-brand-dark p-4 rounded-xl hover:bg-brand-yellow transition-all"><RefreshCw size={24} /></button>
                        <button type="button" onClick={() => setCapturedImage(null)} className="bg-red-500 text-white p-4 rounded-xl hover:bg-red-600 transition-all"><X size={24} /></button>
                     </div>
                  </div>
                )}
              </div>

              <div className="pt-6 flex gap-4 sticky bottom-0 bg-white">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-gray-100 text-black font-black uppercase tracking-tight py-4 rounded-xl hover:bg-gray-200 transition-all">Annuler</button>
                <button type="submit" className="flex-1 bg-brand-yellow text-brand-dark font-black uppercase tracking-tight py-4 rounded-xl hover:bg-yellow-400 transition-all shadow-xl shadow-brand-yellow/30">
                    {isEditing ? 'Enregistrer' : 'Signaler le problème'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TicketManager;
