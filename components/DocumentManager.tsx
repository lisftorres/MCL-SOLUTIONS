

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

  // Filtrer les documents selon le club sélectionné
  const filteredDocuments = documents.filter(doc => doc.clubId === selectedClubId);

  const getIcon = (type: string) => {
    switch (type) {
      case 'PDF': return <FileText className="text-red-400" size={32} />;
      case 'IMAGE': return <Image className="text-blue-400" size={32} />;
      case 'PLAN': return <File className="text-yellow-400" size={32} />;
      default: return <File className="text-gray-400" size={32} />;
    }
  };

  // Ouvre le document dans un nouvel onglet (déclenche le visualiseur PDF du navigateur/système)
  const handleView = (doc: DocumentFile) => {
    window.open(doc.url, '_blank');
  };

  // Déclenche le téléchargement du fichier
  const handleDownload = (doc: DocumentFile) => {
    const link = document.createElement('a');
    link.href = doc.url;
    link.download = doc.name; // Force le téléchargement avec le nom du fichier
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

    // Détermination simple du type
    const ext = file.name.split('.').pop()?.toLowerCase();
    let type: 'PDF' | 'IMAGE' | 'PLAN' = 'PDF';
    if (['jpg', 'jpeg', 'png', 'webp'].includes(ext || '')) type = 'IMAGE';
    else if (['dwg', 'dxf'].includes(ext || '')) type = 'PLAN';

    // Création d'une URL locale pour la prévisualisation
    const objectUrl = URL.createObjectURL(file);

    onAddDocument({
      name: file.name,
      type: type,
      url: objectUrl,
      date: new Date().toISOString().split('T')[0],
      clubId: selectedClubId // Utiliser le club sélectionné
    });

    // Reset input
    e.target.value = '';
  };

  return (
    <div className="space-y-6">
      {/* Hidden File Input */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        className="hidden" 
        accept=".pdf,.jpg,.jpeg,.png,.dwg"
      />

      {/* Toolbar */}
      <div className="flex flex-col gap-4 bg-gym-light p-4 rounded-lg shadow-lg">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
             <Building size={24} className="text-gym-yellow"/>
             Documents Techniques
          </h2>
          
          <div className="flex items-center gap-2 w-full md:w-auto">
             <span className="text-sm text-gray-400 whitespace-nowrap">Club :</span>
             <select 
               value={selectedClubId}
               onChange={(e) => setSelectedClubId(e.target.value)}
               className="bg-gym-dark border border-gray-600 rounded px-3 py-2 text-white focus:border-gym-yellow outline-none w-full md:w-64"
             >
               {allowedClubs.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
             </select>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 text-gray-500" size={18} />
            <input 
              type="text" 
              placeholder="Rechercher un plan, une notice..." 
              className="w-full bg-gym-dark border border-gray-600 rounded pl-10 pr-4 py-2 text-white focus:border-gym-yellow outline-none"
            />
          </div>
          <button 
            onClick={handleUploadClick}
            className="bg-gym-dark border border-dashed border-gray-500 text-gym-yellow px-6 py-2 rounded hover:border-gym-yellow hover:bg-gym-yellow/10 transition flex items-center gap-2 whitespace-nowrap justify-center"
          >
            <Upload size={18} />
            Téléverser un document
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {filteredDocuments.map(doc => (
          <div key={doc.id} className="bg-gym-light group rounded-xl p-4 flex flex-col items-center text-center hover:bg-gray-600 transition cursor-pointer relative shadow-md border border-gray-700/50">
            <div className="mb-3 transform group-hover:scale-110 transition duration-300">
              {getIcon(doc.type)}
            </div>
            <h5 className="text-sm font-semibold text-white mb-1 truncate w-full" title={doc.name}>{doc.name}</h5>
            <p className="text-xs text-gray-400">{new Date(doc.date).toLocaleDateString()}</p>
            <span className="text-[10px] uppercase bg-black/30 px-2 py-0.5 rounded mt-2 text-gray-400">{doc.type}</span>

            {/* Hover Actions */}
            <div className="absolute inset-0 bg-black/60 rounded-xl opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-opacity backdrop-blur-sm">
               <button 
                onClick={() => handleView(doc)}
                className="p-2 bg-white rounded-full text-gym-dark hover:bg-gym-yellow transition" 
                title="Ouvrir (Visualiseur Système)"
               >
                 <Eye size={16} />
               </button>
               <button 
                onClick={() => handleDownload(doc)}
                className="p-2 bg-gray-700 rounded-full text-white hover:bg-gray-600 transition" 
                title="Télécharger sur l'ordinateur"
               >
                 <Download size={16} />
               </button>
               <button 
                onClick={(e) => handleDelete(e, doc.id)}
                className="p-2 bg-red-500 rounded-full text-white hover:bg-red-600 transition" 
                title="Supprimer"
               >
                 <Trash2 size={16} />
               </button>
            </div>
          </div>
        ))}

        {filteredDocuments.length === 0 && (
          <div className="col-span-full py-12 flex flex-col items-center justify-center text-gray-500 border-2 border-dashed border-gray-700 rounded-xl">
             <Upload size={48} className="mb-4 opacity-30" />
             <p>Aucun document technique pour ce club</p>
             <button onClick={handleUploadClick} className="text-gym-yellow hover:underline mt-2">Ajouter un fichier</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentManager;
