
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
import { Ticket, TicketStatus, PeriodicCheck, CheckStatus, UserRole, MaintenanceEvent, Club, TradeType, User, Artisan, DocumentFile, Specification, PlanningEvent } from './types';
import { Database, WifiOff, ShieldCheck, DatabaseZap } from 'lucide-react';
import { supabase } from './services/supabase';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dbStatus, setDbStatus] = useState<'CONNECTED' | 'DEMO' | 'ERROR'>('DEMO');
  
  const [users, setUsers] = useState<User[]>(MOCK_USERS);
  const [userPasswords, setUserPasswords] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem('mcl_passwords');
    return saved ? JSON.parse(saved) : { 
      'admin_fixed': '10121986', 
      'user_marie': '123456', 
      'u_jonas': '123456', 
      'u_leanne': '123456', 
      'u_brian': '123456', 
      'u_julien': '123456' 
    };
  });

  const [tickets, setTickets] = useState<Ticket[]>(MOCK_TICKETS);
  const [checks, setChecks] = useState<PeriodicCheck[]>(MOCK_CHECKS);
  const [maintenanceEvents, setMaintenanceEvents] = useState<MaintenanceEvent[]>(MOCK_MAINTENANCE);
  const [planningEvents, setPlanningEvents] = useState<PlanningEvent[]>(MOCK_PLANNING_EVENTS);
  const [docs, setDocs] = useState<DocumentFile[]>(MOCK_DOCS);
  const [artisans, setArtisans] = useState<Artisan[]>(MOCK_ARTISANS);
  const [specifications, setSpecifications] = useState<Specification[]>(MOCK_SPECS);
  const [clubs, setClubs] = useState<Club[]>(MOCK_CLUBS);
  const [failureTypes, setFailureTypes] = useState<Record<TradeType, string[]>>(MOCK_FAILURE_TYPES);

  useEffect(() => {
    localStorage.setItem('mcl_passwords', JSON.stringify(userPasswords));
  }, [userPasswords]);

  const fetchData = async () => {
    if (!supabase) return;
    try {
      const results = await Promise.all([
        supabase.from('clubs').select('*'),
        supabase.from('tickets').select('*').eq('deleted', false),
        supabase.from('checks').select('*').eq('deleted', false),
        supabase.from('maintenance').select('*').eq('deleted', false),
        supabase.from('planning').select('*').eq('deleted', false),
        supabase.from('documents').select('*'),
        supabase.from('specifications').select('*'),
        supabase.from('artisans').select('*'),
        supabase.from('users').select('*')
      ]);

      setDbStatus('CONNECTED');
      if (results[0].data && results[0].data.length > 0) setClubs(results[0].data);
      if (results[1].data && results[1].data.length > 0) setTickets(results[1].data);
      if (results[2].data && results[2].data.length > 0) setChecks(results[2].data);
      if (results[3].data && results[3].data.length > 0) setMaintenanceEvents(results[3].data);
      if (results[4].data && results[4].data.length > 0) setPlanningEvents(results[4].data);
      if (results[5].data && results[5].data.length > 0) setDocs(results[5].data);
      if (results[6].data && results[6].data.length > 0) setSpecifications(results[6].data);
      if (results[7].data && results[7].data.length > 0) setArtisans(results[7].data);
      if (results[8].data && results[8].data.length > 0) setUsers(results[8].data);
    } catch (e: any) {
      console.error("Erreur sync:", e);
      setDbStatus('ERROR');
    }
  };

  useEffect(() => {
    if (!supabase) {
      setDbStatus('DEMO');
    } else {
      fetchData();
      const tables = ['tickets', 'checks', 'maintenance', 'planning', 'artisans', 'users', 'clubs', 'documents', 'specifications'];
      const channels = tables.map(table => 
        supabase.channel(`public:${table}`).on('postgres_changes', { event: '*', schema: 'public', table }, () => fetchData()).subscribe()
      );
      return () => { channels.forEach(c => supabase.removeChannel(c)); };
    }
  }, []);

  const syncOperation = async (table: string, method: 'insert' | 'update' | 'delete', data: any, id?: string) => {
    if (!supabase) return; 
    try {
      if (method === 'insert') await supabase.from(table).insert([data]);
      if (method === 'update') await supabase.from(table).update(data).eq('id', id || data.id);
      if (method === 'delete') await supabase.from(table).delete().eq('id', id);
    } catch (e) {
      console.error(`Erreur sync ${table}:`, e);
    }
  };

  const handleTicketCreate = (t: Partial<Ticket>) => {
    const newTicket = { 
      ...t, 
      id: `t_${Date.now()}`, 
      createdAt: new Date().toISOString(),
      history: [{ date: new Date().toISOString(), user: currentUser?.name || 'Système', action: 'CREATION' }],
      images: t.images || [],
      deleted: false
    } as Ticket;
    setTickets(prev => [newTicket, ...prev]);
    syncOperation('tickets', 'insert', newTicket);
  };

  const handleTicketEdit = (t: Ticket) => {
    setTickets(prev => prev.map(item => item.id === t.id ? t : item));
    syncOperation('tickets', 'update', t);
  };

  const handleTicketDelete = (id: string) => {
    setTickets(prev => prev.filter(t => t.id !== id));
    syncOperation('tickets', 'update', { deleted: true }, id);
  };

  const handleTicketStatus = (id: string, status: TicketStatus) => {
    setTickets(prev => prev.map(t => t.id === id ? { ...t, status } : t));
    syncOperation('tickets', 'update', { status }, id);
  };

  const handleCheckCreate = (c: Partial<PeriodicCheck>) => {
    const newCheck = { ...c, id: `ch_${Date.now()}`, history: [], deleted: false } as PeriodicCheck;
    setChecks(prev => [newCheck, ...prev]);
    syncOperation('checks', 'insert', newCheck);
  };

  const handleCheckUpdate = (id: string, items: any[], status: CheckStatus) => {
    setChecks(prev => prev.map(c => c.id === id ? { ...c, checklistItems: items, status } : c));
    syncOperation('checks', 'update', { checklistItems: items, status, lastChecked: status === CheckStatus.COMPLETED ? new Date().toISOString() : undefined }, id);
  };

  const handleCheckEdit = (c: PeriodicCheck) => {
    setChecks(prev => prev.map(item => item.id === c.id ? c : item));
    syncOperation('checks', 'update', c);
  };

  const handleCheckDelete = (id: string) => {
    setChecks(prev => prev.filter(c => c.id !== id));
    syncOperation('checks', 'update', { deleted: true }, id);
  };

  const handleMaintenanceAdd = (m: Partial<MaintenanceEvent>) => {
    const newEvent = { ...m, id: `m_${Date.now()}`, deleted: false } as MaintenanceEvent;
    setMaintenanceEvents(prev => [newEvent, ...prev]);
    syncOperation('maintenance', 'insert', newEvent);
  };

  const handleMaintenanceEdit = (m: MaintenanceEvent) => {
    setMaintenanceEvents(prev => prev.map(item => item.id === m.id ? m : item));
    syncOperation('maintenance', 'update', m);
  };

  const handleMaintenanceDelete = (id: string) => {
    setMaintenanceEvents(prev => prev.filter(m => m.id !== id));
    syncOperation('maintenance', 'update', { deleted: true }, id);
  };

  const handlePlanningAdd = (e: Partial<PlanningEvent>) => {
    const newEvent = { ...e, id: `pe_${Date.now()}`, deleted: false } as PlanningEvent;
    setPlanningEvents(prev => [...prev, newEvent]);
    syncOperation('planning', 'insert', newEvent);
  };

  const handlePlanningEdit = (e: PlanningEvent) => {
    setPlanningEvents(prev => prev.map(item => item.id === e.id ? e : item));
    syncOperation('planning', 'update', e);
  };

  const handlePlanningDelete = (id: string) => {
    setPlanningEvents(prev => prev.filter(e => e.id !== id));
    syncOperation('planning', 'update', { deleted: true }, id);
  };

  const handleClubAdd = (c: Club) => {
    setClubs(prev => [...prev, c]);
    syncOperation('clubs', 'insert', c);
  };

  const handleClubDelete = (id: string) => {
    setClubs(prev => prev.filter(c => c.id !== id));
    syncOperation('clubs', 'delete', null, id);
  };

  const handleUserAdd = (u: Partial<User>, p?: string) => {
    const newUser = { 
      ...u, 
      id: `u_${Date.now()}`,
      preferences: { tickets: true, checks: true, maintenance: true, browserPush: false },
      clubIds: u.clubIds || []
    } as User;
    if (p) setUserPasswords(prev => ({ ...prev, [newUser.id]: p }));
    setUsers(prev => [...prev, newUser]);
    syncOperation('users', 'insert', newUser);
  };

  const handleUserEdit = (u: User, p?: string) => {
    if (p) setUserPasswords(prev => ({ ...prev, [u.id]: p }));
    setUsers(prev => prev.map(user => user.id === u.id ? u : user));
    syncOperation('users', 'update', u);
  };

  const handleUserDelete = (id: string) => {
    setUsers(prev => prev.filter(u => u.id !== id));
    syncOperation('users', 'delete', null, id);
  };

  const handleLogin = async (email: string, password: string): Promise<boolean> => {
    const foundUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (foundUser) {
      const storedPass = userPasswords[foundUser.id] || "123456";
      if (storedPass === password) { 
        setCurrentUser(foundUser); 
        setIsAuthenticated(true); 
        return true; 
      }
    }
    return false;
  };

  const handleLogout = () => { setIsAuthenticated(false); setCurrentUser(null); };

  const renderContent = () => {
    if (!currentUser) return null;
    const commonProps = { currentUser, tickets, checks, clubs, users };

    switch (activeTab) {
      case 'dashboard': return <Dashboard {...commonProps} maintenanceEvents={maintenanceEvents} />;
      case 'planning': return <GeneralPlanning events={planningEvents} currentUser={currentUser} onAddEvent={handlePlanningAdd} onEditEvent={handlePlanningEdit} onDeleteEvent={handlePlanningDelete} />;
      case 'tickets': return <TicketManager {...commonProps} failureTypes={failureTypes} onCreateTicket={handleTicketCreate} onEditTicket={handleTicketEdit} onDeleteTicket={handleTicketDelete} onUpdateStatus={handleTicketStatus} />;
      case 'checks': return <CheckManager checks={checks} clubs={clubs} user={currentUser} onUpdateCheck={handleCheckUpdate} onCreateCheck={handleCheckCreate} onEditCheck={handleCheckEdit} onDeleteCheck={handleCheckDelete} />;
      case 'maintenance': return <MaintenanceSchedule {...commonProps} maintenanceEvents={maintenanceEvents} onAddEvent={handleMaintenanceAdd} onEditEvent={handleMaintenanceEdit} onDeleteEvent={handleMaintenanceDelete} />;
      case 'users': return <UserManager users={users} clubs={clubs} userPasswords={userPasswords} onAddUser={handleUserAdd} onEditUser={handleUserEdit} onDeleteUser={handleUserDelete} />;
      case 'specs': return <SpecificationsManager specifications={specifications} currentUser={currentUser} onAddSpecification={() => {}} onEditSpecification={() => {}} onDeleteSpecification={() => {}} />;
      case 'contact': return <ContactBook artisans={artisans} currentUser={currentUser} onAddArtisan={() => {}} onEditArtisan={() => {}} onDeleteArtisan={() => {}} />;
      case 'financial': return <FinancialManager documents={docs} clubs={clubs} currentUser={currentUser} onAddDocument={() => {}} onDeleteDocument={() => {}} />;
      case 'documents': return <DocumentManager documents={docs} clubs={clubs} currentUser={currentUser} onAddDocument={() => {}} onDeleteDocument={() => {}} />;
      case 'settings': return <SettingsManager clubs={clubs} failureTypes={failureTypes} onAddClub={handleClubAdd} onDeleteClub={handleClubDelete} onUpdateClubSpaces={() => {}} onUpdateFailureTypes={() => {}} />;
      default: return <Dashboard {...commonProps} maintenanceEvents={maintenanceEvents} />;
    }
  };

  if (!isAuthenticated || !currentUser) return <Login onLogin={handleLogin} />;

  return (
    <Layout user={currentUser} onLogout={handleLogout} activeTab={activeTab} onTabChange={setActiveTab}>
      <div className={`mb-6 p-4 rounded-2xl border flex flex-col md:flex-row items-center justify-between gap-4 shadow-lg backdrop-blur-md animate-fade-in ${
        dbStatus === 'CONNECTED' ? 'bg-green-500/10 border-green-500/30' : 
        dbStatus === 'DEMO' ? 'bg-brand-yellow/10 border-brand-yellow/30' : 
        'bg-red-500/10 border-red-500/30'
      }`}>
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-full ${dbStatus === 'CONNECTED' ? 'bg-green-500/20 text-green-400' : 'bg-brand-yellow/20 text-brand-yellow'}`}>
            <ShieldCheck size={24} />
          </div>
          <div>
            <h3 className="text-sm font-black uppercase tracking-widest text-white">
              {dbStatus === 'CONNECTED' ? 'Supabase Connecté' : 'Mode Démonstration'}
            </h3>
            <p className="text-xs text-gray-400 font-medium">
              {dbStatus === 'CONNECTED' ? 'Synchronisation Cloud Active.' : 'Les données créées sont conservées durant la session.'}
            </p>
          </div>
        </div>
      </div>
      {renderContent()}
    </Layout>
  );
};

export default App;
