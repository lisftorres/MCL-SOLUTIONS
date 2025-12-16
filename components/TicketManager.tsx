

import React, { useState, useRef, useEffect } from 'react';
import { Ticket, TicketStatus, Urgency, TradeType, Club, UserRole, User, TicketHistory } from '../types';
import { Search, Filter, Plus, MapPin, AlertTriangle, CheckCircle, Clock, Camera, Sparkles, X, RefreshCw, Trash2, Edit2, History, User as UserIcon, Building, ChevronDown, Ban, Calendar } from 'lucide-react';
import { analyzeTicketDescription } from '../services/geminiService';

interface TicketManagerProps {
  tickets: Ticket[];
  clubs: Club[];
  users: User[]; // Ajout de la liste des utilisateurs pour retrouver les noms
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
  // Filtrer les clubs accessibles
  const allowedClubs = (currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.TECHNICIAN)
    ? clubs 
    : clubs.filter(c => currentUser.clubIds.includes(c.id));
  const allowedClubIds = allowedClubs.map(c => c.id);

  // Initial State for Filter: 'ALL' for Admin/Tech, specific club for Managers if possible
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterClub, setFilterClub] = useState<string>(
    (currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.TECHNICIAN) ? 'ALL' : allowedClubs[0]?.id || 'ALL'
  );
  
  // Modal States
  const [showModal, setShowModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentTicketId, setCurrentTicketId] = useState<string | null>(null);
  const [selectedTicketForHistory, setSelectedTicketForHistory] = useState<Ticket | null>(null);

  // Ticket Form State
  const [ticketDesc, setTicketDesc] = useState('');
  const [ticketSpace, setTicketSpace] = useState('');
  const [ticketTrade, setTicketTrade] = useState<TradeType>(TradeType.ELECTRICITY);
  const [ticketUrgency, setTicketUrgency] = useState<Urgency>(Urgency.LOW);
  const [ticketClub, setTicketClub] = useState(allowedClubs[0]?.id || '');
  const [selectedClubSpaces, setSelectedClubSpaces] = useState<string[]>(allowedClubs[0]?.spaces || []);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiAdvice, setAiAdvice] = useState<string | null>(null);

  // Camera State
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const filteredTickets = tickets.filter(t => {
    // Si c'est un manager, il ne peut voir que ses clubs. Si c'est admin/tech, allowedClubIds contient tout.
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

  // Camera Functions
  const startCamera = async () => {
    setIsCameraOpen(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
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

  const retakePhoto = () => {
    setCapturedImage(null);
    startCamera();
  };

  useEffect(() => {
    return () => stopCamera();
  }, []);

  // Form Actions
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
    
    // Init spaces for default club
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

  const handleOpenHistory = (ticket: Ticket) => {
    setSelectedTicketForHistory(ticket);
    setShowHistoryModal(true);
  };

  const handleDelete = (ticketId: string) => {
    if(window.confirm("Voulez-vous supprimer ce ticket ? Il sera déplacé dans la corbeille.")) {
      onDeleteTicket(ticketId);
    }
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
             onEditTicket({
                 ...originalTicket,
                 ...commonData
             });
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

  const getStatusColor = (status: TicketStatus) => {
    switch (status) {
      case TicketStatus.OPEN: return 'bg-red-500/20 text-red-400 border-red-500/50';
      case TicketStatus.IN_PROGRESS: return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
      case TicketStatus.RESOLVED: return 'bg-green-500/20 text-green-400 border-green-500/50';
      case TicketStatus.CANCELLED: return 'bg-gray-500/20 text-gray-400 border-gray-500/50 opacity-60';
    }
  };

  const getUrgencyBadge = (urgency: Urgency) => {
     const styles = {
       [Urgency.LOW]: 'text-gray-400',
       [Urgency.MEDIUM]: 'text-yellow-400',
       [Urgency.HIGH]: 'text-orange-500 font-bold',
       [Urgency.CRITICAL]: 'text-red-500 font-bold animate-pulse'
     };
     return <span className={`text-xs uppercase ${styles[urgency]}`}>{urgency}</span>;
  };

  // Helper to find creator name
  const getCreatorName = (userId: string) => {
    const user = users.find(u => u.id === userId);
    return user ? user.name : "Utilisateur inconnu";
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col md:flex-row justify-between gap-4 bg-gym-light p-4 rounded-lg items-center">
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          {/* Club Filter */}
          <div className="relative group w-full sm:w-auto">
            <Building className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-hover:text-gym-yellow transition-colors" size={16} />
            <select 
              value={filterClub}
              onChange={(e) => setFilterClub(e.target.value)}
              className="w-full sm:w-auto bg-gym-dark border border-gray-600 rounded pl-10 pr-8 py-2 text-white focus:border-gym-yellow outline-none appearance-none cursor-pointer min-w-[200px]"
            >
              <option value="ALL">Tous les clubs</option>
              {allowedClubs.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={14} />
          </div>

          {/* Status Filter */}
          <div className="relative group w-full sm:w-auto">
             <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-hover:text-gym-yellow transition-colors" size={16} />
             <select 
               value={filterStatus}
               onChange={(e) => setFilterStatus(e.target.value)}
               className="w-full sm:w-auto bg-gym-dark border border-gray-600 rounded pl-10 pr-8 py-2 text-white focus:border-gym-yellow outline-none appearance-none cursor-pointer min-w-[200px]"
             >
               <option value="ALL">Tous les statuts</option>
               {Object.values(TicketStatus).map(s => <option key={s} value={s}>{s}</option>)}
             </select>
             <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={14} />
          </div>
        </div>

        <button 
          onClick={handleOpenCreate}
          className="w-full md:w-auto bg-gym-yellow text-gym-dark font-bold px-4 py-2 rounded flex items-center justify-center gap-2 hover:bg-yellow-400 transition"
        >
          <Plus size={18} />
          Nouveau Ticket
        </button>
      </div>

      {/* Ticket Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTickets.map(ticket => {
            const club = clubs.find(c => c.id === ticket.clubId);
            return (
              <div key={ticket.id} className={`bg-gym-light p-5 rounded-lg border border-gray-700 hover:border-gym-yellow/50 transition-all group shadow-lg flex flex-col ${ticket.status === TicketStatus.CANCELLED ? 'opacity-70 grayscale-[50%]' : ''}`}>
                <div className="flex justify-between items-start mb-3">
                  <span className={`px-2 py-1 rounded text-xs border ${getStatusColor(ticket.status)}`}>
                    {ticket.status}
                  </span>
                  
                  {/* Action Buttons Top Right */}
                  <div className="flex gap-1">
                     <button 
                        onClick={() => handleOpenHistory(ticket)}
                        className="p-1 text-gray-400 hover:text-white hover:bg-white/10 rounded transition"
                        title="Historique"
                     >
                        <History size={16} />
                     </button>
                     {/* Edit/Exclude/Delete only if allowed */}
                     {(currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.MANAGER || ticket.createdBy === currentUser.id) && (
                        <>
                           <button 
                              onClick={() => handleOpenEdit(ticket)}
                              className="p-1 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded transition"
                              title="Modifier"
                           >
                              <Edit2 size={16} />
                           </button>
                           {/* Bouton Supprimer (Soft Delete -> Corbeille) */}
                           {ticket.status !== TicketStatus.CANCELLED && (
                            <button 
                                onClick={() => handleDelete(ticket.id)}
                                className="p-1 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition"
                                title="Supprimer (Vers Corbeille)"
                            >
                                <Trash2 size={16} />
                            </button>
                           )}
                        </>
                     )}
                  </div>
                </div>

                <div className="flex justify-between items-center mb-1">
                   <h4 className="font-bold text-lg text-white line-clamp-1">{ticket.trade}</h4>
                   {getUrgencyBadge(ticket.urgency)}
                </div>
                
                {ticket.images && ticket.images.length > 0 && (
                  <div className="mb-3 w-full h-32 overflow-hidden rounded bg-gray-900">
                    <img src={ticket.images[0]} alt="Ticket" className="w-full h-full object-cover" />
                  </div>
                )}

                <div className="flex items-center text-gray-400 text-sm mb-3">
                  <MapPin size={14} className="mr-1" />
                  {club?.name} - {ticket.space}
                </div>

                <p className="text-gray-300 text-sm mb-4 line-clamp-3 bg-gym-dark/50 p-2 rounded flex-1">
                  {ticket.description}
                </p>

                {/* Info Créateur et Date */}
                <div className="border-t border-gray-700 pt-3 mt-auto space-y-3">
                   <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                          <UserIcon size={12} className="text-gym-yellow" />
                          <span>
                            Créé par <span className="text-white font-bold">{getCreatorName(ticket.createdBy)}</span>
                          </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                         <Calendar size={12} />
                         <span>
                           le {new Date(ticket.createdAt).toLocaleDateString('fr-FR')} à {new Date(ticket.createdAt).toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'})}
                         </span>
                      </div>
                   </div>

                   {/* Status Workflow Actions */}
                   <div className="flex justify-end gap-2">
                     {(currentUser.role === UserRole.TECHNICIAN || currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.MANAGER) && ticket.status !== TicketStatus.RESOLVED && ticket.status !== TicketStatus.CANCELLED && (
                       <button 
                         onClick={() => onUpdateStatus(ticket.id, TicketStatus.RESOLVED)}
                         className="text-green-400 hover:text-green-300 text-xs flex items-center gap-1 bg-green-900/20 px-2 py-1 rounded border border-green-900/50"
                       >
                         <CheckCircle size={12} />
                         Clôturer
                       </button>
                     )}
                     {(currentUser.role === UserRole.TECHNICIAN || currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.MANAGER) && ticket.status === TicketStatus.OPEN && (
                        <button 
                        onClick={() => onUpdateStatus(ticket.id, TicketStatus.IN_PROGRESS)}
                        className="text-yellow-400 hover:text-yellow-300 text-xs flex items-center gap-1 bg-yellow-900/20 px-2 py-1 rounded border border-yellow-900/50"
                      >
                        <Clock size={12} />
                        Prendre
                      </button>
                     )}
                   </div>
                </div>
              </div>
            );
        })}
        {filteredTickets.length === 0 && (
          <div className="col-span-full py-20 text-center text-gray-500">
             <p className="text-lg">Aucun ticket trouvé avec les filtres actuels.</p>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-gym-light w-full max-w-lg rounded-xl shadow-2xl border border-gray-600 max-h-[95vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-700">
              <h2 className="text-xl font-bold text-white">{isEditing ? 'Modifier le Ticket' : 'Nouveau Ticket'}</h2>
              <button onClick={() => { stopCamera(); setShowModal(false); }}><span className="text-2xl">&times;</span></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              
              {/* Camera View Overlay */}
              {isCameraOpen && (
                 <div className="fixed inset-0 bg-black z-[60] flex flex-col items-center justify-center">
                    <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-contain"></video>
                    <canvas ref={canvasRef} className="hidden"></canvas>
                    <div className="absolute bottom-10 flex gap-6 items-center">
                        <button 
                           type="button" 
                           onClick={stopCamera} 
                           className="bg-red-500 p-4 rounded-full text-white"
                        >
                            <X size={24} />
                        </button>
                        <button 
                           type="button" 
                           onClick={takePhoto} 
                           className="bg-white p-5 rounded-full border-4 border-gray-300 shadow-lg transform active:scale-95 transition"
                        >
                           <div className="w-16 h-16 bg-transparent"></div>
                        </button>
                    </div>
                 </div>
              )}

              <div>
                <label className="block text-sm text-gray-400 mb-1">Club</label>
                <select 
                  className="w-full bg-gym-dark border border-gray-600 rounded p-2 text-white"
                  value={ticketClub}
                  onChange={e => handleClubChange(e.target.value)}
                >
                  {allowedClubs.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Espace</label>
                {selectedClubSpaces.length > 0 ? (
                  <select
                    className="w-full bg-gym-dark border border-gray-600 rounded p-2 text-white"
                    value={ticketSpace}
                    onChange={e => setTicketSpace(e.target.value)}
                  >
                    {selectedClubSpaces.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                ) : (
                   <input 
                    type="text" 
                    required
                    className="w-full bg-gym-dark border border-gray-600 rounded p-2 text-white"
                    value={ticketSpace}
                    onChange={e => setTicketSpace(e.target.value)}
                  />
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Métier</label>
                  <select 
                    className="w-full bg-gym-dark border border-gray-600 rounded p-2 text-white"
                    value={ticketTrade}
                    onChange={e => setTicketTrade(e.target.value as TradeType)}
                  >
                    {Object.values(TradeType).map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Urgence</label>
                  <select 
                    className="w-full bg-gym-dark border border-gray-600 rounded p-2 text-white"
                    value={ticketUrgency}
                    onChange={e => setTicketUrgency(e.target.value as Urgency)}
                  >
                    {Object.values(Urgency).map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
              </div>

               {/* Failure Type Suggestion Based on Trade */}
               {failureTypes[ticketTrade] && failureTypes[ticketTrade].length > 0 && (
                <div>
                   <label className="block text-sm text-gym-yellow mb-1">Type de panne courante (Optionnel)</label>
                   <select 
                     className="w-full bg-gym-dark border border-gray-600 rounded p-2 text-white text-sm"
                     onChange={(e) => {
                         if(e.target.value) {
                             setTicketDesc(prev => prev ? prev + ' - ' + e.target.value : e.target.value);
                         }
                     }}
                     defaultValue=""
                   >
                     <option value="" disabled>Sélectionner une panne type...</option>
                     {failureTypes[ticketTrade].map((fail, idx) => (
                        <option key={idx} value={fail}>{fail}</option>
                     ))}
                   </select>
                </div>
               )}

              <div>
                <label className="block text-sm text-gray-400 mb-1">Description du problème</label>
                <div className="relative">
                  <textarea 
                    required
                    rows={3}
                    className="w-full bg-gym-dark border border-gray-600 rounded p-2 text-white pr-10"
                    value={ticketDesc}
                    onChange={e => setTicketDesc(e.target.value)}
                    placeholder="Décrivez la panne..."
                  />
                  <button 
                    type="button"
                    onClick={handleAiAnalyze}
                    disabled={!ticketDesc || aiLoading}
                    className="absolute bottom-2 right-2 text-gym-yellow hover:text-white disabled:opacity-50"
                    title="Analyser avec IA"
                  >
                    <Sparkles size={20} className={aiLoading ? 'animate-spin' : ''} />
                  </button>
                </div>
                {aiAdvice && (
                  <div className="mt-2 bg-gym-yellow/10 border border-gym-yellow/30 p-2 rounded text-xs text-gym-yellow flex gap-2 items-start">
                    <Sparkles size={14} className="mt-0.5 flex-shrink-0" />
                    <p><strong>Conseil IA:</strong> {aiAdvice}</p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Photo de la panne</label>
                {!capturedImage ? (
                  <button 
                    type="button" 
                    onClick={startCamera}
                    className="flex flex-col items-center gap-2 text-sm text-gray-400 hover:text-white border border-dashed border-gray-600 hover:border-gym-yellow hover:bg-gym-yellow/5 rounded p-8 w-full justify-center transition"
                  >
                    <Camera size={32} />
                    <span>Ouvrir la caméra / Charger photo</span>
                  </button>
                ) : (
                  <div className="relative rounded-lg overflow-hidden border border-gray-600">
                     <img src={capturedImage} alt="Capture" className="w-full h-48 object-cover" />
                     <button 
                       type="button"
                       onClick={retakePhoto}
                       className="absolute bottom-2 right-2 bg-gym-dark/80 text-white p-2 rounded-full hover:bg-gym-yellow hover:text-gym-dark transition"
                     >
                       <RefreshCw size={18} />
                     </button>
                     <button 
                       type="button"
                       onClick={() => setCapturedImage(null)}
                       className="absolute top-2 right-2 bg-red-500/80 text-white p-2 rounded-full hover:bg-red-600 transition"
                     >
                       <X size={18} />
                     </button>
                  </div>
                )}
              </div>

              <div className="pt-4 flex gap-3">
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
                  {isEditing ? 'Sauvegarder' : 'Créer le ticket'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* History Modal */}
      {showHistoryModal && selectedTicketForHistory && (
         <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
            <div className="bg-gym-light w-full max-w-lg rounded-xl shadow-2xl border border-gray-600 max-h-[80vh] flex flex-col">
               <div className="flex justify-between items-center p-4 border-b border-gray-700 bg-gym-darker rounded-t-xl">
                  <div>
                    <h3 className="text-lg font-bold text-white">Historique du Ticket</h3>
                    <p className="text-xs text-gray-400">ID: {selectedTicketForHistory.id}</p>
                  </div>
                  <button onClick={() => setShowHistoryModal(false)}><X className="text-gray-400 hover:text-white" /></button>
               </div>
               
               <div className="p-6 overflow-y-auto custom-scrollbar">
                  {!selectedTicketForHistory.history || selectedTicketForHistory.history.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        <History size={40} className="mx-auto mb-2 opacity-50" />
                        <p>Aucun historique disponible.</p>
                    </div>
                  ) : (
                    <div className="relative border-l-2 border-gray-700 ml-3 space-y-8">
                      {selectedTicketForHistory.history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((log, idx) => (
                        <div key={idx} className="relative pl-6">
                           <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 border-gym-light ${
                               log.action === 'CREATION' ? 'bg-blue-500' : 
                               log.action === 'STATUS_CHANGE' ? 'bg-green-500' : 
                               log.action === 'DELETION' ? 'bg-red-500' :
                               log.action === 'RESTORATION' ? 'bg-emerald-500' : 'bg-gym-yellow'
                           }`}></div>
                           
                           <div className="flex flex-col gap-1">
                              <span className="text-sm font-mono text-gray-400">
                                {new Date(log.date).toLocaleDateString('fr-FR')} à {new Date(log.date).toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'})}
                              </span>
                              <div className="flex items-center gap-2">
                                <span className={`text-xs px-2 py-0.5 rounded font-bold ${
                                    log.action === 'CREATION' ? 'bg-blue-500/20 text-blue-400' : 
                                    log.action === 'STATUS_CHANGE' ? 'bg-green-500/20 text-green-400' :
                                    log.action === 'DELETION' ? 'bg-red-500/20 text-red-400' :
                                    log.action === 'RESTORATION' ? 'bg-emerald-500/20 text-emerald-400' :
                                    'bg-gym-yellow/20 text-gym-yellow'
                                }`}>
                                  {log.action}
                                </span>
                              </div>
                              <div className="flex items-center gap-1 text-sm text-white font-semibold">
                                 <UserIcon size={12} className="text-gray-500" />
                                 {log.user}
                              </div>
                              {log.details && (
                                <p className="text-xs text-gray-400 bg-gym-dark p-2 rounded mt-1 border border-gray-700">
                                   {log.details}
                                </p>
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

export default TicketManager;
