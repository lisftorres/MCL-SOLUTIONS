
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
  
  // Modal State
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
    const matchesSearch = 
      a.companyName.toLowerCase().includes(searchTerm.toLowerCase()) || 
      a.contactName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.trade.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTrade = filterTrade === 'ALL' || a.trade === filterTrade;
    
    return matchesSearch && matchesTrade;
  });

  const handleOpenCreate = () => {
    setIsEditing(false);
    setFormData({
      companyName: '',
      contactName: '',
      trade: TradeType.ELECTRICITY,
      phone: '',
      email: '',
      address: '',
      notes: ''
    });
    setShowModal(true);
  };

  const handleOpenEdit = (artisan: Artisan) => {
    setIsEditing(true);
    setFormData({ ...artisan });
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditing && formData.id) {
      onEditArtisan(formData as Artisan);
    } else {
      onAddArtisan(formData);
    }
    setShowModal(false);
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Supprimer ce contact du répertoire ?")) {
      onDeleteArtisan(id);
    }
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row justify-between gap-4 bg-gym-light p-4 rounded-lg shadow-lg">
        <div className="flex flex-col gap-1">
             <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Briefcase className="text-gym-yellow" />
                Répertoire des Artisans
             </h2>
             <p className="text-xs text-gray-400">Gérez les contacts de vos prestataires externes.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-gray-500" size={18} />
            <input 
              type="text" 
              placeholder="Rechercher..." 
              className="bg-gym-dark border border-gray-600 rounded pl-10 pr-4 py-2 text-white focus:border-gym-yellow outline-none w-full sm:w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <select 
            className="bg-gym-dark border border-gray-600 rounded px-3 py-2 text-white outline-none"
            value={filterTrade}
            onChange={(e) => setFilterTrade(e.target.value)}
          >
            <option value="ALL">Tous les métiers</option>
            {Object.values(TradeType).map(t => <option key={t} value={t}>{t}</option>)}
          </select>

          <button 
            onClick={handleOpenCreate}
            className="bg-gym-yellow text-gym-dark font-bold px-4 py-2 rounded flex items-center justify-center gap-2 hover:bg-yellow-400 transition"
          >
            <Plus size={18} /> Ajouter
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 overflow-y-auto pb-10">
        {filteredArtisans.map(artisan => (
          <div key={artisan.id} className="bg-gym-light rounded-xl border border-gray-700 shadow-lg hover:border-gym-yellow/50 transition group flex flex-col h-full">
            <div className="p-5 flex-1">
              <div className="flex justify-between items-start mb-2">
                 <div className="bg-gym-dark text-gym-yellow text-xs font-bold px-2 py-1 rounded border border-gray-600">
                    {artisan.trade}
                 </div>
                 {currentUser.role !== UserRole.TECHNICIAN && ( // Allow Edit/Delete for Admin/Manager
                   <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                     <button onClick={() => handleOpenEdit(artisan)} className="p-1.5 text-blue-400 hover:bg-blue-500/10 rounded"><Edit2 size={14}/></button>
                     <button onClick={() => handleDelete(artisan.id)} className="p-1.5 text-red-400 hover:bg-red-500/10 rounded"><Trash2 size={14}/></button>
                   </div>
                 )}
              </div>
              
              <h3 className="text-lg font-bold text-white mb-1 truncate" title={artisan.companyName}>{artisan.companyName}</h3>
              <div className="flex items-center gap-2 text-gray-400 text-sm mb-4">
                 <UserIcon size={14} />
                 <span>{artisan.contactName}</span>
              </div>

              <div className="space-y-3">
                <a href={`tel:${artisan.phone}`} className="flex items-center gap-3 text-gray-300 hover:text-gym-yellow transition p-2 bg-gym-dark/50 rounded">
                  <Phone size={16} />
                  <span className="font-mono">{artisan.phone}</span>
                </a>
                <a href={`mailto:${artisan.email}`} className="flex items-center gap-3 text-gray-300 hover:text-gym-yellow transition p-2 bg-gym-dark/50 rounded">
                  <Mail size={16} />
                  <span className="truncate text-sm">{artisan.email}</span>
                </a>
                <div className="flex items-start gap-3 text-gray-400 text-sm p-2">
                  <MapPin size={16} className="mt-0.5 shrink-0" />
                  <span className="line-clamp-2">{artisan.address}</span>
                </div>
              </div>
              
              {artisan.notes && (
                  <div className="mt-4 pt-3 border-t border-gray-700">
                      <p className="text-xs text-gray-500 italic line-clamp-2">"{artisan.notes}"</p>
                  </div>
              )}
            </div>
          </div>
        ))}
        
        {filteredArtisans.length === 0 && (
           <div className="col-span-full flex flex-col items-center justify-center p-12 text-gray-500 border border-dashed border-gray-700 rounded-xl">
              <Briefcase size={48} className="mb-4 opacity-50" />
              <p className="text-lg">Aucun artisan trouvé</p>
              <p className="text-sm">Modifiez vos filtres ou ajoutez un nouveau contact.</p>
           </div>
        )}
      </div>

      {/* Modal Form */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-gym-light w-full max-w-lg rounded-xl shadow-2xl border border-gray-600 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-700 sticky top-0 bg-gym-light z-10">
              <h2 className="text-xl font-bold text-white">
                {isEditing ? 'Modifier Artisan' : 'Ajouter Artisan'}
              </h2>
              <button onClick={() => setShowModal(false)}><X className="text-gray-400 hover:text-white" /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Nom de la société</label>
                <input 
                  type="text" 
                  required
                  className="w-full bg-gym-dark border border-gray-600 rounded p-2 text-white focus:border-gym-yellow outline-none"
                  value={formData.companyName}
                  onChange={e => setFormData({...formData, companyName: e.target.value})}
                  placeholder="Ex: Elec Express"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Nom du contact</label>
                <input 
                  type="text" 
                  required
                  className="w-full bg-gym-dark border border-gray-600 rounded p-2 text-white focus:border-gym-yellow outline-none"
                  value={formData.contactName}
                  onChange={e => setFormData({...formData, contactName: e.target.value})}
                  placeholder="Ex: Jean Dupont"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Métier</label>
                <select 
                  className="w-full bg-gym-dark border border-gray-600 rounded p-2 text-white outline-none"
                  value={formData.trade}
                  onChange={e => setFormData({...formData, trade: e.target.value as TradeType})}
                >
                  {Object.values(TradeType).map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Téléphone</label>
                  <input 
                    type="tel" 
                    required
                    className="w-full bg-gym-dark border border-gray-600 rounded p-2 text-white focus:border-gym-yellow outline-none"
                    value={formData.phone}
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Email</label>
                  <input 
                    type="email" 
                    required
                    className="w-full bg-gym-dark border border-gray-600 rounded p-2 text-white focus:border-gym-yellow outline-none"
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Adresse</label>
                <input 
                  type="text" 
                  className="w-full bg-gym-dark border border-gray-600 rounded p-2 text-white focus:border-gym-yellow outline-none"
                  value={formData.address}
                  onChange={e => setFormData({...formData, address: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Notes / Informations</label>
                <textarea 
                  rows={3}
                  className="w-full bg-gym-dark border border-gray-600 rounded p-2 text-white focus:border-gym-yellow outline-none"
                  value={formData.notes}
                  onChange={e => setFormData({...formData, notes: e.target.value})}
                  placeholder="Tarifs, horaires, numéro de contrat..."
                />
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
                  {isEditing ? 'Enregistrer' : 'Ajouter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContactBook;
