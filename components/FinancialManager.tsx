
import React, { useState, useRef, useEffect } from 'react';
import { Club, DocumentFile, User, UserRole } from '../types';
import { FileText, Download, Upload, Trash2, Euro, Eye, X, Building, Calendar } from 'lucide-react';

interface FinancialManagerProps {
  documents: DocumentFile[];
  clubs: Club[];
  currentUser: User;
  onAddDocument?: (doc: Partial<DocumentFile>) => void;
  onDeleteDocument?: (id: string) => void;
}

const FinancialManager: React.FC<FinancialManagerProps> = ({ documents, clubs, currentUser, onAddDocument, onDeleteDocument }) => {
  const allowedClubs = currentUser.role === UserRole.ADMIN
    ? clubs
    : clubs.filter(c => currentUser.clubIds.includes(c.id));

  const [selectedClubId, setSelectedClubId] = useState<string>(allowedClubs[0]?.id || '');
  const [activeTab, setActiveTab] = useState<'QUOTES' | 'INVOICES'>('QUOTES');
  const [viewingDoc, setViewingDoc] = useState<DocumentFile | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (selectedClubId === '' && allowedClubs.length > 0) {
      setSelectedClubId(allowedClubs[0].id);
    }
  }, [allowedClubs]);

  const filteredDocs = documents.filter(doc => {
    const isClubMatch = doc.clubId === selectedClubId;
    const isTypeMatch = activeTab === 'QUOTES' ? doc.type === 'QUOTE' : doc.type === 'INVOICE';
    return isClubMatch && isTypeMatch;
  });

  const groupedDocs = filteredDocs.reduce((acc, doc) => {
    const date = new Date(doc.date);
    const year = date.getFullYear().toString();
    const month = date.getMonth().toString();

    if (!acc[year]) acc[year] = {};
    if (!acc[year][month]) acc[year][month] = [];

    acc[year][month].push(doc);
    return acc;
  }, {} as Record<string, Record<string, DocumentFile[]>>);

  const sortedYears = Object.keys(groupedDocs).sort((a, b) => Number(b) - Number(a));

  const getMonthName = (monthIndex: string) => {
    const date = new Date();
    date.setMonth(parseInt(monthIndex));
    return new Intl.DateTimeFormat('fr-FR', { month: 'long' }).format(date);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
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
    e.target.value = '';
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if(window.confirm("Supprimer ce document financier ?") && onDeleteDocument) {
      onDeleteDocument(id);
    }
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".pdf,.jpg,.jpeg,.png" />

      <div className="bg-brand-light p-6 rounded-lg shadow-lg flex flex-col md:flex-row justify-between items-center gap-4">
         <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2"><Euro className="text-brand-yellow" />Devis & Factures</h2>
            <p className="text-gray-400 text-sm mt-1">Gestion administrative centralisée.</p>
         </div>
         <div className="flex items-center gap-3">
            <Building className="text-gray-400" size={20} />
            <select value={selectedClubId} onChange={(e) => setSelectedClubId(e.target.value)} className="bg-brand-dark border border-gray-600 rounded px-4 py-2 text-white outline-none min-w-[200px]">
               {allowedClubs.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
         </div>
      </div>

      <div className="flex space-x-1 bg-brand-darker p-1 rounded-lg w-fit">
        <button onClick={() => setActiveTab('QUOTES')} className={`px-6 py-2 rounded-md text-sm font-bold transition-all ${activeTab === 'QUOTES' ? 'bg-brand-yellow text-brand-dark shadow' : 'text-gray-400 hover:text-white'}`}>Devis</button>
        <button onClick={() => setActiveTab('INVOICES')} className={`px-6 py-2 rounded-md text-sm font-bold transition-all ${activeTab === 'INVOICES' ? 'bg-brand-yellow text-brand-dark shadow' : 'text-gray-400 hover:text-white'}`}>Factures</button>
      </div>

      <div className="flex-1 bg-brand-light rounded-xl border border-gray-700 shadow-lg p-6 flex flex-col">
         <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-white">{activeTab === 'QUOTES' ? 'Devis' : 'Factures'}</h3>
            <button onClick={handleUploadClick} className="bg-brand-dark border border-dashed border-gray-500 text-brand-yellow px-4 py-2 rounded hover:border-brand-yellow hover:bg-brand-yellow/10 transition flex items-center gap-2"><Upload size={18} />Ajouter</button>
         </div>

         <div className="space-y-6 overflow-y-auto custom-scrollbar pr-2">
            {sortedYears.map(year => (
               <div key={year} className="space-y-4">
                  <div className="flex items-center gap-2"><span className="text-3xl font-black text-gray-600/50">{year}</span><div className="h-px bg-gray-700 flex-1"></div></div>
                  {Object.keys(groupedDocs[year]).sort((a,b) => Number(b) - Number(a)).map(month => (
                     <div key={`${year}-${month}`} className="ml-2 md:ml-6">
                        <h4 className="text-brand-yellow font-bold uppercase text-xs mb-3 flex items-center gap-2"><Calendar size={14} />{getMonthName(month)}</h4>
                        <div className="space-y-3">
                           {groupedDocs[year][month].map(doc => (
                              <div key={doc.id} className="bg-brand-dark p-4 rounded-lg border border-gray-700 hover:border-brand-yellow/50 transition flex items-center justify-between group">
                                 <div className="flex items-center gap-4">
                                    <div className={`p-3 rounded-lg ${doc.type === 'QUOTE' ? 'bg-blue-500/20 text-blue-400' : 'bg-green-500/20 text-green-400'}`}><FileText size={24} /></div>
                                    <div><h4 className="font-bold text-white text-base">{doc.name}</h4><p className="text-gray-400 text-xs">{doc.date}</p></div>
                                 </div>
                                 <div className="flex items-center gap-3">
                                    <button onClick={() => setViewingDoc(doc)} className="p-2 text-gray-400 hover:text-white rounded-full transition"><Eye size={20} /></button>
                                    <button onClick={(e) => handleDelete(e, doc.id)} className="p-2 text-gray-600 hover:text-red-400 rounded-full transition opacity-0 group-hover:opacity-100"><Trash2 size={20} /></button>
                                 </div>
                              </div>
                           ))}
                        </div>
                     </div>
                  ))}
               </div>
            ))}
         </div>
      </div>

      {viewingDoc && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-4xl h-[80vh] rounded-xl flex flex-col shadow-2xl overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b bg-gray-50">
              <h3 className="text-lg font-black text-black">{viewingDoc.name}</h3>
              <button onClick={() => setViewingDoc(null)} className="text-gray-400 hover:text-black bg-gray-100 p-2 rounded-full"><X size={20} /></button>
            </div>
            <div className="flex-1 bg-gray-900 flex items-center justify-center overflow-auto p-4">
                {viewingDoc.url.startsWith('blob:') || viewingDoc.url.includes('image') ? (
                  <img src={viewingDoc.url} alt="Preview" className="max-w-full max-h-full object-contain shadow-lg" />
                ) : (
                  <div className="bg-white text-black w-full max-w-2xl min-h-[500px] p-10 font-bold">Document PDF Importé</div>
                )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinancialManager;
