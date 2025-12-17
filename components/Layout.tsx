import React, { useState } from 'react';
import { LayoutDashboard, Ticket, ClipboardCheck, FolderOpen, Users, Settings, Menu, X, LogOut, Bell, Wrench, BookOpen, Receipt, Hexagon, NotebookPen, CalendarDays, Trash2, Dumbbell } from 'lucide-react';
import { User, UserRole, AppNotification } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  user: User;
  onLogout: () => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
  notifications?: AppNotification[];
  onMarkNotificationAsRead?: (id: string) => void;
  onMarkAllNotificationsAsRead?: () => void;
}

const Layout: React.FC<LayoutProps> = ({ 
  children, 
  user, 
  onLogout, 
  activeTab, 
  onTabChange,
  notifications = [],
  onMarkNotificationAsRead,
  onMarkAllNotificationsAsRead
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  const menuItems = [
    { 
      id: 'dashboard', 
      label: 'Tableau de bord', 
      icon: LayoutDashboard, 
      roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.TECHNICIAN] 
    },
    {
      id: 'planning',
      label: 'Planning Général',
      icon: CalendarDays,
      roles: [UserRole.ADMIN] 
    },
    { 
      id: 'checks', 
      label: 'Vérifications', 
      icon: ClipboardCheck, 
      roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.TECHNICIAN] 
    },
    { 
      id: 'tickets', 
      label: 'Tickets', 
      icon: Ticket, 
      roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.TECHNICIAN] 
    },
    { 
      id: 'maintenance', 
      label: 'Maintenance', 
      icon: Wrench, 
      roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.TECHNICIAN] 
    },
    {
      id: 'specs',
      label: 'Cahier des Charges',
      icon: NotebookPen,
      roles: [UserRole.ADMIN, UserRole.TECHNICIAN] 
    },
    {
      id: 'contact',
      label: 'Cahier de contact',
      icon: BookOpen,
      roles: [UserRole.ADMIN] 
    },
    {
      id: 'financial',
      label: 'Devis & Factures',
      icon: Receipt,
      roles: [UserRole.ADMIN] 
    },
    { 
      id: 'documents', 
      label: 'Documents Techniques', 
      icon: FolderOpen, 
      roles: [UserRole.ADMIN, UserRole.MANAGER] 
    },
    { 
      id: 'users', 
      label: 'Utilisateurs', 
      icon: Users, 
      roles: [UserRole.ADMIN] 
    },
    { 
      id: 'recycle_bin', 
      label: 'Corbeille', 
      icon: Trash2, 
      roles: [UserRole.ADMIN] 
    },
    { 
      id: 'settings', 
      label: 'Paramètres', 
      icon: Settings, 
      roles: [UserRole.ADMIN] 
    },
  ];

  const filteredMenu = menuItems.filter(item => item.roles.includes(user.role));

  const MCLLogo = ({ size = 'md' }: { size?: 'sm' | 'md' }) => {
    const dim = size === 'sm' ? 'w-8 h-8' : 'w-12 h-12';
    const iconSize = size === 'sm' ? 16 : 24;
    const nutSize = size === 'sm' ? 32 : 48;
    
    return (
      <div className={`relative ${dim} flex items-center justify-center shrink-0`}>
         <Hexagon className="text-gray-500 absolute" size={nutSize} strokeWidth={1.5} />
         <Dumbbell className="text-white absolute transform -rotate-45" size={iconSize} strokeWidth={2.5} />
         <Wrench className="text-brand-yellow absolute transform rotate-45" size={iconSize} strokeWidth={2.5} />
      </div>
    );
  };

  const getNotifIcon = (type: string) => {
    switch (type) {
      case 'TICKET': return <Ticket size={16} className="text-red-400" />;
      case 'CHECK': return <ClipboardCheck size={16} className="text-orange-400" />;
      case 'MAINTENANCE': return <Wrench size={16} className="text-purple-400" />;
      case 'PLANNING': return <CalendarDays size={16} className="text-blue-400" />;
      default: return <Bell size={16} className="text-gray-400" />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-brand-dark text-white font-sans">
      <div className="md:hidden flex items-center justify-between p-4 bg-brand-darker border-b border-brand-light">
        <div className="flex items-center space-x-3">
          <MCLLogo size="sm" />
          <div className="leading-none">
            <span className="block text-lg font-black text-white tracking-tighter">MCL</span>
            <span className="block text-[10px] font-bold text-brand-yellow tracking-widest uppercase">Solutions</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
           <button 
             className="relative p-1 text-gray-300"
             onClick={() => setShowNotifications(!showNotifications)}
           >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] flex items-center justify-center border border-brand-darker">
                  {unreadCount}
                </span>
              )}
           </button>
           <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
             {isMobileMenuOpen ? <X /> : <Menu />}
           </button>
        </div>
      </div>

      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-brand-darker border-r border-brand-light transform transition-transform duration-300 ease-in-out
        md:relative md:translate-x-0
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 flex items-center space-x-3 border-b border-brand-light/30">
          <MCLLogo size="md" />
          <div className="leading-none">
            <span className="block text-3xl font-black text-white tracking-tighter">MCL</span>
            <span className="block text-xs font-bold text-brand-yellow tracking-widest uppercase">Solutions</span>
          </div>
        </div>

        <nav className="p-4 space-y-2 flex-1 overflow-y-auto">
          {filteredMenu.map(item => (
            <button
              key={item.id}
              onClick={() => {
                onTabChange(item.id);
                setIsMobileMenuOpen(false);
              }}
              className={`flex items-center space-x-3 w-full p-3 rounded-lg transition-colors ${
                activeTab === item.id
                  ? 'bg-brand-yellow text-brand-dark font-bold'
                  : 'text-gray-300 hover:bg-brand-light hover:text-white'
              }`}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-brand-light/30">
          <div className="flex items-center space-x-3 mb-4">
            <img src={user.avatar} alt="User" className="w-10 h-10 rounded-full border border-brand-yellow" />
            <div className="overflow-hidden">
              <p className="text-sm font-bold truncate">{user.name}</p>
              <p className="text-xs text-gray-400 truncate">{user.role}</p>
            </div>
          </div>
          <button 
            onClick={onLogout}
            className="flex items-center space-x-3 w-full p-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-lg transition-colors"
          >
            <LogOut size={18} />
            <span>Déconnexion</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto h-screen relative bg-brand-dark p-4 md:p-8">
        <div className="hidden md:flex justify-between items-center mb-8 relative">
            <h1 className="text-3xl font-bold text-white uppercase tracking-wider">
               {menuItems.find(m => m.id === activeTab)?.label}
            </h1>
            <div className="flex items-center space-x-4">
               <div className="relative">
                 <button 
                    className={`relative p-2 rounded-full transition-colors ${showNotifications ? 'bg-brand-light text-brand-yellow' : 'text-gray-300 hover:text-brand-yellow'}`}
                    onClick={() => setShowNotifications(!showNotifications)}
                 >
                    <Bell size={24} />
                    {unreadCount > 0 && (
                      <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 rounded-full text-[10px] flex items-center justify-center border border-brand-dark text-white font-bold">
                        {unreadCount}
                      </span>
                    )}
                 </button>

                 {showNotifications && (
                    <div className="absolute right-0 mt-2 w-80 bg-brand-light border border-gray-700 rounded-xl shadow-2xl z-50 overflow-hidden animate-fade-in">
                       <div className="p-3 border-b border-gray-700 flex justify-between items-center bg-brand-darker">
                          <h3 className="font-bold text-white text-sm">Notifications</h3>
                          {unreadCount > 0 && (
                             <button 
                               onClick={onMarkAllNotificationsAsRead}
                               className="text-xs text-brand-yellow hover:underline"
                             >
                               Tout marquer comme lu
                             </button>
                          )}
                       </div>
                       <div className="max-h-80 overflow-y-auto">
                          {notifications.length === 0 ? (
                             <div className="p-6 text-center text-gray-500 text-sm">
                                Aucune notification
                             </div>
                          ) : (
                             notifications.map(notif => (
                                <div 
                                  key={notif.id} 
                                  className={`p-3 border-b border-gray-700/50 hover:bg-gray-700/50 transition flex gap-3 ${notif.read ? 'opacity-60' : 'bg-brand-dark/30'}`}
                                  onClick={() => onMarkNotificationAsRead && onMarkNotificationAsRead(notif.id)}
                                >
                                   <div className="mt-1 shrink-0">
                                      {getNotifIcon(notif.type)}
                                   </div>
                                   <div className="overflow-hidden">
                                      <p className={`text-sm ${notif.read ? 'text-gray-400' : 'text-white font-semibold'}`}>
                                        {notif.title}
                                      </p>
                                      <p className="text-xs text-gray-400 mt-0.5 truncate">
                                        {notif.message}
                                      </p>
                                      <p className="text-[10px] text-gray-500 mt-1">
                                        {new Date(notif.date).toLocaleString()}
                                      </p>
                                   </div>
                                   {!notif.read && (
                                      <div className="shrink-0 self-center">
                                         <div className="w-2 h-2 bg-brand-yellow rounded-full"></div>
                                      </div>
                                   )}
                                </div>
                             ))
                          )}
                       </div>
                    </div>
                 )}
               </div>
            </div>
        </div>
        
        {showNotifications && (
           <div className="md:hidden fixed inset-0 z-40 flex items-start justify-center pt-16 px-4 bg-black/50" onClick={() => setShowNotifications(false)}>
              <div className="bg-brand-light w-full max-w-sm rounded-xl border border-gray-700 shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
                 <div className="p-3 border-b border-gray-700 flex justify-between items-center bg-brand-darker">
                    <h3 className="font-bold text-white text-sm">Notifications</h3>
                    <div className="flex gap-4">
                       {unreadCount > 0 && (
                          <button 
                             onClick={onMarkAllNotificationsAsRead}
                             className="text-xs text-brand-yellow hover:underline"
                          >
                             Tout lire
                          </button>
                       )}
                       <button onClick={() => setShowNotifications(false)}>
                          <X size={16} className="text-gray-400"/>
                       </button>
                    </div>
                 </div>
                 <div className="max-h-[60vh] overflow-y-auto">
                    {notifications.length === 0 ? (
                       <div className="p-6 text-center text-gray-500 text-sm">
                          Aucune notification
                       </div>
                    ) : (
                       notifications.map(notif => (
                          <div 
                            key={notif.id} 
                            className={`p-3 border-b border-gray-700/50 flex gap-3 ${notif.read ? 'opacity-60' : 'bg-brand-dark/30'}`}
                            onClick={() => onMarkNotificationAsRead && onMarkNotificationAsRead(notif.id)}
                          >
                             <div className="mt-1 shrink-0">
                                {getNotifIcon(notif.type)}
                             </div>
                             <div className="overflow-hidden">
                                <p className={`text-sm ${notif.read ? 'text-gray-400' : 'text-white font-semibold'}`}>
                                  {notif.title}
                                </p>
                                <p className="text-xs text-gray-400 mt-0.5">
                                  {notif.message}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                  {new Date(notif.date).toLocaleString()}
                                </p>
                             </div>
                          </div>
                       ))
                    )}
                 </div>
              </div>
           </div>
        )}

        {children}
      </main>

      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </div>
  );
};

export default Layout;