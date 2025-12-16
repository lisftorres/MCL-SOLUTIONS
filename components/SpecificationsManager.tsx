


import React, { useState, useRef } from 'react';
import { Specification, User } from '../types';
import { Folder, Search, Plus, X, Camera, RefreshCw, ChevronRight, PenTool, LayoutTemplate, Tag, Upload, FileText, Download } from 'lucide-react';

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
  
  // Modal & Form State
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

  // Camera State (similar to TicketManager)
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Group by Category
  const categories = Array.from(new Set(specifications.map(s => s.category))).sort();
  const filteredSpecs = specifications.filter(s => {
    const matchesSearch = s.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          s.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          s.partType.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFolder = activeFolder ? s.category === activeFolder : true;
    return matchesSearch && matchesFolder;
  });

  // Handlers
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

  const handleDelete = (id: string) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cette fiche technique ?")) {
      onDeleteSpecification(id);
    }
  };

  // Camera Functions
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
      setFormData({ 
        ...formData, 
        documentUrl: objectUrl,
        documentName: file.name
      });
    }
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      {/* Header */}
      <div className="bg-gym-light p-6 rounded-lg shadow-lg flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <PenTool className="text-gym-yellow" />
            Cahier des Charges
          </h2>
          <p className="text-gray-400 text-sm mt-1">Standards techniques, marques et instructions de pose.</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-2.5 text-gray-500" size={18} />
            <input 
              type="text" 
              placeholder="Rechercher une pièce..." 
              className="w-full bg-gym-dark border border-gray-600 rounded pl-10 pr-4 py-2 text-white focus:border-gym-yellow outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            onClick={handleOpenCreate}
            className="bg-gym-yellow text-gym-dark font-bold px-4 py-2 rounded flex items-center gap-2 hover:bg-yellow-400 transition whitespace-nowrap"
          >
            <Plus size={18} /> Ajouter
          </button>
        </div>
      </div>

      {/* Navigation Breadcrumb / Folders */}
      {!activeFolder ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {categories.map(cat => (
            <div 
              key={cat}
              onClick={() => setActiveFolder(cat)}
              className="bg-gym-light p-6 rounded-xl border border-gray-700 hover:border-gym-yellow cursor-pointer flex flex-col items-center justify-center gap-3 transition-all hover:bg-gray-700/50"
            >
              <Folder className="text-gym-yellow w-16 h-16" fill="#F7CE3E" fillOpacity={0.2} />
              <span className="font-bold text-white text-lg">{cat}</span>
              <span className="text-xs text-gray-400 bg-black/20 px-2 py-1 rounded">
                {specifications.filter(s => s.category === cat).length} fiches
              </span>
            </div>
          ))}
          {categories.length === 0 && (
             <div className="col-span-full text-center py-10 text-gray-500">
               Aucun dossier créé. Cliquez sur "Ajouter" pour commencer.
             </div>
          )}
        </div>
      ) : (
        <div className="flex-1 flex flex-col">
          <button 
            onClick={() => setActiveFolder(null)}
            className="flex items-center gap-2 text-gray-400 hover:text-white mb-4 self-start"
          >
             <Folder size={16} /> Dossiers <ChevronRight size={16} /> <span className="text-gym-yellow font-bold">{activeFolder}</span>
          </button>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 overflow-y-auto pb-10">
            {filteredSpecs.map(spec => (
              <div key={spec.id} className="bg-gym-light rounded-xl border border-gray-700 shadow-lg overflow-hidden flex flex-col">
                <div className="relative h-48 bg-gray-900 group">
                  {spec.imageUrl ? (
                    <img src={spec.imageUrl} alt={spec.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-600">
                      <Camera size={48} />
                    </div>
                  )}
                  {/* Edit/Delete Overlay */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                    <button onClick={() => handleOpenEdit(spec)} className="bg-blue-500 p-2 rounded-full text-white hover:bg-blue-600"><PenTool size={20}/></button>
                    <button onClick={() => handleDelete(spec.id)} className="bg-red-500 p-2 rounded-full text-white hover:bg-red-600"><X size={20}/></button>
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-bold text-white">{spec.title}</h3>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <div className="bg-gym-dark/50 p-2 rounded">
                      <span className="text-xs text-gray-500 block uppercase">Marque</span>
                      <span className="text-sm font-semibold text-gym-yellow">{spec.brand}</span>
                    </div>
                    <div className="bg-gym-dark/50 p-2 rounded">
                       <span className="text-xs text-gray-500 block uppercase">Type de pièce</span>
                       <span className="text-sm font-semibold text-white">{spec.partType}</span>
                    </div>
                  </div>

                  <div className="mt-auto space-y-3">
                    <div>
                      <span className="text-xs text-gray-500 uppercase flex items-center gap-1 mb-1">
                        <LayoutTemplate size={12} /> Type de pose & Instructions
                      </span>
                      <p className="text-sm text-gray-300 bg-gym-dark p-3 rounded border border-gray-600/50 italic line-clamp-3">
                        {spec.installationType}
                      </p>
                    </div>

                    {spec.documentUrl && (
                      <a 
                        href={spec.documentUrl} 
                        target="_blank" 
                        rel="noreferrer"
                        className="flex items-center gap-2 bg-gym-dark border border-dashed border-gray-500 p-2 rounded hover:bg-white/5 transition text-gym-yellow text-sm"
                      >
                         <FileText size={16} />
                         <span className="truncate flex-1">{spec.documentName || 'Document joint'}</span>
                         <Download size={14} />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-gym-light w-full max-w-2xl rounded-xl shadow-2xl border border-gray-600 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-700 sticky top-0 bg-gym-light z-10">
              <h2 className="text-xl font-bold text-white">
                {isEditing ? 'Modifier la fiche technique' : 'Nouvelle fiche technique'}
              </h2>
              <button onClick={() => { stopCamera(); setShowModal(false); }}><X className="text-gray-400 hover:text-white" /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              
              {/* Camera Overlay */}
              {isCameraOpen && (
                 <div className="fixed inset-0 bg-black z-[60] flex flex-col items-center justify-center">
                    <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-contain"></video>
                    <canvas ref={canvasRef} className="hidden"></canvas>
                    <div className="absolute bottom-10 flex gap-6 items-center">
                        <button type="button" onClick={stopCamera} className="bg-red-500 p-4 rounded-full text-white"><X size={24} /></button>
                        <button type="button" onClick={takePhoto} className="bg-white p-5 rounded-full border-4 border-gray-300 shadow-lg"><div className="w-16 h-16 bg-transparent"></div></button>
                    </div>
                 </div>
              )}

              {/* Hidden File Input */}
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileUpload}
                className="hidden"
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Dossier (Catégorie)</label>
                  <div className="relative">
                    <Folder className="absolute left-3 top-2.5 text-gray-500" size={18} />
                    <input 
                      type="text" 
                      required
                      className="w-full bg-gym-dark border border-gray-600 rounded pl-10 pr-4 py-2 text-white outline-none focus:border-gym-yellow"
                      placeholder="Ex: Plomberie"
                      value={formData.category}
                      onChange={e => setFormData({...formData, category: e.target.value})}
                      list="category-suggestions"
                    />
                    <datalist id="category-suggestions">
                      {categories.map(c => <option key={c} value={c} />)}
                    </datalist>
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Nom de l'élément</label>
                  <input 
                    type="text" 
                    required
                    className="w-full bg-gym-dark border border-gray-600 rounded px-4 py-2 text-white outline-none focus:border-gym-yellow"
                    placeholder="Ex: Mitigeur Lavabo"
                    value={formData.title}
                    onChange={e => setFormData({...formData, title: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Marque</label>
                  <div className="relative">
                     <Tag className="absolute left-3 top-2.5 text-gray-500" size={18} />
                     <input 
                      type="text" 
                      required
                      className="w-full bg-gym-dark border border-gray-600 rounded pl-10 pr-4 py-2 text-white outline-none focus:border-gym-yellow"
                      placeholder="Ex: Grohe"
                      value={formData.brand}
                      onChange={e => setFormData({...formData, brand: e.target.value})}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Type de pièce / Référence</label>
                  <input 
                    type="text" 
                    required
                    className="w-full bg-gym-dark border border-gray-600 rounded px-4 py-2 text-white outline-none focus:border-gym-yellow"
                    placeholder="Ex: Eurosmart 2023"
                    value={formData.partType}
                    onChange={e => setFormData({...formData, partType: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Type de pose / Instructions</label>
                <textarea 
                  rows={4}
                  className="w-full bg-gym-dark border border-gray-600 rounded p-3 text-white outline-none focus:border-gym-yellow"
                  placeholder="Détails techniques pour l'installation..."
                  value={formData.installationType}
                  onChange={e => setFormData({...formData, installationType: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                    <label className="block text-sm text-gray-400 mb-2">Photo de la pièce</label>
                    {!formData.imageUrl ? (
                       <button 
                         type="button"
                         onClick={startCamera}
                         className="w-full border-2 border-dashed border-gray-600 rounded-lg p-6 flex flex-col items-center justify-center text-gray-400 hover:text-gym-yellow hover:border-gym-yellow hover:bg-gym-yellow/5 transition h-40"
                       >
                         <Camera size={24} className="mb-2" />
                         <span className="text-xs">Prendre photo</span>
                       </button>
                    ) : (
                       <div className="relative rounded-lg overflow-hidden border border-gray-600 h-40 bg-black">
                          <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-contain" />
                          <button 
                            type="button"
                            onClick={() => setFormData({...formData, imageUrl: ''})}
                            className="absolute top-2 right-2 bg-red-500 p-1.5 rounded-full text-white hover:bg-red-600"
                          >
                            <X size={12} />
                          </button>
                       </div>
                    )}
                 </div>

                 <div>
                    <label className="block text-sm text-gray-400 mb-2">Document Joint (PDF...)</label>
                    {!formData.documentUrl ? (
                       <button 
                         type="button"
                         onClick={triggerFileUpload}
                         className="w-full border-2 border-dashed border-gray-600 rounded-lg p-6 flex flex-col items-center justify-center text-gray-400 hover:text-gym-yellow hover:border-gym-yellow hover:bg-gym-yellow/5 transition h-40"
                       >
                         <Upload size={24} className="mb-2" />
                         <span className="text-xs">Importer fichier (Ordinateur)</span>
                       </button>
                    ) : (
                       <div className="relative rounded-lg overflow-hidden border border-gray-600 h-40 bg-gym-dark flex flex-col items-center justify-center p-4">
                          <FileText size={40} className="text-gym-yellow mb-2" />
                          <p className="text-xs text-center text-white truncate w-full">{formData.documentName || 'Document'}</p>
                          <button 
                            type="button"
                            onClick={() => setFormData({...formData, documentUrl: '', documentName: ''})}
                            className="absolute top-2 right-2 bg-red-500 p-1.5 rounded-full text-white hover:bg-red-600"
                          >
                            <X size={12} />
                          </button>
                       </div>
                    )}
                 </div>
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
                  {isEditing ? 'Enregistrer les modifications' : 'Ajouter la fiche'}
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