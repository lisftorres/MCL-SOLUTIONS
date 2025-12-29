
import React, { useState, useRef, useEffect } from 'react';
import { Specification, User, UserRole } from '../types';
import { Folder, Search, Plus, X, Camera, RefreshCw, ChevronRight, PenTool, LayoutTemplate, Tag, Upload, FileText, Download, Trash2, Eye, Info, CheckCircle2, ArrowLeft } from 'lucide-react';

interface SpecificationsManagerProps {
  specifications: Specification[];
  currentUser: User;
  onAddSpecification: (spec: Partial<Specification>) => void;
  onDeleteSpecification: (id: string) => void;
  onEditSpecification: (spec: Specification) => void;
}

const SpecificationsManager: React.FC<SpecificationsManagerProps> = ({ 
  specifications, 
  currentUser, 
  onAddSpecification, 
  onDeleteSpecification, 
  onEditSpecification 
}) => {
  const [activeFolder, setActiveFolder] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewingSpec, setViewingSpec] = useState<Specification | null>(null);
  
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<Specification>>({
    category: '',
    title: '',
    brand: '',
    partType: '',
    installationType: '',
    imageUrl: '',
    documentUrl: '',
    documentName: ''
  });

  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const categories = Array.from(new Set(specifications.map(s => s.category))).sort();
  const filteredSpecs = specifications.filter(s => {
    const matchesSearch = s.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          s.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          s.partType.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFolder = activeFolder ? s.category === activeFolder : true;
    return matchesSearch && matchesFolder;
  });

  const handleOpenCreate = () => {
    setIsEditing(false);
    setFormData({
      category: activeFolder || '',
      title: '',
      brand: '',
      partType: '',
      installationType: '',
      imageUrl: '',
      documentUrl: '',
      documentName: ''
    });
    setShowModal(true);
  };

  const handleOpenEdit = (spec: Specification) => {
    setIsEditing(true);
    setFormData({ ...spec });
    setShowModal(true);
    setViewingSpec(null);
  };

  const handleDelete = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (window.confirm("Êtes-vous sûr de vouloir supprimer définitivement cette fiche technique ?")) {
      onDeleteSpecification(id);
      if (viewingSpec?.id === id) setViewingSpec(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditing && formData.id) {
      onEditSpecification(formData as Specification);
    } else {
      onAddSpecification(formData);
    }
    stopCamera();
    setShowModal(false);
  };

  const startCamera = async () => {
    setIsCameraOpen(true);
    setTimeout(async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: 'environment' } 
          });
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        } catch (err) {
          console.error("Caméra error:", err);
          alert("Impossible d'accéder à la caméra. Vérifiez les permissions.");
          setIsCameraOpen(false);
        }
    }, 150);
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
        setFormData(prev => ({ ...prev, imageUrl: dataUrl }));
        stopCamera();
      }
    }
  };

  useEffect(() => {
    return () => stopCamera();
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const objectUrl = URL.createObjectURL(file);
      setFormData({ ...formData, documentUrl: objectUrl, documentName: file.name });
    }
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="bg-brand-light p-6 rounded-2xl border border-gray-700 shadow-2xl flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-3 uppercase tracking-tight">
            <PenTool className="text-brand-yellow" /> Cahier des Charges
          </h2>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-brand-yellow transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Rechercher une pièce..." 
              className="w-full bg-brand-dark border border-gray-600 rounded-xl pl-10 pr-4 py-3 text-white font-bold outline-none focus:border-brand-yellow transition-all" 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
            />
          </div>
          {currentUser.role === UserRole.ADMIN && (
            <button onClick={handleOpenCreate} className="bg-brand-yellow text-brand-dark font-black uppercase px-6 py-3 rounded-xl flex items-center gap-2 hover:bg-yellow-400 transition-all shadow-xl shadow-brand-yellow/20 whitespace-nowrap">
              <Plus size={18} /> Ajouter
            </button>
          )}
        </div>
      </div>

      {!activeFolder ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {categories.map(cat => (
            <div key={cat} onClick={() => setActiveFolder(cat)} className="bg-brand-light p-8 rounded-2xl border border-gray-700 hover:border-brand-yellow cursor-pointer flex flex-col items-center justify-center gap-4 transition-all hover:bg-white/5 shadow-xl group">
              <div className="bg-brand-dark p-4 rounded-2xl border border-gray-700 group-hover:border-brand-yellow transition-all">
                <Folder className="text-brand-yellow w-12 h-12" fill="currentColor" fillOpacity={0.1} />
              </div>
              <span className="font-black text-white text-lg uppercase tracking-tight text-center">{cat}</span>
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 bg-black/40 px-3 py-1 rounded-full">
                {specifications.filter(s => s.category === cat).length} éléments
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex-1 flex flex-col animate-fade-in">
          <button onClick={() => setActiveFolder(null)} className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 self-start font-black uppercase text-[10px] tracking-widest transition-all">
            <Folder size={16} /> Dossiers <ChevronRight size={14} /> <span className="text-brand-yellow">{activeFolder}</span>
          </button>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6 overflow-y-auto pb-10 custom-scrollbar pr-2">
            {filteredSpecs.map(spec => (
              <div key={spec.id} onClick={() => setViewingSpec(spec)} className="bg-brand-light rounded-2xl border border-gray-700 shadow-2xl overflow-hidden flex flex-col group cursor-pointer hover:border-brand-yellow/40 transition-all transform hover:-translate-y-1">
                <div className="relative h-56 bg-brand-darker overflow-hidden border-b border-gray-700">
                  {spec.imageUrl ? (
                    <img src={spec.imageUrl} alt={spec.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-700">
                      <LayoutTemplate size={48} className="opacity-20" />
                    </div>
                  )}
                  <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
                    <button onClick={(e) => { e.stopPropagation(); setViewingSpec(spec); }} className="bg-white text-brand-dark p-3 rounded-xl hover:bg-brand-yellow transition-all shadow-xl">
                      <Eye size={18} />
                    </button>
                    {currentUser.role === UserRole.ADMIN && (
                      <>
                        <button onClick={(e) => { e.stopPropagation(); handleOpenEdit(spec); }} className="bg-blue-500 text-white p-3 rounded-xl hover:bg-blue-600 transition-all shadow-xl">
                          <PenTool size={18} />
                        </button>
                        <button onClick={(e) => handleDelete(spec.id, e)} className="bg-red-500 text-white p-3 rounded-xl hover:bg-red-600 transition-all shadow-xl">
                          <Trash2 size={18} />
                        </button>
                      </>
                    )}
                  </div>
                  <div className="absolute bottom-4 left-4">
                     <span className="bg-brand-yellow text-brand-dark text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-lg">
                        {spec.brand}
                     </span>
                  </div>
                </div>
                <div className="p-6 flex-1 flex flex-col">
                  <h3 className="text-lg font-black text-white uppercase tracking-tight mb-2 group-hover:text-brand-yellow transition-colors">{spec.title}</h3>
                  <div className="flex items-center gap-2 mb-4">
                     <Tag size={12} className="text-gray-500" />
                     <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{spec.partType}</span>
                  </div>
                  <div className="mt-auto">
                    <p className="text-[11px] text-gray-400 bg-brand-dark/40 p-4 rounded-xl border border-gray-700/50 italic line-clamp-3 font-medium">
                      "{spec.installationType}"
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {viewingSpec && (
        <div className="fixed inset-0 bg-black/90 z-[60] flex items-center justify-center p-4 backdrop-blur-md">
          <div className="bg-white w-full max-w-5xl rounded-3xl shadow-2xl overflow-hidden animate-fade-in-up flex flex-col max-h-[95vh]">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50">
              <div className="flex items-center gap-4">
                 <button onClick={() => setViewingSpec(null)} className="p-2.5 text-gray-400 hover:text-black transition-colors bg-white rounded-xl shadow-sm border border-gray-100"><ArrowLeft size={20} /></button>
                 <div>
                    <h2 className="text-2xl font-black text-black uppercase tracking-tight">{viewingSpec.title}</h2>
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest flex items-center gap-2"><Folder size={12} className="text-brand-yellow"/> {viewingSpec.category}</p>
                 </div>
              </div>
              <div className="flex gap-3">
                 {currentUser.role === UserRole.ADMIN && (
                   <>
                    <button onClick={() => handleOpenEdit(viewingSpec)} className="bg-blue-500 text-white p-3 rounded-xl hover:bg-blue-600 transition-all flex items-center gap-2 font-black text-xs uppercase tracking-tight shadow-lg shadow-blue-500/20"><PenTool size={18} /> Modifier</button>
                    <button onClick={() => handleDelete(viewingSpec.id)} className="bg-red-500 text-white p-3 rounded-xl hover:bg-red-600 transition-all flex items-center gap-2 font-black text-xs uppercase tracking-tight shadow-lg shadow-red-500/20"><Trash2 size={18} /> Supprimer</button>
                   </>
                 )}
                 <button onClick={() => setViewingSpec(null)} className="text-gray-400 hover:text-black transition-colors"><X size={24} /></button>
              </div>
            </div>

            <div className="p-8 overflow-y-auto custom-scrollbar flex-1">
               <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                  <div className="lg:col-span-5 space-y-6">
                     <div className="rounded-2xl overflow-hidden border border-gray-200 bg-gray-50 shadow-inner group">
                        {viewingSpec.imageUrl ? (
                          <img src={viewingSpec.imageUrl} alt={viewingSpec.title} className="w-full h-auto object-contain max-h-[400px]" />
                        ) : (
                          <div className="w-full h-80 flex items-center justify-center text-gray-300">
                             <Camera size={64} className="opacity-20" />
                          </div>
                        )}
                     </div>
                     
                     <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 shadow-sm">
                           <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Marque</span>
                           <span className="text-lg font-black text-black uppercase tracking-tight">{viewingSpec.brand}</span>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 shadow-sm">
                           <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Référence</span>
                           <span className="text-lg font-black text-black uppercase tracking-tight">{viewingSpec.partType}</span>
                        </div>
                     </div>

                     {viewingSpec.documentUrl && (
                        <div className="bg-brand-dark p-6 rounded-2xl flex items-center justify-between border border-gray-700 shadow-xl group">
                           <div className="flex items-center gap-4">
                              <div className="bg-brand-yellow/10 p-3 rounded-xl"><FileText className="text-brand-yellow" size={24} /></div>
                              <div>
                                 <p className="text-xs font-black text-white uppercase tracking-tight">Fiche Technique Jointe</p>
                                 <p className="text-[10px] text-gray-500 font-bold truncate max-w-[200px]">{viewingSpec.documentName || 'Notice PDF'}</p>
                              </div>
                           </div>
                           <a href={viewingSpec.documentUrl} target="_blank" rel="noopener noreferrer" className="bg-white text-brand-dark p-3 rounded-xl hover:bg-brand-yellow transition-all shadow-lg group-hover:scale-110 transform">
                              <Download size={20} />
                           </a>
                        </div>
                     )}
                  </div>

                  <div className="lg:col-span-7 space-y-8">
                     <div className="bg-gray-50 p-8 rounded-3xl border border-gray-100 shadow-inner">
                        <div className="flex items-center gap-3 mb-6">
                           <div className="bg-brand-yellow/10 p-2 rounded-lg"><Info className="text-brand-yellow" size={20} /></div>
                           <h3 className="text-sm font-black text-black uppercase tracking-widest">Instructions d'Installation</h3>
                        </div>
                        <p className="text-gray-700 leading-relaxed font-bold text-lg border-l-4 border-brand-yellow pl-6 whitespace-pre-wrap">
                           {viewingSpec.installationType || 'Aucune instruction spécifique renseignée.'}
                        </p>
                     </div>

                     <div className="space-y-4">
                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Points de vigilance</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                           {[
                             "Respecter les préconisations constructeur",
                             "Vérifier l'étanchéité après pose",
                             "Utiliser l'outillage adapté",
                             "Conserver les pièces d'origine"
                           ].map((point, i) => (
                             <div key={i} className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
                                <CheckCircle2 className="text-green-500" size={16} />
                                <span className="text-xs font-black text-black uppercase tracking-tight">{point}</span>
                             </div>
                           ))}
                        </div>
                     </div>
                  </div>
               </div>
            </div>

            <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-4 rounded-b-3xl">
               <button onClick={() => setViewingSpec(null)} className="px-10 py-4 bg-black text-white font-black uppercase text-xs tracking-widest rounded-2xl hover:bg-brand-dark transition-all shadow-xl shadow-black/20">Fermer la fiche</button>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/80 z-[70] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-fade-in-up flex flex-col max-h-[95vh]">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50">
              <h2 className="text-xl font-black text-black uppercase tracking-tight">{isEditing ? 'Modifier la fiche' : 'Nouvelle fiche technique'}</h2>
              <button onClick={() => { stopCamera(); setShowModal(false); }} className="text-gray-400 hover:text-black transition-colors"><X size={24} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-6 overflow-y-auto custom-scrollbar">
              {isCameraOpen && (
                 <div className="fixed inset-0 bg-black z-[80] flex flex-col items-center justify-center">
                    <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-contain"></video>
                    <div className="absolute bottom-10 flex gap-6 items-center">
                        <button type="button" onClick={stopCamera} className="bg-red-500 p-4 rounded-full text-white shadow-xl"><X size={24} /></button>
                        <button type="button" onClick={takePhoto} className="bg-white p-6 rounded-full border-8 border-white/20 shadow-2xl"><div className="w-12 h-12 bg-brand-yellow rounded-full"></div></button>
                    </div>
                 </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Catégorie / Dossier</label>
                  <input type="text" required className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-black font-black outline-none focus:ring-2 focus:ring-brand-yellow transition-all" placeholder="Ex: Plomberie" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Nom de l'élément</label>
                  <input type="text" required className="w-full bg-gray-50 border border-gray-300 rounded-xl p-4 text-black font-black outline-none focus:ring-2 focus:ring-brand-yellow transition-all" placeholder="Ex: Mitigeur" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Marque</label>
                  <input type="text" required className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-black font-black outline-none focus:ring-2 focus:ring-brand-yellow transition-all" placeholder="Ex: Grohe" value={formData.brand} onChange={e => setFormData({...formData, brand: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Référence / Modèle</label>
                  <input type="text" required className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-black font-black outline-none focus:ring-2 focus:ring-brand-yellow transition-all" placeholder="Ex: Eurosmart" value={formData.partType} onChange={e => setFormData({...formData, partType: e.target.value})} />
                </div>
              </div>
              <div className="space-y-1">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Instructions de pose détaillées</label>
                <textarea rows={4} className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-black font-bold outline-none focus:ring-2 focus:ring-brand-yellow transition-all" placeholder="Décrivez les étapes d'installation..." value={formData.installationType} onChange={e => setFormData({...formData, installationType: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-5">
                 <div className="space-y-2">
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Image illustrative</label>
                    {!formData.imageUrl ? (
                       <button type="button" onClick={startCamera} className="w-full border-2 border-dashed border-gray-200 rounded-2xl p-6 flex flex-col items-center justify-center text-gray-400 hover:border-brand-yellow hover:bg-brand-yellow/5 transition-all h-36 group">
                          <Camera size={28} className="group-hover:text-brand-yellow transition-colors" />
                          <span className="text-[10px] font-black uppercase mt-2">Caméra</span>
                       </button>
                    ) : (
                       <div className="relative rounded-2xl overflow-hidden border border-gray-200 h-36 bg-gray-50 shadow-inner group">
                          <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-contain" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                             <button type="button" onClick={() => setFormData({...formData, imageUrl: ''})} className="bg-red-500 text-white p-2.5 rounded-xl shadow-xl hover:scale-110 transition-transform"><Trash2 size={16} /></button>
                          </div>
                       </div>
                    )}
                 </div>
                 <div className="space-y-2">
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Document / Notice</label>
                    <button type="button" onClick={() => fileInputRef.current?.click()} className="w-full border-2 border-dashed border-gray-200 rounded-2xl p-6 flex flex-col items-center justify-center text-gray-400 hover:border-brand-yellow hover:bg-brand-yellow/5 transition-all h-36 group">
                       <Upload size={28} className="group-hover:text-brand-yellow transition-colors" />
                       <span className="text-[10px] font-black uppercase mt-2">Fichier PDF</span>
                    </button>
                    <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".pdf,.doc,.docx" />
                    {formData.documentName && <p className="text-[9px] text-green-600 font-black uppercase truncate mt-1">{formData.documentName}</p>}
                 </div>
              </div>
              <canvas ref={canvasRef} className="hidden"></canvas>
              <div className="pt-6 flex gap-4 border-t border-gray-100 sticky bottom-0 bg-white">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-gray-100 text-gray-500 font-black uppercase py-4 rounded-xl hover:bg-gray-200 transition-all">Annuler</button>
                <button type="submit" className="flex-1 bg-brand-yellow text-brand-dark font-black uppercase py-4 rounded-xl hover:bg-yellow-400 shadow-xl shadow-brand-yellow/30 transition-all">
                   {isEditing ? 'Mettre à jour' : 'Enregistrer la fiche'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SpecificationsManager;
