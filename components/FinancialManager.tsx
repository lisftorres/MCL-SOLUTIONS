
import React, { useState, useRef, useEffect } from 'react';
import { Club, DocumentFile, User, UserRole } from '../types';
import { FileText, Download, Upload, Trash2, Euro, Eye, X, Building, Calendar, ChevronDown } from 'lucide-react';

interface FinancialManagerProps {
  documents: DocumentFile[];
  clubs: Club[];
  currentUser: User;
  onAddDocument?: (doc: Partial<DocumentFile>) => void;
  onDeleteDocument?: (id: string) => void;
}

const FinancialManager: React.FC<FinancialManagerProps> = ({ documents, clubs, currentUser, onAddDocument, onDeleteDocument }) => {
  // Filtrer les clubs autorisés
  const allowedClubs = currentUser.role === UserRole.ADMIN
    ? clubs
    : clubs.filter(c => currentUser.clubIds.includes(c.id));

  const [selectedClubId, setSelectedClubId] = useState<string>(allowedClubs[0]?.id || '');
  const [activeTab, setActiveTab] = useState<'QUOTES' | 'INVOICES'>('QUOTES');
  const [viewingDoc, setViewingDoc] = useState<DocumentFile | null>(null);
  
  // Reference to hidden file input
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Mettre à jour si les clubs changent
  useEffect(() => {
    if (selectedClubId === '' && allowedClubs.length > 0) {
      setSelectedClubId(allowedClubs[0].id);
    }
  }, [allowedClubs]);

  // Filter documents based on selection
  const filteredDocs = documents.filter(doc => {
    const isClubMatch = doc.clubId === selectedClubId;
    const isTypeMatch = activeTab === 'QUOTES' ? doc.type === 'QUOTE' : doc.type === 'INVOICE';
    return isClubMatch && isTypeMatch;
  });

  // Grouping Logic: Year -> Month -> Docs
  const groupedDocs = filteredDocs.reduce((acc, doc) => {
    const date = new Date(doc.date);
    const year = date.getFullYear().toString();
    const month = date.getMonth().toString(); // 0-11

    if (!acc[year]) acc[year] = {};
    if (!acc[year][month]) acc[year][month] = [];

    acc[year][month].push(doc);
    return acc;
  }, {} as Record<string, Record<string, DocumentFile[]>>);

  // Get sorted years (descending)
  const sortedYears = Object.keys(groupedDocs).sort((a, b) => Number(b) - Number(a));

  const getMonthName = (monthIndex: string) => {
    const date = new Date();
    date.setMonth(parseInt(monthIndex));
    return new Intl.DateTimeFormat('fr-FR', { month: 'long' }).format(date);
  };

  const handleUploadClick = () => {
    // Trigger the hidden file input
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Create a local object URL for preview purposes
    const objectUrl = URL.createObjectURL(file);

    if (onAddDocument) {
      onAddDocument({
        name: file.name,
        type: activeTab === 'QUOTES' ? 'QUOTE' : 'INVOICE',
        clubId: selectedClubId,
        date: new Date().toISOString().split('T')[0],
        url: objectUrl 
      });
    }

    // Reset input so the same file can be selected again if needed
    e.target.value = '';
  };

  const handleDelete = (id: string) => {
    if(window.confirm("Supprimer ce document financier ?") && onDeleteDocument) {
      onDeleteDocument(id);
    }
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      {/* Hidden File Input */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        className="hidden" 
        accept=".pdf,.jpg,.jpeg,.png"
      />

      {/* Header */}
      <div className="bg-gym-light p-6 rounded-lg shadow-lg flex flex-col md:flex-row justify-between items-center gap-4">
         <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
               <Euro className="text-gym-yellow" />
               Devis & Factures
            </h2>
            <p className="text-gray-400 text-sm mt-1">Gestion administrative et financière centralisée par club.</p>
         </div>

         <div className="flex items-center gap-3">
            <Building className="text-gray-400" size={20} />
            <select 
              value={selectedClubId}
              onChange={(e) => setSelectedClubId(e.target.value)}
              className="bg-gym-dark border border-gray-600 rounded px-4 py-2 text-white outline-none min-w-[200px]"
            >
               {allowedClubs.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
         </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-gym-darker p-1 rounded-lg w-fit">
        <button 
          onClick={() => setActiveTab('QUOTES')}
          className={`px-6 py-2 rounded-md text-sm font-bold transition-all ${activeTab === 'QUOTES' ? 'bg-gym-yellow text-gym-dark shadow' : 'text-gray-400 hover:text-white'}`}
        >
          Devis (Estimations)
        </button>
        <button 
          onClick={() => setActiveTab('INVOICES')}
          className={`px-6 py-2 rounded-md text-sm font-bold transition-all ${activeTab === 'INVOICES' ? 'bg-gym-yellow text-gym-dark shadow' : 'text-gray-400 hover:text-white'}`}
        >
          Factures (Réalisé)
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 bg-gym-light rounded-xl border border-gray-700 shadow-lg p-6 flex flex-col">
         
         <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-white">
               {activeTab === 'QUOTES' ? 'Devis en attente & validés' : 'Historique des Factures'}
            </h3>
            <button 
               onClick={handleUploadClick}
               className="bg-gym-dark border border-dashed border-gray-500 text-gym-yellow px-4 py-2 rounded hover:border-gym-yellow hover:bg-gym-yellow/10 transition flex items-center gap-2"
            >
               <Upload size={18} />
               Ajouter {activeTab === 'QUOTES' ? 'un devis' : 'une facture'}
            </button>
         </div>

         {/* Document List Grouped by Year/Month */}
         <div className="space-y-6 overflow-y-auto custom-scrollbar pr-2">
            
            {sortedYears.map(year => (
               <div key={year} className="space-y-4">
                  <div className="flex items-center gap-2">
                     <span className="text-3xl font-black text-gray-600/50">{year}</span>
                     <div className="h-px bg-gray-700 flex-1"></div>
                  </div>

                  {Object.keys(groupedDocs[year]).sort((a,b) => Number(b) - Number(a)).map(month => (
                     <div key={`${year}-${month}`} className="ml-2 md:ml-6">
                        <h4 className="text-gym-yellow font-bold uppercase text-sm mb-3 flex items-center gap-2">
                           <Calendar size={14} />
                           {getMonthName(month)}
                        </h4>
                        
                        <div className="space-y-3">
                           {groupedDocs[year][month].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(doc => (
                              <div key={doc.id} className="bg-gym-dark p-4 rounded-lg border border-gray-700 hover:border-gym-yellow/50 transition flex items-center justify-between group">
                                 <div className="flex items-center gap-4">
                                    <div className={`p-3 rounded-lg ${doc.type === 'QUOTE' ? 'bg-blue-500/20 text-blue-400' : 'bg-green-500/20 text-green-400'}`}>
                                       <FileText size={24} />
                                    </div>
                                    <div>
                                       <h4 className="font-bold text-white text-base md:text-lg">{doc.name}</h4>
                                       <p className="text-gray-400 text-xs md:text-sm">{new Date(doc.date).toLocaleDateString('fr-FR')} • ID: {doc.id.toUpperCase()}</p>
                                    </div>
                                 </div>

                                 <div className="flex items-center gap-2 md:gap-3">
                                    <button 
                                       onClick={() => setViewingDoc(doc)}
                                       className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition"
                                       title="Voir"
                                    >
                                       <Eye size={20} />
                                    </button>
                                    <button className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition hidden md:block" title="Télécharger">
                                       <Download size={20} />
                                    </button>
                                    <button 
                                       onClick={() => handleDelete(doc.id)}
                                       className="p-2 text-gray-600 hover:text-red-400 hover:bg-red-500/10 rounded-full transition opacity-0 group-hover:opacity-100"
                                       title="Supprimer"
                                    >
                                       <Trash2 size={20} />
                                    </button>
                                 </div>
                              </div>
                           ))}
                        </div>
                     </div>
                  ))}
               </div>
            ))}

            {filteredDocs.length === 0 && (
               <div className="text-center py-12 text-gray-500 border-2 border-dashed border-gray-700 rounded-lg">
                  <Euro size={48} className="mx-auto mb-3 opacity-30" />
                  <p>Aucun document pour ce club.</p>
                  <button onClick={handleUploadClick} className="text-gym-yellow hover:underline mt-2">Ajouter maintenant</button>
               </div>
            )}
         </div>
      </div>

      {/* Viewer Modal */}
      {viewingDoc && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
          <div className="bg-gym-light w-full max-w-4xl h-[80vh] rounded-xl flex flex-col shadow-2xl overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-gray-700 bg-gym-darker">
              <div className="flex items-center gap-3">
                 <FileText className="text-gym-yellow" />
                 <div>
                    <h3 className="text-lg font-bold text-white">{viewingDoc.name}</h3>
                    <p className="text-xs text-gray-400">{viewingDoc.date} - {viewingDoc.type}</p>
                 </div>
              </div>
              <button onClick={() => setViewingDoc(null)} className="text-gray-400 hover:text-white bg-white/10 p-2 rounded-full">
                <X size={20} />
              </button>
            </div>
            
            <div className="flex-1 bg-gray-900 flex items-center justify-center overflow-auto p-4 relative">
                <div className="text-center text-gray-400">
                   {/* Preview Logic: If it's a blob/object URL created from an image, show image. Otherwise show fake PDF viewer */}
                   {viewingDoc.url.startsWith('blob:') && (viewingDoc.name.endsWith('.jpg') || viewingDoc.name.endsWith('.png') || viewingDoc.name.endsWith('.jpeg')) ? (
                      <img src={viewingDoc.url} alt="Preview" className="max-w-full max-h-[70vh] object-contain shadow-lg" />
                   ) : (
                     <div className="bg-white text-black w-[500px] min-h-[600px] mx-auto shadow-2xl p-10 text-left relative">
                        {/* Fake Invoice/Quote Layout */}
                        <div className="flex justify-between mb-8">
                           <div className="font-bold text-2xl uppercase tracking-widest text-gray-800">
                              {viewingDoc.type === 'QUOTE' ? 'DEVIS' : 'FACTURE'}
                           </div>
                           <div className="text-right text-sm text-gray-500">
                              <p>Date: {viewingDoc.date}</p>
                              <p>Ref: {viewingDoc.id.toUpperCase()}</p>
                           </div>
                        </div>
                        <div className="mb-8">
                           <h4 className="font-bold text-sm mb-2 text-gray-600 uppercase">Émis pour :</h4>
                           <p className="text-lg font-bold">MCL SOLUTIONS</p>
                           <p>Service Maintenance</p>
                        </div>
                        <table className="w-full mb-8">
                           <thead>
                              <tr className="border-b-2 border-gray-800 text-sm font-bold">
                                 <th className="text-left py-2">Description</th>
                                 <th className="text-right py-2">Total</th>
                              </tr>
                           </thead>
                           <tbody>
                              <tr className="border-b border-gray-200">
                                 <td className="py-4 text-gray-700">{viewingDoc.name}</td>
                                 <td className="py-4 text-right font-mono">--,-- €</td>
                              </tr>
                              <tr className="border-b border-gray-200">
                                 <td className="py-4 text-gray-700">Détails du document importé...</td>
                                 <td className="py-4 text-right font-mono">--,-- €</td>
                              </tr>
                           </tbody>
                        </table>
                        <div className="text-right">
                           <p className="text-xl font-bold mt-2">Document Importé</p>
                        </div>
                        
                        <div className="absolute bottom-10 left-10 right-10 text-center text-xs text-gray-400">
                           Prévisualisation générique pour les fichiers locaux
                        </div>
                     </div>
                   )}
                </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default FinancialManager;
