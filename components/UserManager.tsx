
import React, { useState } from 'react';
import { User, UserRole, Club } from '../types';
import { Plus, Edit2, Trash2, Shield, Mail, Building, User as UserIcon, X, Send, Lock, Key } from 'lucide-react';

interface UserManagerProps {
  users: User[];
  clubs: Club[];
  userPasswords: Record<string, string>; 
  onAddUser: (user: Partial<User>, password?: string) => void;
  onEditUser: (user: User, password?: string) => void;
  onDeleteUser: (userId: string) => void;
  onDeletePassword?: (userId: string) => void;
}

const UserManager: React.FC<UserManagerProps> = ({ users, clubs, userPasswords, onAddUser, onEditUser, onDeleteUser, onDeletePassword }) => {
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState<Partial<User>>({
    name: '',
    email: '',
    role: UserRole.TECHNICIAN,
    clubIds: [],
    avatar: 'https://picsum.photos/200'
  });
  const [password, setPassword] = useState('');

  const handleOpenCreate = () => {
    setIsEditing(false);
    setFormData({
      name: '',
      email: '',
      role: UserRole.TECHNICIAN,
      clubIds: [],
      avatar: `https://picsum.photos/seed/${Date.now()}/200`
    });
    setPassword('');
    setShowModal(true);
  };

  const handleOpenEdit = (user: User) => {
    setIsEditing(true);
    setFormData({ ...user });
    setPassword('');
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditing && formData.id) {
      onEditUser(formData as User, password);
      setShowModal(false);
    } else {
      setIsSubmitting(true);
      onAddUser(formData, password);
      setIsSubmitting(false);
      setShowModal(false);
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Supprimer cet utilisateur ?")) onDeleteUser(id);
  };

  const toggleClubSelection = (clubId: string) => {
    const currentClubs = formData.clubIds || [];
    if (currentClubs.includes(clubId)) setFormData({ ...formData, clubIds: currentClubs.filter(id => id !== clubId) });
    else setFormData({ ...formData, clubIds: [...currentClubs, clubId] });
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN: return <span className="bg-red-500/10 text-red-600 border border-red-200 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter flex items-center gap-1"><Shield size={10}/> Administrateur</span>;
      case UserRole.MANAGER: return <span className="bg-blue-500/10 text-blue-600 border border-blue-200 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter flex items-center gap-1"><UserIcon size={10}/> Manager Club</span>;
      case UserRole.TECHNICIAN: return <span className="bg-brand-yellow/10 text-brand-dark border border-brand-yellow/20 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter flex items-center gap-1"><UserIcon size={10}/> Technicien</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-brand-light p-5 rounded-2xl border border-gray-700 shadow-2xl">
        <h2 className="text-xl font-black text-white uppercase tracking-tight">Gestion des Utilisateurs</h2>
        <button onClick={handleOpenCreate} className="bg-brand-yellow text-brand-dark font-black uppercase tracking-tight px-5 py-2.5 rounded-xl flex items-center gap-2 hover:bg-yellow-400 transition shadow-xl shadow-brand-yellow/20"><Plus size={18} /> Ajouter</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {users.map(user => (
          <div key={user.id} className="bg-brand-light rounded-2xl border border-gray-700 overflow-hidden shadow-xl group transition-all hover:border-brand-yellow/40">
            <div className="p-8 flex flex-col items-center border-b border-gray-700 relative bg-brand-darker/30">
              <img src={user.avatar} alt={user.name} className="w-20 h-20 rounded-full border-4 border-brand-yellow mb-4 object-cover shadow-2xl transition-transform group-hover:scale-105" />
              <h3 className="text-lg font-black text-white uppercase tracking-tight text-center">{user.name}</h3>
              <p className="text-xs text-gray-400 flex items-center gap-2 mb-5 font-bold uppercase tracking-widest"><Mail size={12} className="text-brand-yellow" /> {user.email}</p>
              {getRoleBadge(user.role)}
              <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-all transform translate-y-1 group-hover:translate-y-0">
                <button onClick={() => handleOpenEdit(user)} className="p-2.5 text-blue-400 hover:bg-blue-500/20 rounded-xl transition"><Edit2 size={16} /></button>
                <button onClick={() => handleDelete(user.id)} className="p-2.5 text-red-500 hover:bg-red-500/20 rounded-xl transition"><Trash2 size={16} /></button>
              </div>
            </div>
            <div className="p-5 bg-brand-dark/20 min-h-[100px]">
              <div className="flex flex-wrap gap-2 justify-center">
                {user.clubIds.map(clubId => {
                    const club = clubs.find(c => c.id === clubId);
                    return club && <span key={clubId} className="bg-brand-dark px-3 py-1.5 rounded-lg text-[9px] font-black uppercase text-gray-500 border border-gray-700 tracking-tighter">{club.name}</span>;
                })}
                {user.clubIds.length === 0 && <span className="text-[10px] text-gray-600 font-black uppercase tracking-widest italic">Accès Global</span>}
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-fade-in-up flex flex-col max-h-[95vh]">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50">
              <h2 className="text-xl font-black text-black uppercase tracking-tight">{isEditing ? 'Modifier Profil' : 'Nouvel Utilisateur'}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-black transition-colors"><X size={24} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-6 overflow-y-auto custom-scrollbar">
              <div className="space-y-1">
                <label className="block text-[10px] font-black text-black uppercase tracking-widest">Nom complet</label>
                <input type="text" required className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-black font-black outline-none focus:ring-2 focus:ring-brand-yellow transition-all" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Ex: Marie Ciappa" />
              </div>
              <div className="space-y-1">
                <label className="block text-[10px] font-black text-black uppercase tracking-widest">Adresse Email</label>
                <input type="email" required className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-black font-black outline-none focus:ring-2 focus:ring-brand-yellow transition-all" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="mariea.ciappa@gmail.com" />
              </div>
              <div className="space-y-1">
                <label className="block text-[10px] font-black text-black uppercase tracking-widest">Mot de passe</label>
                <div className="relative">
                   <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                   <input type="text" required={!isEditing} className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-12 pr-4 py-4 text-black font-mono font-black outline-none focus:ring-2 focus:ring-brand-yellow transition-all" value={password} onChange={e => setPassword(e.target.value)} placeholder={isEditing ? "Modifier si nécessaire..." : "Définir un mot de passe..."} />
                </div>
              </div>
              <div className="space-y-1">
                <label className="block text-[10px] font-black text-black uppercase tracking-widest">Accès / Rôle</label>
                <select className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-black font-black outline-none focus:ring-2 focus:ring-brand-yellow transition-all cursor-pointer" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value as UserRole})}>
                  <option value={UserRole.ADMIN}>Administrateur</option>
                  <option value={UserRole.MANAGER}>Manager Club</option>
                  <option value={UserRole.TECHNICIAN}>Technicien</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-black uppercase tracking-widest">Clubs autorisés</label>
                <div className="space-y-2 bg-gray-50 p-4 rounded-xl border border-gray-100 max-h-40 overflow-y-auto custom-scrollbar shadow-inner">
                  {clubs.map(club => (
                    <label key={club.id} className="flex items-center space-x-3 cursor-pointer hover:bg-white p-3 rounded-xl transition-all shadow-sm border border-transparent hover:border-gray-200 group">
                      <input type="checkbox" checked={formData.clubIds?.includes(club.id)} onChange={() => toggleClubSelection(club.id)} className="w-5 h-5 rounded border-gray-300 text-brand-yellow focus:ring-brand-yellow transition-all" />
                      <span className="text-[11px] font-black text-black uppercase tracking-tighter group-hover:text-black">{club.name}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="pt-6 flex gap-4 border-t border-gray-100 sticky bottom-0 bg-white">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-gray-100 text-gray-500 font-black uppercase py-4 rounded-xl hover:bg-gray-200 transition-all">Annuler</button>
                <button type="submit" disabled={isSubmitting} className="flex-1 bg-brand-yellow text-brand-dark font-black uppercase py-4 rounded-xl hover:bg-yellow-400 shadow-xl shadow-brand-yellow/30 transition-all">
                  {isSubmitting ? 'Action...' : (isEditing ? 'Enregistrer' : 'Créer le compte')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManager;
