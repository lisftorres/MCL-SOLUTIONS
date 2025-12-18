
import React, { useState } from 'react';
import { Artisan, TradeType, UserRole, User } from '../types';
import { Phone, Mail, MapPin, Search, Plus, Trash2, Edit2, Briefcase, User as UserIcon, X } from 'lucide-react';

interface ContactBookProps {
  artisans: Artisan[];
  currentUser: User;
  onAddArtisan: (artisan: Partial<Artisan>) => void;
  onDeleteArtisan: (id: string) => void;
  onEditArtisan: (artisan: Artisan) => void;
}

const ContactBook: React.FC<ContactBookProps> = ({ artisans, currentUser, onAddArtisan, onDeleteArtisan, onEditArtisan }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTrade, setFilterTrade] = useState<string>('ALL');
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<Artisan>>({
    companyName: '',
    contactName: '',
    trade: TradeType.ELECTRICITY,
    phone: '',
    email: '',
    address: '',
    notes: ''
  });

  const filteredArtisans = artisans.filter(a => {
    const matchesSearch = a.companyName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          a.contactName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTrade = filterTrade === 'ALL' || a.trade === filterTrade;
    return matchesSearch && matchesTrade;
  });

  const handleOpenCreate = () => {
    setIsEditing(false);
    setFormData({ companyName: '', contactName: '', trade: TradeType.ELECTRICITY, phone: '', email: '', address: '', notes: '' });
    setShowModal(true);
  };

  const handleOpenEdit = (artisan: Artisan) => {
    setIsEditing(true);
    setFormData({ ...artisan });
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditing && formData.id) onEditArtisan(formData as Artisan);
    else onAddArtisan(formData);
    setShowModal(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between gap-4 bg-brand-light p-5 rounded-2xl border border-gray-700 shadow-2xl items-center">
        <div className="flex items-center gap-4">
             <div className="bg-brand-yellow/10 p-3 rounded-xl border border-brand-yellow/30"><Briefcase className="text-brand-yellow" size={24} /></div>
             <h2 className="text-xl font-black text-white uppercase tracking-tight">Répertoire Artisans</h2>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative group flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 transition-colors group-focus-within:text-brand-yellow" size={18} />
            <input 
              type="text" 
              placeholder="Rechercher..." 
              className="bg-brand-dark border border-gray-600 rounded-xl pl-10 pr-4 py-2.5 text-white focus:border-brand-yellow outline-none w-full font-bold transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <button onClick={handleOpenCreate} className="bg-brand-yellow text-brand-dark font-black uppercase tracking-tight px-6 py-2.5 rounded-xl flex items-center justify-center gap-2 hover:bg-yellow-400 transition shadow-xl shadow-brand-yellow/20"><Plus size={18} /> Ajouter</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-10">
        {filteredArtisans.map(artisan => (
          <div key={artisan.id} className="bg-brand-light rounded-2xl border border-gray-700 shadow-2xl hover:border-brand-yellow/40 transition-all group flex flex-col h-full overflow-hidden">
            <div className="p-6 flex-1 flex flex-col">
              <div className="flex justify-between items-start mb-4">
                 <div className="bg-brand-dark text-brand-yellow text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-lg border border-gray-700 shadow-inner">
                    {artisan.trade}
                 </div>
                 <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all transform translate-y-1 group-hover:translate-y-0">
                    <button onClick={() => handleOpenEdit(artisan)} className="p-2 text-blue-400 hover:bg-blue-500/10 rounded-lg transition"><Edit2 size={16}/></button>
                    <button onClick={() => { if(window.confirm("Supprimer ?")) onDeleteArtisan(artisan.id); }} className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition"><Trash2 size={16}/></button>
                 </div>
              </div>
              
              <h3 className="text-xl font-black text-white mb-1 uppercase tracking-tight leading-tight">{artisan.companyName}</h3>
              <div className="flex items-center gap-2 text-gray-400 text-[10px] font-black uppercase tracking-widest mb-6 border-b border-gray-700 pb-4">
                 <UserIcon size={12} className="text-brand-yellow" />
                 <span>{artisan.contactName}</span>
              </div>

              <div className="space-y-3 flex-1">
                <a href={`tel:${artisan.phone}`} className="flex items-center gap-3 text-gray-300 hover:text-brand-yellow transition-all p-3 bg-brand-dark/40 rounded-xl border border-gray-700/50 hover:border-brand-yellow/30 group/item">
                  <div className="bg-gray-700 group-hover/item:bg-brand-yellow group-hover/item:text-brand-dark p-2 rounded-lg transition-all"><Phone size={14} /></div>
                  <span className="font-mono font-bold tracking-wider text-sm">{artisan.phone}</span>
                </a>
                <a href={`mailto:${artisan.email}`} className="flex items-center gap-3 text-gray-300 hover:text-brand-yellow transition-all p-3 bg-brand-dark/40 rounded-xl border border-gray-700/50 hover:border-brand-yellow/30 group/item">
                  <div className="bg-gray-700 group-hover/item:bg-brand-yellow group-hover/item:text-brand-dark p-2 rounded-lg transition-all"><Mail size={14} /></div>
                  <span className="truncate text-xs font-bold uppercase tracking-tighter">{artisan.email}</span>
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-fade-in-up flex flex-col max-h-[95vh]">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50">
              <h2 className="text-xl font-black text-brand-dark uppercase tracking-tight">
                {isEditing ? 'Modifier Fiche' : 'Nouvel Artisan'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-brand-dark transition-colors"><X size={24} /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 space-y-6 overflow-y-auto custom-scrollbar">
              <div className="space-y-1">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Société</label>
                <input type="text" required className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-black font-black outline-none focus:ring-2 focus:ring-brand-yellow transition-all" value={formData.companyName} onChange={e => setFormData({...formData, companyName: e.target.value})} placeholder="Nom de l'entreprise" />
              </div>
              <div className="space-y-1">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Contact Référent</label>
                <input type="text" required className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-black font-black outline-none focus:ring-2 focus:ring-brand-yellow transition-all" value={formData.contactName} onChange={e => setFormData({...formData, contactName: e.target.value})} placeholder="Prénom NOM" />
              </div>
              <div className="space-y-1">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Métier</label>
                <select className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-black font-black outline-none cursor-pointer focus:ring-2 focus:ring-brand-yellow transition-all" value={formData.trade} onChange={e => setFormData({...formData, trade: e.target.value as TradeType})}>
                  {Object.values(TradeType).map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Téléphone</label>
                  <input type="tel" required className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-black font-black outline-none focus:ring-2 focus:ring-brand-yellow" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Email</label>
                  <input type="email" required className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-black font-black outline-none focus:ring-2 focus:ring-brand-yellow" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                </div>
              </div>
              <div className="pt-6 flex gap-4 border-t border-gray-100 sticky bottom-0 bg-white">
                 <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-gray-100 text-gray-500 font-black uppercase py-4 rounded-xl hover:bg-gray-200 transition-all">Annuler</button>
                <button type="submit" className="flex-1 bg-brand-yellow text-brand-dark font-black uppercase py-4 rounded-xl hover:bg-yellow-400 shadow-xl shadow-brand-yellow/30 transition-all">{isEditing ? 'Enregistrer' : 'Confirmer'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContactBook;
