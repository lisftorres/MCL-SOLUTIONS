
import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import TicketManager from './components/TicketManager';
import CheckManager from './components/CheckManager';
import DocumentManager from './components/DocumentManager';
import MaintenanceSchedule from './components/MaintenanceSchedule';
import SettingsManager from './components/SettingsManager';
import UserManager from './components/UserManager';
import ContactBook from './components/ContactBook';
import FinancialManager from './components/FinancialManager';
import SpecificationsManager from './components/SpecificationsManager';
import GeneralPlanning from './components/GeneralPlanning';
import RecycleBin from './components/RecycleBin';
import { MOCK_CLUBS, MOCK_TICKETS, MOCK_CHECKS, MOCK_DOCS, MOCK_USERS, MOCK_MAINTENANCE, MOCK_FAILURE_TYPES, MOCK_ARTISANS, MOCK_SPECS, MOCK_PLANNING_EVENTS } from './constants';
import { Ticket, TicketStatus, PeriodicCheck, CheckStatus, UserRole, MaintenanceEvent, Club, TradeType, User, Artisan, DocumentFile, Specification, AppNotification, NotificationPreferences, Urgency, PlanningEvent } from './types';
import { Database, Copy, AlertTriangle, Trash2 } from 'lucide-react';
import { supabase } from './services/supabase';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [users, setUsers] = useState<User[]>([]);
  const [userPasswords, setUserPasswords] = useState<Record<string, string>>({
    'admin_fixed': 'Marielis1338!', 'user_marie': '123456', 'u_jonas': '123456', 'u_leanne': '123456', 'u_brian': '123456', 'u_julien': '123456'
  });
  
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [checks, setChecks] = useState<PeriodicCheck[]>([]);
  const [maintenanceEvents, setMaintenanceEvents] = useState<MaintenanceEvent[]>([]);
  const [planningEvents, setPlanningEvents] = useState<PlanningEvent[]>([]);
  const [docs, setDocs] = useState<DocumentFile[]>([]);
  const [artisans, setArtisans] = useState<Artisan[]>([]);
  const [specifications, setSpecifications] = useState<Specification[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [failureTypes] = useState<Record<TradeType, string[]>>(MOCK_FAILURE_TYPES);
  const [setupRequired, setSetupRequired] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(!supabase);

  // Synchronisation avec Supabase
  useEffect(() => {
    if (!supabase) {
        setTickets(MOCK_TICKETS);
        setChecks(MOCK_CHECKS);
        setMaintenanceEvents(MOCK_MAINTENANCE);
        setPlanningEvents(MOCK_PLANNING_EVENTS);
        setDocs(MOCK_DOCS);
        setSpecifications(MOCK_SPECS);
        setArtisans(MOCK_ARTISANS);
        setUsers(MOCK_USERS);
        setClubs(MOCK_CLUBS);
        return;
    }

    const fetchData = async (table: string, setState: React.Dispatch<React.SetStateAction<any[]>>) => {
      const { data, error } = await supabase.from(table).select('*');
      if (!error && data) {
        setState(data);
      } else if (error && error.code === '42P01') {
        setSetupRequired(true);
      }
    };

    const tables = ['clubs', 'tickets', 'checks', 'maintenance', 'planning', 'documents', 'specifications', 'artisans', 'users'];
    const setters = [setClubs, setTickets, setChecks, setMaintenanceEvents, setPlanningEvents, setDocs, setSpecifications, setArtisans, setUsers];

    tables.forEach((table, i) => fetchData(table, setters[i]));

    // Realtime subscriptions
    const channels = tables.map(table => {
      return supabase.channel(`public:${table}`)
        .on('postgres_changes', { event: '*', schema: 'public', table }, () => {
          fetchData(table, setters[tables.indexOf(table)]);
        })
        .subscribe();
    });

    return () => { channels.forEach(c => supabase.removeChannel(c)); };
  }, []);

  // --- LOGIQUE DE SUPPRESSION DÉFINITIVE ---
  // On remplace le "Soft Delete" par un "Hard Delete" si vous voulez que ça disparaisse pour de bon
  const handleDeleteTicket = async (ticketId: string) => {
    if (!window.confirm("Supprimer ce ticket définitivement ?")) return;

    if (!supabase) {
      setTickets(prev => prev.filter(t => t.id !== ticketId));
      return;
    }
    try {
      const { error } = await supabase.from('tickets').delete().eq('id', ticketId);
      if (error) throw error;
      setTickets(prev => prev.filter(t => t.id !== ticketId));
    } catch (e: any) { alert("Erreur suppression Supabase: " + e.message); }
  };

  const handleDeleteCheck = async (id: string) => {
    if (!window.confirm("Supprimer cette vérification définitivement ?")) return;
    if (!supabase) { setChecks(prev => prev.filter(c => c.id !== id)); return; }
    await supabase.from('checks').delete().eq('id', id);
    setChecks(prev => prev.filter(c => c.id !== id));
  };

  const handleDeleteMaintenanceEvent = async (id: string) => {
    if (!window.confirm("Supprimer cette maintenance ?")) return;
    if (!supabase) { setMaintenanceEvents(prev => prev.filter(m => m.id !== id)); return; }
    await supabase.from('maintenance').delete().eq('id', id);
    setMaintenanceEvents(prev => prev.filter(m => m.id !== id));
  };

  const handleDeletePlanningEvent = async (id: string) => {
    if (!window.confirm("Supprimer cet événement ?")) return;
    if (!supabase) { setPlanningEvents(prev => prev.filter(p => p.id !== id)); return; }
    await supabase.from('planning').delete().eq('id', id);
    setPlanningEvents(prev => prev.filter(p => p.id !== id));
  };

  // --- AUTRES GESTIONS ---
  const handleCreateTicket = async (newTicketData: Partial<Ticket>) => {
    if (!currentUser) return;
    if (!supabase) {
        const demoTicket = { ...newTicketData, id: `demo_${Date.now()}`, createdAt: new Date().toISOString(), status: TicketStatus.OPEN, deleted: false } as Ticket;
        setTickets(prev => [demoTicket, ...prev]);
        return;
    }
    await supabase.from('tickets').insert([{ ...newTicketData, status: TicketStatus.OPEN, createdBy: currentUser.id }]);
  };

  const handleUpdateTicketStatus = async (id: string, status: TicketStatus) => {
    if (!supabase) { setTickets(prev => prev.map(t => t.id === id ? { ...t, status } : t)); return; }
    await supabase.from('tickets').update({ status }).eq('id', id);
  };

  const handleAddArtisan = async (artisan: Partial<Artisan>) => {
    if (!supabase) { setArtisans(prev => [{...artisan, id: `a_${Date.now()}`} as Artisan, ...prev]); return; }
    await supabase.from('artisans').insert([artisan]);
  };

  const handleDeleteArtisan = async (id: string) => {
    if (!window.confirm("Supprimer ce contact ?")) return;
    if (!supabase) { setArtisans(prev => prev.filter(a => a.id !== id)); return; }
    await supabase.from('artisans').delete().eq('id', id);
  };

  const handleAddUser = async (user: Partial<User>, password?: string) => {
    if (!supabase) { setUsers(prev => [...prev, {...user, id: `u_${Date.now()}`} as User]); return; }
    await supabase.from('users').insert([user]);
  };

  const handleDeleteUser = async (id: string) => {
    if (!window.confirm("Supprimer cet utilisateur ?")) return;
    if (!supabase) { setUsers(prev => prev.filter(u => u.id !== id)); return; }
    await supabase.from('users').delete().eq('id', id);
  };

  const handleLogin = async (email: string, password: string): Promise<boolean> => {
    const userList = users.length > 0 ? users : MOCK_USERS;
    const foundUser = userList.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (foundUser) {
        const storedPass = userPasswords[foundUser.id] || (foundUser.id === 'admin_fixed' ? 'Marielis1338!' : '123456');
        if (storedPass === password) { 
            setCurrentUser(foundUser); 
            setIsAuthenticated(true); 
            localStorage.setItem('mcl_session_user', JSON.stringify(foundUser)); 
            return true; 
        }
    }
    return false;
  };

  const handleLogout = () => { setIsAuthenticated(false); setCurrentUser(null); localStorage.removeItem('mcl_session_user'); };

  const renderContent = () => {
    if (!currentUser) return null;
    switch (activeTab) {
      case 'dashboard': return <Dashboard tickets={tickets} checks={checks} clubs={clubs} maintenanceEvents={maintenanceEvents} currentUser={currentUser} />;
      case 'tickets': return <TicketManager tickets={tickets} clubs={clubs} users={users} currentUser={currentUser} failureTypes={failureTypes} onCreateTicket={handleCreateTicket} onEditTicket={() => {}} onDeleteTicket={handleDeleteTicket} onUpdateStatus={handleUpdateTicketStatus} />;
      case 'checks': return <CheckManager checks={checks} clubs={clubs} user={currentUser} onUpdateCheck={() => {}} onCreateCheck={() => {}} onEditCheck={() => {}} onDeleteCheck={handleDeleteCheck} />;
      case 'contact': return <ContactBook artisans={artisans} currentUser={currentUser} onAddArtisan={handleAddArtisan} onDeleteArtisan={handleDeleteArtisan} onEditArtisan={() => {}} />;
      case 'users': return <UserManager users={users} clubs={clubs} userPasswords={userPasswords} onAddUser={handleAddUser} onEditUser={() => {}} onDeleteUser={handleDeleteUser} />;
      case 'planning': return <GeneralPlanning events={planningEvents} currentUser={currentUser} onAddEvent={() => {}} onEditEvent={() => {}} onDeleteEvent={handleDeletePlanningEvent} />;
      case 'maintenance': return <MaintenanceSchedule tickets={tickets} checks={checks} clubs={clubs} currentUser={currentUser} maintenanceEvents={maintenanceEvents} onAddEvent={() => {}} onEditEvent={() => {}} onDeleteEvent={handleDeleteMaintenanceEvent} />;
      default: return <Dashboard tickets={tickets} checks={checks} clubs={clubs} currentUser={currentUser} />;
    }
  };

  if (!isAuthenticated || !currentUser) return <Login onLogin={handleLogin} />;

  return (
    <Layout user={currentUser} onLogout={handleLogout} activeTab={activeTab} onTabChange={setActiveTab}>
      {renderContent()}
    </Layout>
  );
};

export default App;
