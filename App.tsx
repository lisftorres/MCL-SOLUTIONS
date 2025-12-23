
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
import { ShieldCheck, CloudOff } from 'lucide-react';
import { supabase } from './services/supabase';

const App: React.FC = () => {
  // Session persistence (Auth remains local for UX)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('mcl_isAuthenticated') === 'true';
  });
  
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('mcl_currentUser');
    try { return savedUser ? JSON.parse(savedUser) : null; } catch { return null; }
  });

  const [activeTab, setActiveTab] = useState<string>(() => {
    return localStorage.getItem('mcl_activeTab') || 'dashboard';
  });

  const [dbStatus, setDbStatus] = useState<'CONNECTED' | 'DEMO' | 'ERROR'>('DEMO');
  
  // Data States - Initialized with Empty arrays, filled by Supabase
  const [users, setUsers] = useState<User[]>(MOCK_USERS);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [checks, setChecks] = useState<PeriodicCheck[]>([]);
  const [maintenanceEvents, setMaintenanceEvents] = useState<MaintenanceEvent[]>([]);
  const [planningEvents, setPlanningEvents] = useState<PlanningEvent[]>([]);
  const [financialDocs, setFinancialDocs] = useState<DocumentFile[]>([]);
  const [technicalDocs, setTechnicalDocs] = useState<DocumentFile[]>([]);
  const [artisans, setArtisans] = useState<Artisan[]>(MOCK_ARTISANS);
  const [specifications, setSpecifications] = useState<Specification[]>(MOCK_SPECS);
  const [clubs, setClubs] = useState<Club[]>(MOCK_CLUBS);
  const [failureTypes, setFailureTypes] = useState<Record<TradeType, string[]>>(MOCK_FAILURE_TYPES);
  const [userPasswords, setUserPasswords] = useState<Record<string, string>>({ 'admin_fixed': '10121986' });

  // Sync Auth only
  useEffect(() => {
    localStorage.setItem('mcl_isAuthenticated', isAuthenticated.toString());
    localStorage.setItem('mcl_activeTab', activeTab);
    if (currentUser) localStorage.setItem('mcl_currentUser', JSON.stringify(currentUser));
  }, [isAuthenticated, currentUser, activeTab]);

  const fetchData = async () => {
    if (!supabase) {
      setDbStatus('DEMO');
      setTickets(MOCK_TICKETS);
      setChecks(MOCK_CHECKS);
      return;
    }
    try {
      const { data: clubsData } = await supabase.from('clubs').select('*');
      const { data: ticketsData } = await supabase.from('tickets').select('*').order('createdAt', { ascending: false });
      const { data: checksData } = await supabase.from('checks').select('*');
      const { data: maintData } = await supabase.from('maintenance').select('*');
      const { data: planningData } = await supabase.from('planning').select('*');
      const { data: finData } = await supabase.from('financial_documents').select('*');
      const { data: techData } = await supabase.from('technical_documents').select('*');
      const { data: artData } = await supabase.from('artisans').select('*');
      const { data: usersData } = await supabase.from('users').select('*');

      setDbStatus('CONNECTED');
      if (clubsData) setClubs(clubsData);
      if (ticketsData) setTickets(ticketsData);
      if (checksData) setChecks(checksData);
      if (maintData) setMaintenanceEvents(maintData);
      if (planningData) setPlanningEvents(planningData);
      if (finData) setFinancialDocs(finData);
      if (techData) setTechnicalDocs(techData);
      if (artData) setArtisans(artData);
      if (usersData) setUsers(usersData);
    } catch (e: any) {
      console.error("Supabase Fetch Error:", e);
      setDbStatus('ERROR');
    }
  };

  useEffect(() => { fetchData(); }, []);

  const syncOperation = async (table: string, method: 'insert' | 'update' | 'delete', data: any, id?: string) => {
    if (!supabase) return true; // Mock success in demo mode
    try {
      if (method === 'insert') {
        const { error } = await supabase.from(table).insert([data]);
        if (error) throw error;
      }
      if (method === 'update') {
        const { error } = await supabase.from(table).update(data).eq('id', id || data.id);
        if (error) throw error;
      }
      if (method === 'delete') {
        const { error } = await supabase.from(table).delete().eq('id', id);
        if (error) throw error;
      }
      return true;
    } catch (e) {
      console.error(`Supabase Sync Error (${table}):`, e);
      alert("Erreur de synchronisation avec la base de données.");
      return false;
    }
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

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    setActiveTab('dashboard');
    localStorage.clear();
  };

  // HANDLERS WITH SUPABASE SYNC
  const handleTicketCreate = async (t: Partial<Ticket>) => {
    const newTicket = { ...t, id: `t_${Date.now()}`, createdAt: new Date().toISOString() } as Ticket;
    const success = await syncOperation('tickets', 'insert', newTicket);
    if (success) setTickets(prev => [newTicket, ...prev]);
  };

  const handleTicketUpdate = async (t: Ticket) => {
    const success = await syncOperation('tickets', 'update', t);
    if (success) setTickets(prev => prev.map(x => x.id === t.id ? t : x));
  };

  const handleTicketDelete = async (id: string) => {
    const success = await syncOperation('tickets', 'delete', null, id);
    if (success) setTickets(prev => prev.filter(x => x.id !== id));
  };

  const handleTicketUpdateStatus = async (id: string, status: TicketStatus) => {
    const success = await syncOperation('tickets', 'update', { status }, id);
    if (success) setTickets(prev => prev.map(t => t.id === id ? { ...t, status } : t));
  };

  const renderContent = () => {
    if (!currentUser) return null;
    const commonProps = { currentUser, clubs, users };

    switch (activeTab) {
      case 'dashboard': 
        return <Dashboard {...commonProps} tickets={tickets} checks={checks} maintenanceEvents={maintenanceEvents} />;
      
      case 'tickets': 
        return <TicketManager {...commonProps} tickets={tickets} failureTypes={failureTypes} onCreateTicket={handleTicketCreate} onEditTicket={handleTicketUpdate} onDeleteTicket={handleTicketDelete} onUpdateStatus={handleTicketUpdateStatus} />;
      
      case 'planning': 
        return <GeneralPlanning events={planningEvents} currentUser={currentUser} onAddEvent={async (e) => { const n = {...e, id:`p_${Date.now()}`}; if(await syncOperation('planning','insert',n)) setPlanningEvents(p=>[...p, n as PlanningEvent]); }} onEditEvent={async (e) => { if(await syncOperation('planning','update',e)) setPlanningEvents(p=>p.map(x=>x.id===e.id?e:x)); }} onDeleteEvent={async (id) => { if(await syncOperation('planning','delete',null,id)) setPlanningEvents(p=>p.filter(x=>x.id!==id)); }} />;
      
      case 'checks': 
        return <CheckManager checks={checks} clubs={clubs} user={currentUser} onUpdateCheck={async (id, items, status) => { if(await syncOperation('checks','update',{checklistItems:items, status},id)) setChecks(p=>p.map(x=>x.id===id?{...x, checklistItems:items, status}:x)); }} onCreateCheck={async (c) => { const n = {...c, id:`c_${Date.now()}`}; if(await syncOperation('checks','insert',n)) setChecks(p=>[...p, n as PeriodicCheck]); }} onEditCheck={async (c) => { if(await syncOperation('checks','update',c)) setChecks(p=>p.map(x=>x.id===c.id?c:x)); }} onDeleteCheck={async (id) => { if(await syncOperation('checks','delete',null,id)) setChecks(p=>p.filter(x=>x.id!==id)); }} />;
      
      case 'maintenance': 
        return <MaintenanceSchedule {...commonProps} tickets={tickets} checks={checks} maintenanceEvents={maintenanceEvents} onAddEvent={async (m) => { const n = {...m, id:`m_${Date.now()}`}; if(await syncOperation('maintenance','insert',n)) setMaintenanceEvents(p=>[...p, n as MaintenanceEvent]); }} onEditEvent={async (m) => { if(await syncOperation('maintenance','update',m)) setMaintenanceEvents(p=>p.map(x=>x.id===m.id?m:x)); }} onDeleteEvent={async (id) => { if(await syncOperation('maintenance','delete',null,id)) setMaintenanceEvents(p=>p.filter(x=>x.id!==id)); }} />;
      
      case 'specs': 
        return <SpecificationsManager specifications={specifications} currentUser={currentUser} onAddSpecification={async (s) => { const n = {...s, id:`s_${Date.now()}`}; if(await syncOperation('specifications','insert',n)) setSpecifications(p=>[...p, n as Specification]); }} onEditSpecification={async (s) => { if(await syncOperation('specifications','update',s)) setSpecifications(p=>p.map(x=>x.id===s.id?s:x)); }} onDeleteSpecification={async (id) => { if(await syncOperation('specifications','delete',null,id)) setSpecifications(p=>p.filter(x=>x.id!==id)); }} />;
      
      case 'contact': 
        return <ContactBook artisans={artisans} currentUser={currentUser} onAddArtisan={async (a) => { const n = {...a, id:`a_${Date.now()}`}; if(await syncOperation('artisans','insert',n)) setArtisans(p=>[...p, n as Artisan]); }} onEditArtisan={async (a) => { if(await syncOperation('artisans','update',a)) setArtisans(p=>p.map(x=>x.id===a.id?a:x)); }} onDeleteArtisan={async (id) => { if(await syncOperation('artisans','delete',null,id)) setArtisans(p=>p.filter(x=>x.id!==id)); }} />;
      
      case 'financial': 
        return <FinancialManager documents={financialDocs} clubs={clubs} currentUser={currentUser} onAddDocument={async (d) => { const n = {...d, id:`d_${Date.now()}`}; if(await syncOperation('financial_documents','insert',n)) setFinancialDocs(p=>[...p, n as DocumentFile]); }} onDeleteDocument={async (id) => { if(await syncOperation('financial_documents','delete',null,id)) setFinancialDocs(p=>p.filter(x=>x.id!==id)); }} />;
      
      case 'documents': 
        return <DocumentManager documents={technicalDocs} clubs={clubs} currentUser={currentUser} onAddDocument={async (d) => { const n = {...d, id:`d_${Date.now()}`}; if(await syncOperation('technical_documents','insert',n)) setTechnicalDocs(p=>[...p, n as DocumentFile]); }} onDeleteDocument={async (id) => { if(await syncOperation('technical_documents','delete',null,id)) setTechnicalDocs(p=>p.filter(x=>x.id!==id)); }} />;
      
      case 'users': 
        return <UserManager users={users} clubs={clubs} userPasswords={userPasswords} onAddUser={async (u, p) => { const n = {...u, id:`u_${Date.now()}`}; if(await syncOperation('users','insert',n)) { setUsers(prev=>[...prev, n as User]); if(p) setUserPasswords(prev=>({...prev, [n.id as string]: p})); } }} onEditUser={async (u, p) => { if(await syncOperation('users','update',u)) { setUsers(prev=>prev.map(x=>x.id===u.id?u:x)); if(p) setUserPasswords(prev=>({...prev, [u.id]: p})); } }} onDeleteUser={async (id) => { if(await syncOperation('users','delete',null,id)) setUsers(prev=>prev.filter(x=>x.id!==id)); }} />;
      
      case 'settings': 
        return <SettingsManager clubs={clubs} failureTypes={failureTypes} onAddClub={async (c) => { if(await syncOperation('clubs','insert',c)) setClubs(p=>[...p, c]); }} onDeleteClub={async (id) => { if(await syncOperation('clubs','delete',null,id)) setClubs(p=>p.filter(x=>x.id!==id)); }} onUpdateClubSpaces={async (id, spaces) => { if(await syncOperation('clubs','update',{spaces},id)) setClubs(p=>p.map(x=>x.id===id?{...x, spaces}:x)); }} onUpdateFailureTypes={() => {}} />;
      
      default: 
        return <Dashboard {...commonProps} tickets={tickets} />;
    }
  };

  if (isAuthenticated && !currentUser) return <div className="min-h-screen bg-brand-dark flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-brand-yellow"></div></div>;

  if (!isAuthenticated || !currentUser) return <Login onLogin={handleLogin} />;

  return (
    <Layout user={currentUser} onLogout={handleLogout} activeTab={activeTab} onTabChange={setActiveTab}>
      <div className={`mb-6 p-4 rounded-2xl border flex flex-col md:flex-row items-center justify-between gap-4 shadow-lg backdrop-blur-md transition-all ${dbStatus === 'CONNECTED' ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-full ${dbStatus === 'CONNECTED' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
            {dbStatus === 'CONNECTED' ? <ShieldCheck size={24} /> : <CloudOff size={24} />}
          </div>
          <div>
            <h3 className="text-sm font-black uppercase tracking-widest text-white">
               {dbStatus === 'CONNECTED' ? 'Stockage Supabase Connecté' : 'Erreur de Connexion Cloud'}
            </h3>
            <p className="text-xs text-gray-400 font-medium">
               {dbStatus === 'CONNECTED' ? 'Toutes les données et photos sont synchronisées en temps réel.' : 'L\'application fonctionne en mode limité (données démo).'}
            </p>
          </div>
        </div>
        {dbStatus !== 'CONNECTED' && (
           <button onClick={fetchData} className="px-4 py-2 bg-red-500/20 text-red-400 text-[10px] font-black uppercase border border-red-500/40 rounded-lg hover:bg-red-500/30 transition">Réessayer</button>
        )}
      </div>
      {renderContent()}
    </Layout>
  );
};

export default App;
