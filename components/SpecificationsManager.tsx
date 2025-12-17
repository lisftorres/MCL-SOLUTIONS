
import React, { useState, useRef } from 'react';
import { Specification, User } from '../types';
import { Folder, Search, Plus, X, Camera, RefreshCw, ChevronRight, PenTool, LayoutTemplate, Tag, Upload, FileText, Download, Trash2 } from 'lucide-react';

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

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm("Supprimer définitivement cette fiche technique ?")) {
      onDeleteSpecification(id);
    }
  };

  const startCamera = async () => {
    setIsCameraOpen(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      alert("Impossible d'accéder à la caméra.");
      setIsCameraOpen(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
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
        setFormData({ ...formData, imageUrl: canvas.toDataURL('image/jpeg', 0.8) });
        stopCamera();
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const objectUrl = URL.createObjectURL(file);
      setFormData({ ...formData, documentUrl: objectUrl, documentName: file.name });
    }
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="bg-brand-light p-6 rounded-lg shadow-lg flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2 uppercase">
            <PenTool className="text-brand-yellow" /> Cahier des Charges
          </h2>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-2.5 text-gray-500" size={18} />
            <input type="text" placeholder="Rechercher..." className="w-full bg-brand-dark border border-gray-600 rounded pl-10 pr-4 py-2 text-white outline-none" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          <button onClick={handleOpenCreate} className="bg-brand-yellow text-brand-dark font-black uppercase px-4 py-2 rounded flex items-center gap-2 hover:bg-yellow-400 transition whitespace-nowrap"><Plus size={18} /> Ajouter</button>
        </div>
      </div>

      {!activeFolder ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {categories.map(cat => (
            <div key={cat} onClick={() => setActiveFolder(cat)} className="bg-brand-light p-6 rounded-xl border border-gray-700 hover:border-brand-yellow cursor-pointer flex flex-col items-center justify-center gap-3 transition-all hover:bg-gray-700/50">
              <Folder className="text-brand-yellow w-16 h-16" fill="currentColor" fillOpacity={0.1} />
              <span className="font-bold text-white text-lg uppercase tracking-tight">{cat}</span>
              <span className="text-xs text-gray-400 bg-black/20 px-2 py-1 rounded">{specifications.filter(s => s.category === cat).length} fiches</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex-1 flex flex-col">
          <button onClick={() => setActiveFolder(null)} className="flex items-center gap-2 text-gray-400 hover:text-white mb-4 self-start font-bold uppercase text-xs tracking-widest"><Folder size={16} /> Dossiers <ChevronRight size={16} /> <span className="text-brand-yellow">{activeFolder}</span></button>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 overflow-y-auto pb-10">
            {filteredSpecs.map(spec => (
              <div key={spec.id} className="bg-brand-light rounded-xl border border-gray-700 shadow-lg overflow-hidden flex flex-col group">
                <div className="relative h-48 bg-gray-900 overflow-hidden">
                  {spec.imageUrl ? <img src={spec.imageUrl} alt={spec.title} className="w-full h-full object-cover transition-transform group-hover:scale-110" /> : <div className="w-full h-full flex items-center justify-center text-gray-600"><Camera size={48} /></div>}
                  <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleOpenEdit(spec)} className="bg-blue-500 p-2 rounded-lg text-white hover:bg-blue-600 shadow-xl"><PenTool size={16}/></button>
                    <button onClick={(e) => handleDelete(spec.id, e)} className="bg-red-500 p-2 rounded-lg text-white hover:bg-red-600 shadow-xl"><Trash2 size={16}/></button>
                  </div>
                </div>
                <div className="p-5 flex-1 flex flex-col">
                  <h3 className="text-xl font-black text-white uppercase tracking-tight mb-4">{spec.title}</h3>
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <div className="bg-brand-dark/50 p-2 rounded border border-gray-700"><span className="text-[10px] text-gray-500 block uppercase font-black">Marque</span><span className="text-sm font-bold text-brand-yellow">{spec.brand}</span></div>
                    <div className="bg-brand-dark/50 p-2 rounded border border-gray-700"><span className="text-[10px] text-gray-500 block uppercase font-black">Référence</span><span className="text-sm font-bold text-white">{spec.partType}</span></div>
                  </div>
                  <div className="mt-auto">
                    <p className="text-xs text-gray-400 bg-brand-dark p-3 rounded-lg border border-gray-700 italic line-clamp-3">"{spec.installationType}"</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50">
              <h2 className="text-xl font-black text-black uppercase tracking-tight">{isEditing ? 'Modifier la fiche' : 'Nouvelle fiche technique'}</h2>
              <button onClick={() => { stopCamera(); setShowModal(false); }} className="text-gray-400 hover:text-black"><X size={24} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              {isCameraOpen && (
                 <div className="fixed inset-0 bg-black z-[60] flex flex-col items-center justify-center">
                    <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-contain"></video>
                    <div className="absolute bottom-10 flex gap-6 items-center">
                        <button type="button" onClick={stopCamera} className="bg-red-50 p-4 rounded-full text-white shadow-xl"><X size={24} /></button>
                        <button type="button" onClick={takePhoto} className="bg-white p-6 rounded-full border-8 border-white/20 shadow-2xl"><div className="w-12 h-12 bg-brand-yellow rounded-full"></div></button>
                    </div>
                 </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-black text-black uppercase tracking-widest">Catégorie / Dossier</label>
                  <input type="text" required className="w-full bg-gray-50 border border-gray-300 rounded-xl p-4 text-black font-black outline-none" placeholder="Ex: Plomberie" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-black text-black uppercase tracking-widest">Nom de l'élément</label>
                  <input type="text" required className="w-full bg-gray-50 border border-gray-300 rounded-xl p-4 text-black font-black outline-none" placeholder="Ex: Mitigeur" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-black text-black uppercase tracking-widest">Marque</label>
                  <input type="text" required className="w-full bg-gray-50 border border-gray-300 rounded-xl p-4 text-black font-black outline-none" placeholder="Ex: Grohe" value={formData.brand} onChange={e => setFormData({...formData, brand: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-black text-black uppercase tracking-widest">Référence / Modèle</label>
                  <input type="text" required className="w-full bg-gray-50 border border-gray-300 rounded-xl p-4 text-black font-black outline-none" placeholder="Ex: Eurosmart" value={formData.partType} onChange={e => setFormData({...formData, partType: e.target.value})} />
                </div>
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-black text-black uppercase tracking-widest">Instructions de pose</label>
                <textarea rows={4} className="w-full bg-gray-50 border border-gray-300 rounded-xl p-4 text-black font-bold outline-none" placeholder="Détails techniques..." value={formData.installationType} onChange={e => setFormData({...formData, installationType: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-xs font-black text-black uppercase tracking-widest mb-2">Photo</label>
                    {!formData.imageUrl ? (
                       <button type="button" onClick={startCamera} className="w-full border-2 border-dashed border-gray-300 rounded-2xl p-6 flex flex-col items-center justify-center text-gray-400 hover:border-brand-yellow hover:bg-brand-yellow/5 transition h-32"><Camera size={24} /><span className="text-[10px] font-black uppercase mt-1">Caméra</span></button>
                    ) : (
                       <div className="relative rounded-xl overflow-hidden border border-gray-300 h-32 bg-black"><img src={formData.imageUrl} alt="Preview" className="w-full h-full object-contain" /><button type="button" onClick={() => setFormData({...formData, imageUrl: ''})} className="absolute top-2 right-2 bg-red-500 p-1.5 rounded-full text-white shadow-xl"><X size={12} /></button></div>
                    )}
                 </div>
                 <div>
                    <label className="block text-xs font-black text-black uppercase tracking-widest mb-2">Document</label>
                    <button type="button" onClick={() => fileInputRef.current?.click()} className="w-full border-2 border-dashed border-gray-300 rounded-2xl p-6 flex flex-col items-center justify-center text-gray-400 hover:border-brand-yellow hover:bg-brand-yellow/5 transition h-32"><Upload size={24} /><span className="text-[10px] font-black uppercase mt-1">Fichier</span></button>
                    <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
                 </div>
              </div>
              <div className="pt-6 flex gap-4 border-t border-gray-100">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-gray-100 text-gray-500 font-black uppercase py-4 rounded-xl">Annuler</button>
                <button type="submit" className="flex-1 bg-brand-yellow text-brand-dark font-black uppercase py-4 rounded-xl hover:bg-yellow-400 shadow-xl shadow-brand-yellow/20">Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SpecificationsManager;
