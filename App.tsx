
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
  
  // États des données
  const [users, setUsers] = useState<User[]>([]);
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

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [checks, setChecks] = useState<PeriodicCheck[]>([]);
  const [maintenanceEvents, setMaintenanceEvents] = useState<MaintenanceEvent[]>([]);
  const [planningEvents, setPlanningEvents] = useState<PlanningEvent[]>([]);
  const [docs, setDocs] = useState<DocumentFile[]>([]);
  const [artisans, setArtisans] = useState<Artisan[]>([]);
  const [specifications, setSpecifications] = useState<Specification[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [failureTypes, setFailureTypes] = useState<Record<TradeType, string[]>>(MOCK_FAILURE_TYPES);

  useEffect(() => {
    localStorage.setItem('mcl_passwords', JSON.stringify(userPasswords));
  }, [userPasswords]);

  // --- CHARGEMENT DES DONNÉES ---
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
      setClubs(results[0].data || []);
      setTickets(results[1].data || []);
      setChecks(results[2].data || []);
      setMaintenanceEvents(results[3].data || []);
      setPlanningEvents(results[4].data || []);
      setDocs(results[5].data || []);
      setSpecifications(results[6].data || []);
      setArtisans(results[7].data || []);
      setUsers(results[8].data || []);
    } catch (e: any) {
      setDbStatus('ERROR');
      fallbackToDemo();
    }
  };

  const fallbackToDemo = () => {
    setClubs(MOCK_CLUBS); setTickets(MOCK_TICKETS); setChecks(MOCK_CHECKS);
    setMaintenanceEvents(MOCK_MAINTENANCE); setPlanningEvents(MOCK_PLANNING_EVENTS);
    setDocs(MOCK_DOCS); setSpecifications(MOCK_SPECS); setArtisans(MOCK_ARTISANS);
    setUsers(MOCK_USERS);
  };

  useEffect(() => {
    if (!supabase) {
      setDbStatus('DEMO');
      fallbackToDemo();
    } else {
      fetchData();
      const tables = ['tickets', 'checks', 'maintenance', 'planning', 'artisans', 'users', 'clubs', 'documents', 'specifications'];
      const channels = tables.map(table => 
        supabase.channel(`public:${table}`).on('postgres_changes', { event: '*', schema: 'public', table }, () => fetchData()).subscribe()
      );
      return () => { channels.forEach(c => supabase.removeChannel(c)); };
    }
  }, []);

  // --- SYNC HELPERS ---
  const syncOperation = async (table: string, method: 'insert' | 'update' | 'delete', data: any, id?: string) => {
    if (!supabase) {
      fetchData(); // Rafraîchissement local pour le mode démo
      return;
    }
    if (method === 'insert') await supabase.from(table).insert([data]);
    if (method === 'update') await supabase.from(table).update(data).eq('id', id || data.id);
    if (method === 'delete') await supabase.from(table).delete().eq('id', id);
    fetchData();
  };

  // --- TICKETS ---
  const handleTicketCreate = (t: Partial<Ticket>) => syncOperation('tickets', 'insert', t);
  const handleTicketEdit = (t: Ticket) => syncOperation('tickets', 'update', t);
  const handleTicketDelete = (id: string) => syncOperation('tickets', 'update', { deleted: true }, id);
  const handleTicketStatus = (id: string, status: TicketStatus) => syncOperation('tickets', 'update', { status }, id);

  // --- CHECKS ---
  const handleCheckCreate = (c: Partial<PeriodicCheck>) => syncOperation('checks', 'insert', c);
  const handleCheckEdit = (c: PeriodicCheck) => syncOperation('checks', 'update', c);
  const handleCheckDelete = (id: string) => syncOperation('checks', 'update', { deleted: true }, id);
  const handleCheckUpdate = (id: string, items: any[], status: CheckStatus) => syncOperation('checks', 'update', { checklistItems: items, status, lastChecked: status === CheckStatus.COMPLETED ? new Date().toISOString() : undefined }, id);

  // --- MAINTENANCE ---
  const handleMaintenanceAdd = (m: Partial<MaintenanceEvent>) => syncOperation('maintenance', 'insert', m);
  const handleMaintenanceEdit = (m: MaintenanceEvent) => syncOperation('maintenance', 'update', m);
  const handleMaintenanceDelete = (id: string) => syncOperation('maintenance', 'update', { deleted: true }, id);

  // --- PLANNING ---
  const handlePlanningAdd = (p: Partial<PlanningEvent>) => syncOperation('planning', 'insert', p);
  const handlePlanningEdit = (p: PlanningEvent) => syncOperation('planning', 'update', p);
  const handlePlanningDelete = (id: string) => syncOperation('planning', 'update', { deleted: true }, id);

  // --- ARTISANS ---
  const handleArtisanAdd = (a: Partial<Artisan>) => syncOperation('artisans', 'insert', a);
  const handleArtisanEdit = (a: Artisan) => syncOperation('artisans', 'update', a);
  const handleArtisanDelete = (id: string) => syncOperation('artisans', 'delete', null, id);

  // --- SPECS ---
  const handleSpecAdd = (s: Partial<Specification>) => syncOperation('specifications', 'insert', s);
  const handleSpecEdit = (s: Specification) => syncOperation('specifications', 'update', s);
  const handleSpecDelete = (id: string) => syncOperation('specifications', 'delete', null, id);

  // --- DOCUMENTS ---
  const handleDocAdd = (d: Partial<DocumentFile>) => syncOperation('documents', 'insert', d);
  const handleDocDelete = (id: string) => syncOperation('documents', 'delete', null, id);

  // --- CLUBS & SETTINGS ---
  const handleClubAdd = (c: Club) => syncOperation('clubs', 'insert', c);
  const handleClubDelete = (id: string) => syncOperation('clubs', 'delete', null, id);
  const handleClubSpaces = (id: string, spaces: string[]) => syncOperation('clubs', 'update', { spaces }, id);

  // --- USERS ---
  const handleUserAdd = (u: Partial<User>, p?: string) => {
    if (p) setUserPasswords(prev => ({ ...prev, [u.id || '']: p }));
    syncOperation('users', 'insert', u);
  };
  const handleUserEdit = (u: User, p?: string) => {
    if (p) setUserPasswords(prev => ({ ...prev, [u.id]: p }));
    syncOperation('users', 'update', u);
  };
  const handleUserDelete = (id: string) => syncOperation('users', 'delete', null, id);

  // --- AUTH ---
  const handleLogin = async (email: string, password: string): Promise<boolean> => {
    const userList = users.length > 0 ? users : MOCK_USERS;
    const foundUser = userList.find(u => u.email.toLowerCase() === email.toLowerCase());
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

  // --- RENDER ---
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
      case 'specs': return <SpecificationsManager specifications={specifications} currentUser={currentUser} onAddSpecification={handleSpecAdd} onEditSpecification={handleSpecEdit} onDeleteSpecification={handleSpecDelete} />;
      case 'contact': return <ContactBook artisans={artisans} currentUser={currentUser} onAddArtisan={handleArtisanAdd} onEditArtisan={handleArtisanEdit} onDeleteArtisan={handleArtisanDelete} />;
      case 'financial': return <FinancialManager documents={docs} clubs={clubs} currentUser={currentUser} onAddDocument={handleDocAdd} onDeleteDocument={handleDocDelete} />;
      case 'documents': return <DocumentManager documents={docs} clubs={clubs} currentUser={currentUser} onAddDocument={handleDocAdd} onDeleteDocument={handleDocDelete} />;
      case 'settings': return <SettingsManager clubs={clubs} failureTypes={failureTypes} onAddClub={handleClubAdd} onDeleteClub={handleClubDelete} onUpdateClubSpaces={handleClubSpaces} onUpdateFailureTypes={() => {}} />;
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
              {dbStatus === 'CONNECTED' ? 'Connecté à Supabase' : 'Mode Démonstration'}
            </h3>
            <p className="text-xs text-gray-400 font-medium">
              {dbStatus === 'CONNECTED' ? 'Synchronisation Cloud Active.' : 'Données locales uniquement.'}
            </p>
          </div>
        </div>
        {dbStatus === 'CONNECTED' && (
          <div className="flex items-center gap-2 bg-green-500/20 px-3 py-1.5 rounded-full">
            <DatabaseZap size={14} className="text-green-400" />
            <span className="text-[10px] font-black text-green-400 uppercase">Live Sync</span>
          </div>
        )}
      </div>
      {renderContent()}
    </Layout>
  );
};

export default App;
