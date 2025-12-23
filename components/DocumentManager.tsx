
import React, { useState, useRef, useEffect } from 'react';
import { DocumentFile, Club, User, UserRole } from '../types';
import { FileText, Image, File, Download, Trash2, Search, Eye, X, Upload, Building } from 'lucide-react';

interface DocumentManagerProps {
  documents: DocumentFile[];
  clubs: Club[];
  currentUser: User;
  onAddDocument: (doc: Partial<DocumentFile>) => void;
  onDeleteDocument: (id: string) => void;
}

const DocumentManager: React.FC<DocumentManagerProps> = ({ documents, clubs, currentUser, onAddDocument, onDeleteDocument }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Filtrer les clubs autorisés
  const allowedClubs = currentUser.role === UserRole.ADMIN
    ? clubs
    : clubs.filter(c => currentUser.clubIds.includes(c.id));

  const [selectedClubId, setSelectedClubId] = useState<string>(allowedClubs[0]?.id || '');

  // Mettre à jour la sélection si la liste des clubs change
  useEffect(() => {
    if (selectedClubId === '' && allowedClubs.length > 0) {
      setSelectedClubId(allowedClubs[0].id);
    }
  }, [allowedClubs]);

  // Filtrer les documents selon le club sélectionné et le terme de recherche
  const filteredDocuments = documents.filter(doc => {
    const isClubMatch = doc.clubId === selectedClubId;
    const isSearchMatch = doc.name.toLowerCase().includes(searchTerm.toLowerCase());
    return isClubMatch && isSearchMatch;
  });

  const getIcon = (type: string) => {
    switch (type) {
      case 'PDF': return <FileText className="text-red-400" size={32} />;
      case 'IMAGE': return <Image className="text-blue-400" size={32} />;
      case 'PLAN': return <File className="text-brand-yellow" size={32} />;
      default: return <File className="text-gray-400" size={32} />;
    }
  };

  const handleView = (doc: DocumentFile) => {
    window.open(doc.url, '_blank');
  };

  const handleDownload = (doc: DocumentFile) => {
    const link = document.createElement('a');
    link.href = doc.url;
    link.download = doc.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if(window.confirm("Êtes-vous sûr de vouloir supprimer ce document ?")) {
      onDeleteDocument(id);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.split('.').pop()?.toLowerCase();
    let type: 'PDF' | 'IMAGE' | 'PLAN' = 'PDF';
    if (['jpg', 'jpeg', 'png', 'webp'].includes(ext || '')) type = 'IMAGE';
    else if (['dwg', 'dxf'].includes(ext || '')) type = 'PLAN';

    const objectUrl = URL.createObjectURL(file);

    onAddDocument({
      name: file.name,
      type: type,
      url: objectUrl,
      date: new Date().toISOString().split('T')[0],
      clubId: selectedClubId
    });

    e.target.value = '';
  };

  return (
    <div className="space-y-6">
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        className="hidden" 
        accept=".pdf,.jpg,.jpeg,.png,.dwg"
      />

      {/* Toolbar */}
      <div className="flex flex-col gap-4 bg-brand-light p-6 rounded-2xl border border-gray-700 shadow-2xl">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <h2 className="text-xl font-black text-white flex items-center gap-3 uppercase tracking-tight">
             <div className="bg-brand-yellow/10 p-2 rounded-lg"><Building size={24} className="text-brand-yellow"/></div>
             Documents Techniques
          </h2>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
             <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">Club :</span>
             <select 
               value={selectedClubId}
               onChange={(e) => setSelectedClubId(e.target.value)}
               className="bg-brand-dark border border-gray-600 rounded-xl px-4 py-2.5 text-white font-black uppercase text-xs focus:border-brand-yellow outline-none w-full md:w-64 appearance-none cursor-pointer"
             >
               {allowedClubs.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
             </select>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-brand-yellow transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Rechercher un plan, une notice..." 
              className="w-full bg-gray-50 border border-gray-300 rounded-xl pl-10 pr-4 py-4 text-black font-black uppercase outline-none focus:ring-2 focus:ring-brand-yellow transition-all placeholder:text-gray-400"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            onClick={handleUploadClick}
            className="bg-brand-yellow text-brand-dark font-black uppercase tracking-tight px-8 py-2 rounded-xl hover:bg-yellow-400 transition-all shadow-xl shadow-brand-yellow/20 flex items-center gap-2 whitespace-nowrap justify-center"
          >
            <Upload size={18} />
            Téléverser
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 pb-10">
        {filteredDocuments.map(doc => (
          <div key={doc.id} className="bg-brand-light group rounded-2xl p-5 flex flex-col items-center text-center hover:border-brand-yellow/50 transition-all cursor-pointer relative shadow-xl border border-gray-700">
            <div className="mb-4 transform group-hover:scale-110 transition duration-500">
              {getIcon(doc.type)}
            </div>
            <h5 className="text-xs font-black text-white mb-1 truncate w-full uppercase tracking-tighter" title={doc.name}>{doc.name}</h5>
            <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest">{new Date(doc.date).toLocaleDateString('fr-FR')}</p>
            <span className="text-[8px] font-black uppercase bg-brand-dark px-3 py-1 rounded-full mt-3 text-brand-yellow border border-gray-700 tracking-widest">{doc.type}</span>

            {/* Hover Actions */}
            <div className="absolute inset-0 bg-brand-darker/90 rounded-2xl opacity-0 group-hover:opacity-100 flex items-center justify-center gap-3 transition-all backdrop-blur-sm">
               <button 
                onClick={() => handleView(doc)}
                className="p-3 bg-white rounded-xl text-brand-dark hover:bg-brand-yellow transition-all shadow-lg" 
                title="Ouvrir"
               >
                 <Eye size={18} />
               </button>
               <button 
                onClick={() => handleDownload(doc)}
                className="p-3 bg-gray-700 rounded-xl text-white hover:bg-gray-600 transition-all shadow-lg" 
                title="Télécharger"
               >
                 <Download size={18} />
               </button>
               <button 
                onClick={(e) => handleDelete(e, doc.id)}
                className="p-3 bg-red-500 rounded-xl text-white hover:bg-red-600 transition-all shadow-lg" 
                title="Supprimer"
               >
                 <Trash2 size={18} />
               </button>
            </div>
          </div>
        ))}

        {filteredDocuments.length === 0 && (
          <div className="col-span-full py-20 flex flex-col items-center justify-center text-gray-500 border-2 border-dashed border-gray-700 rounded-2xl bg-brand-light/30">
             <File size={48} className="mb-4 opacity-20" />
             <p className="font-black uppercase text-xs tracking-widest">Aucun document trouvé</p>
             <button onClick={handleUploadClick} className="text-brand-yellow hover:underline mt-4 font-black uppercase text-[10px] tracking-widest">Ajouter un fichier</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentManager;
