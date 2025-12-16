
import React, { useState } from 'react';
import { User, UserRole, Club } from '../types';
import { Plus, Edit2, Trash2, Shield, Mail, Building, User as UserIcon, X, Send, Lock, Key } from 'lucide-react';

interface UserManagerProps {
  users: User[];
  clubs: Club[];
  userPasswords: Record<string, string>; // Reçoit les mots de passe
  onAddUser: (user: Partial<User>, password?: string) => void;
  onEditUser: (user: User, password?: string) => void;
  onDeleteUser: (userId: string) => void;
  onDeletePassword?: (userId: string) => void;
}

const UserManager: React.FC<UserManagerProps> = ({ users, clubs, userPasswords, onAddUser, onEditUser, onDeleteUser, onDeletePassword }) => {
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  
  // Form State
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
    setPassword(''); // On ne montre pas le mot de passe actuel par sécurité dans le formulaire d'édition
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isEditing && formData.id) {
      onEditUser(formData as User, password);
      setShowModal(false);
    } else {
      // Simulation d'envoi d'email pour les nouveaux utilisateurs
      setIsSendingEmail(true);
      
      setTimeout(() => {
        // Logique de création
        onAddUser(formData, password);
        
        // Simulation de l'envoi de l'email dans la console (Format JSON pour Cloud Run)
        const activationToken = Math.random().toString(36).substring(7);
        const activationLink = `https://mclsolutions.app/setup-account?token=${activationToken}&email=${formData.email}`;
        
        console.log(JSON.stringify({
          severity: 'INFO',
          component: 'UserManager',
          message: 'Envoi email activation utilisateur',
          recipient: formData.email,
          subject: `Bienvenue sur MCL SOLUTIONS - Activez votre compte ${formData.role}`,
          activationLink: activationLink,
          event: 'USER_INVITATION_SENT'
        }));

        alert(`Utilisateur créé avec succès !\n\nUn email d'activation contenant un lien sécurisé a été envoyé à ${formData.email}.\n\n(Voir la console Cloud Logging pour le lien simulé)`);
        
        setIsSendingEmail(false);
        setShowModal(false);
      }, 1500); // Délai artificiel
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cet utilisateur ? Cette action est irréversible.")) {
      onDeleteUser(id);
    }
  };

  const handleDeletePass = () => {
    if (formData.id && onDeletePassword) {
      if (window.confirm("Êtes-vous sûr de vouloir supprimer/réinitialiser le mot de passe de cet utilisateur ? Il ne pourra plus se connecter jusqu'à ce qu'un nouveau mot de passe soit défini.")) {
        onDeletePassword(formData.id);
        alert("Mot de passe supprimé avec succès.");
        setShowModal(false);
      }
    }
  };

  const toggleClubSelection = (clubId: string) => {
    const currentClubs = formData.clubIds || [];
    if (currentClubs.includes(clubId)) {
      setFormData({ ...formData, clubIds: currentClubs.filter(id => id !== clubId) });
    } else {
      setFormData({ ...formData, clubIds: [...currentClubs, clubId] });
    }
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN:
        return <span className="bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-1 rounded text-xs font-bold flex items-center gap-1"><Shield size={12}/> Admin</span>;
      case UserRole.MANAGER:
        return <span className="bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2 py-1 rounded text-xs font-bold flex items-center gap-1"><UserIcon size={12}/> Responsable</span>;
      case UserRole.TECHNICIAN:
        return <span className="bg-gym-yellow/20 text-gym-yellow border border-gym-yellow/30 px-2 py-1 rounded text-xs font-bold flex items-center gap-1"><UserIcon size={12}/> Technicien</span>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-gym-light p-4 rounded-lg">
        <h2 className="text-xl font-bold text-white">Gestion des Utilisateurs</h2>
        <button 
          onClick={handleOpenCreate}
          className="bg-gym-yellow text-gym-dark font-bold px-4 py-2 rounded flex items-center gap-2 hover:bg-yellow-400 transition"
        >
          <Plus size={18} /> Ajouter un utilisateur
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {users.map(user => (
          <div key={user.id} className="bg-gym-light rounded-xl border border-gray-700 overflow-hidden shadow-lg group">
            <div className="p-6 flex flex-col items-center border-b border-gray-700 relative">
              <img 
                src={user.avatar} 
                alt={user.name} 
                className="w-20 h-20 rounded-full border-2 border-gym-yellow mb-4 object-cover"
              />
              <h3 className="text-lg font-bold text-white">{user.name}</h3>
              <p className="text-sm text-gray-400 flex items-center gap-2 mb-3">
                <Mail size={12} /> {user.email}
              </p>
              
              <div className="mb-3 flex items-center gap-2 bg-gray-800 px-3 py-1 rounded-full border border-gray-600">
                 <Key size={12} className="text-gym-yellow" />
                 <span className="text-xs font-mono text-gray-300">
                    {userPasswords[user.id] ? userPasswords[user.id] : 'Non défini'}
                 </span>
              </div>

              {getRoleBadge(user.role)}

              <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => handleOpenEdit(user)}
                  className="p-2 bg-blue-500/20 text-blue-400 rounded-full hover:bg-blue-500/40"
                  title="Modifier"
                >
                  <Edit2 size={16} />
                </button>
                <button 
                  onClick={() => handleDelete(user.id)}
                  className="p-2 bg-red-500/20 text-red-400 rounded-full hover:bg-red-500/40"
                  title="Supprimer"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            <div className="p-4 bg-gym-darker/50">
              <h4 className="text-xs font-bold text-gray-500 uppercase mb-2 flex items-center gap-1">
                <Building size={12} /> Clubs Assignés
              </h4>
              <div className="flex flex-wrap gap-2">
                {user.clubIds.length > 0 ? (
                  user.clubIds.map(clubId => {
                    const club = clubs.find(c => c.id === clubId);
                    return club ? (
                      <span key={clubId} className="bg-gym-dark px-2 py-1 rounded text-xs text-gray-300 border border-gray-600">
                        {club.name}
                      </span>
                    ) : null;
                  })
                ) : (
                  <span className="text-xs text-gray-600 italic">Aucun club assigné</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Form */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-gym-light w-full max-w-lg rounded-xl shadow-2xl border border-gray-600">
            <div className="flex justify-between items-center p-6 border-b border-gray-700">
              <h2 className="text-xl font-bold text-white">
                {isEditing ? 'Modifier Utilisateur' : 'Nouvel Utilisateur'}
              </h2>
              <button onClick={() => !isSendingEmail && setShowModal(false)} disabled={isSendingEmail}><X className="text-gray-400 hover:text-white" /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Nom complet</label>
                <input 
                  type="text" 
                  required
                  className="w-full bg-gym-dark border border-gray-600 rounded p-2 text-white focus:border-gym-yellow outline-none"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  disabled={isSendingEmail}
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Adresse Email</label>
                <input 
                  type="email" 
                  required
                  className="w-full bg-gym-dark border border-gray-600 rounded p-2 text-white focus:border-gym-yellow outline-none"
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                  disabled={isSendingEmail}
                />
              </div>
              
              <div>
                <label className="block text-sm text-gray-400 mb-1">
                    {isEditing ? 'Nouveau mot de passe (Admin)' : 'Mot de passe'}
                </label>
                <div className="relative">
                   <Lock className="absolute left-3 top-2.5 text-gray-500" size={16} />
                   <input 
                      type="text" 
                      className="w-full bg-gym-dark border border-gray-600 rounded pl-10 pr-4 py-2 text-white focus:border-gym-yellow outline-none font-mono"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder={isEditing ? "Laisser vide pour ne pas changer" : "Mot de passe initial"}
                      disabled={isSendingEmail}
                      required={!isEditing}
                   />
                </div>
                {isEditing && (
                    <button 
                      type="button"
                      onClick={handleDeletePass}
                      className="text-xs text-red-400 hover:text-red-300 mt-1 flex items-center gap-1"
                    >
                        <Trash2 size={10} /> Supprimer le mot de passe actuel (Bloquer accès)
                    </button>
                )}
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Rôle / Permissions</label>
                <select 
                  className="w-full bg-gym-dark border border-gray-600 rounded p-2 text-white outline-none"
                  value={formData.role}
                  onChange={e => setFormData({...formData, role: e.target.value as UserRole})}
                  disabled={isSendingEmail}
                >
                  <option value={UserRole.ADMIN}>ADMIN (Accès Total)</option>
                  <option value={UserRole.MANAGER}>RESPONSABLE CLUB (Tout sauf Admin/Settings)</option>
                  <option value={UserRole.TECHNICIAN}>TECHNICIEN (Opérations Terrain)</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  {formData.role === UserRole.ADMIN && "Accès complet à tous les modules et paramètres."}
                  {formData.role === UserRole.MANAGER && "Gestion du club, tickets, documents. Pas de gestion utilisateurs."}
                  {formData.role === UserRole.TECHNICIAN && "Maintenance, Tickets, Vérifications et Tableau de bord."}
                </p>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Clubs Assignés</label>
                <div className="space-y-2 bg-gym-dark p-3 rounded border border-gray-600 max-h-40 overflow-y-auto">
                  {clubs.map(club => (
                    <label key={club.id} className="flex items-center space-x-3 cursor-pointer hover:bg-gray-700 p-1 rounded">
                      <input 
                        type="checkbox"
                        checked={formData.clubIds?.includes(club.id)}
                        onChange={() => toggleClubSelection(club.id)}
                        disabled={isSendingEmail}
                        className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-gym-yellow focus:ring-gym-yellow"
                      />
                      <span className="text-sm text-gray-200">{club.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Information sur l'email */}
              {!isEditing && (
                 <div className="bg-blue-500/10 border border-blue-500/30 p-3 rounded flex gap-3 items-start">
                    <Send className="text-blue-400 shrink-0 mt-1" size={16} />
                    <p className="text-xs text-blue-200">
                       Un email contenant un lien d'activation sera envoyé. Le mot de passe défini ci-dessus sera actif immédiatement.
                    </p>
                 </div>
              )}

              <div className="pt-4 flex gap-3">
                 <button 
                  type="button"
                  onClick={() => setShowModal(false)}
                  disabled={isSendingEmail}
                  className="flex-1 bg-transparent border border-gray-600 text-gray-300 py-3 rounded hover:bg-gray-800 transition disabled:opacity-50"
                >
                  Annuler
                </button>
                <button 
                  type="submit"
                  disabled={isSendingEmail}
                  className="flex-1 bg-gym-yellow text-gym-dark font-bold py-3 rounded hover:bg-yellow-400 transition flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  {isSendingEmail ? (
                    <>
                      <div className="w-4 h-4 border-2 border-gym-dark border-t-transparent rounded-full animate-spin"></div>
                      Envoi...
                    </>
                  ) : (
                     isEditing ? 'Enregistrer' : 'Créer et Inviter'
                  )}
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
