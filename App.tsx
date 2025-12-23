
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
import { ShieldCheck } from 'lucide-react';
import { supabase } from './services/supabase';

const App: React.FC = () => {
  // PERSISTENCE: Session, User and Active Tab
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('mcl_isAuthenticated') === 'true';
  });
  
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('mcl_currentUser');
    try {
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [activeTab, setActiveTab] = useState<string>(() => {
    return localStorage.getItem('mcl_activeTab') || 'dashboard';
  });

  const [dbStatus, setDbStatus] = useState<'CONNECTED' | 'DEMO' | 'ERROR'>('DEMO');
  
  // Data States
  const [users, setUsers] = useState<User[]>(MOCK_USERS);
  const [userPasswords, setUserPasswords] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem('mcl_passwords');
    return saved ? JSON.parse(saved) : { 'admin_fixed': '10121986' };
  });

  const [tickets, setTickets] = useState<Ticket[]>(MOCK_TICKETS);
  const [checks, setChecks] = useState<PeriodicCheck[]>(MOCK_CHECKS);
  const [maintenanceEvents, setMaintenanceEvents] = useState<MaintenanceEvent[]>(MOCK_MAINTENANCE);
  const [planningEvents, setPlanningEvents] = useState<PlanningEvent[]>(MOCK_PLANNING_EVENTS);
  const [financialDocs, setFinancialDocs] = useState<DocumentFile[]>(MOCK_DOCS.filter(d => d.type === 'QUOTE' || d.type === 'INVOICE'));
  const [technicalDocs, setTechnicalDocs] = useState<DocumentFile[]>(MOCK_DOCS.filter(d => d.type !== 'QUOTE' && d.type !== 'INVOICE'));
  
  const [trashTickets, setTrashTickets] = useState<Ticket[]>([]);
  const [trashChecks, setTrashChecks] = useState<PeriodicCheck[]>([]);
  const [trashMaintenance, setTrashMaintenance] = useState<MaintenanceEvent[]>([]);
  const [trashPlanning, setTrashPlanning] = useState<PlanningEvent[]>([]);

  const [artisans, setArtisans] = useState<Artisan[]>(MOCK_ARTISANS);
  const [specifications, setSpecifications] = useState<Specification[]>(MOCK_SPECS);
  const [clubs, setClubs] = useState<Club[]>(MOCK_CLUBS);
  const [failureTypes, setFailureTypes] = useState<Record<TradeType, string[]>>(MOCK_FAILURE_TYPES);

  // Sync state to localStorage
  useEffect(() => {
    localStorage.setItem('mcl_isAuthenticated', isAuthenticated.toString());
    localStorage.setItem('mcl_activeTab', activeTab);
    if (currentUser) {
      localStorage.setItem('mcl_currentUser', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('mcl_currentUser');
    }
  }, [isAuthenticated, currentUser, activeTab]);

  useEffect(() => {
    localStorage.setItem('mcl_passwords', JSON.stringify(userPasswords));
  }, [userPasswords]);

  const fetchData = async () => {
    if (!supabase) return;
    try {
      const results = await Promise.all([
        supabase.from('clubs').select('*'),
        supabase.from('tickets').select('*'),
        supabase.from('checks').select('*'),
        supabase.from('maintenance').select('*'),
        supabase.from('planning').select('*'),
        supabase.from('financial_documents').select('*'),
        supabase.from('technical_documents').select('*'),
        supabase.from('artisans').select('*'),
        supabase.from('trash_tickets').select('*'),
        supabase.from('trash_checks').select('*'),
        supabase.from('trash_maintenance').select('*'),
        supabase.from('trash_planning').select('*'),
        supabase.from('users').select('*')
      ]);

      setDbStatus('CONNECTED');
      if (results[0].data) setClubs(results[0].data);
      if (results[1].data) setTickets(results[1].data);
      if (results[2].data) setChecks(results[2].data);
      if (results[3].data) setMaintenanceEvents(results[3].data);
      if (results[4].data) setPlanningEvents(results[4].data);
      if (results[5].data) setFinancialDocs(results[5].data);
      if (results[6].data) setTechnicalDocs(results[6].data);
      if (results[7].data) setArtisans(results[7].data);
      if (results[12].data) setUsers(results[12].data);
      
      if (results[8].data) setTrashTickets(results[8].data.map(d => d.content));
      if (results[9].data) setTrashChecks(results[9].data.map(d => d.content));
      if (results[10].data) setTrashMaintenance(results[10].data.map(d => d.content));
      if (results[11].data) setTrashPlanning(results[11].data.map(d => d.content));

    } catch (e: any) {
      console.error("Erreur sync Supabase:", e);
      setDbStatus('ERROR');
    }
  };

  useEffect(() => {
    fetchData();
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

  const handleLogin = async (email: string, password: string): Promise<boolean> => {
    const foundUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (foundUser) {
      const storedPass = userPasswords[foundUser.id] || "123456";
      if (storedPass === password) { 
        setCurrentUser(foundUser); 
        setIsAuthenticated(true);
        // On ne change pas l'onglet ici pour permettre le retour sur l'onglet précédent via localStorage
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

  const moveToTrash = async (item: any, sourceTable: string, trashTable: string) => {
    const trashEntry = { id: item.id, content: item };
    await syncOperation(trashTable, 'insert', trashEntry);
    await syncOperation(sourceTable, 'delete', null, item.id);
  };

  const handleTicketCreate = (t: Partial<Ticket>) => {
    const newTicket = { ...t, id: `t_${Date.now()}`, createdAt: new Date().toISOString() } as Ticket;
    setTickets(prev => [newTicket, ...prev]);
    syncOperation('tickets', 'insert', newTicket);
  };

  const renderContent = () => {
    if (!currentUser) return null;
    const commonProps = { currentUser, clubs, users };

    // Debug cases mapping to Layout.tsx IDs
    switch (activeTab) {
      case 'dashboard': 
        return <Dashboard {...commonProps} tickets={tickets} checks={checks} maintenanceEvents={maintenanceEvents} />;
      
      case 'planning': 
        return <GeneralPlanning events={planningEvents} currentUser={currentUser} onAddEvent={(e) => syncOperation('planning', 'insert', e)} onEditEvent={(e) => syncOperation('planning', 'update', e)} onDeleteEvent={(id) => syncOperation('trash_planning', 'insert', {id, content: planningEvents.find(p=>p.id===id)})} />;
      
      case 'tickets': 
        return <TicketManager {...commonProps} tickets={tickets} failureTypes={failureTypes} onCreateTicket={handleTicketCreate} onEditTicket={(t) => syncOperation('tickets', 'update', t)} onDeleteTicket={(id) => { const item = tickets.find(t=>t.id===id); if(item) { setTickets(prev=>prev.filter(x=>x.id!==id)); setTrashTickets(p=>[...p, item]); moveToTrash(item, 'tickets', 'trash_tickets'); }}} onUpdateStatus={(id, status) => syncOperation('tickets', 'update', { status }, id)} />;
      
      case 'checks': 
        return <CheckManager checks={checks} clubs={clubs} user={currentUser} onUpdateCheck={(id, items, status) => syncOperation('checks', 'update', { checklistItems: items, status }, id)} onCreateCheck={(c) => syncOperation('checks', 'insert', c)} onEditCheck={(c) => syncOperation('checks', 'update', c)} onDeleteCheck={(id) => { const item = checks.find(c=>c.id===id); if(item) { setChecks(prev=>prev.filter(x=>x.id!==id)); setTrashChecks(p=>[...p, item]); moveToTrash(item, 'checks', 'trash_checks'); }}} />;
      
      case 'maintenance': 
        return <MaintenanceSchedule {...commonProps} tickets={tickets} checks={checks} maintenanceEvents={maintenanceEvents} onAddEvent={(m) => syncOperation('maintenance', 'insert', m)} onEditEvent={(m) => syncOperation('maintenance', 'update', m)} onDeleteEvent={(id) => { const item = maintenanceEvents.find(m=>m.id===id); if(item) { setMaintenanceEvents(prev=>prev.filter(x=>x.id!==id)); setTrashMaintenance(p=>[...p, item]); moveToTrash(item, 'maintenance', 'trash_maintenance'); }}} />;
      
      case 'specs': 
        return <SpecificationsManager specifications={specifications} currentUser={currentUser} onAddSpecification={(s) => syncOperation('specifications', 'insert', s)} onEditSpecification={(s) => syncOperation('specifications', 'update', s)} onDeleteSpecification={(id) => syncOperation('specifications', 'delete', null, id)} />;
      
      case 'contact': 
        return <ContactBook artisans={artisans} currentUser={currentUser} onAddArtisan={(a) => syncOperation('artisans', 'insert', a)} onEditArtisan={(a) => syncOperation('artisans', 'update', a)} onDeleteArtisan={(id) => syncOperation('artisans', 'delete', null, id)} />;
      
      case 'financial': 
        return <FinancialManager documents={financialDocs} clubs={clubs} currentUser={currentUser} onAddDocument={(d) => { const n = {...d, id:`d_${Date.now()}`}; setFinancialDocs(p=>[...p, n as DocumentFile]); syncOperation('financial_documents', 'insert', n); }} onDeleteDocument={(id) => { setFinancialDocs(p=>p.filter(x=>x.id!==id)); syncOperation('financial_documents', 'delete', null, id); }} />;
      
      case 'documents': 
        return <DocumentManager documents={technicalDocs} clubs={clubs} currentUser={currentUser} onAddDocument={(d) => { const n = {...d, id:`d_${Date.now()}`}; setTechnicalDocs(p=>[...p, n as DocumentFile]); syncOperation('technical_documents', 'insert', n); }} onDeleteDocument={(id) => { setTechnicalDocs(p=>p.filter(x=>x.id!==id)); syncOperation('technical_documents', 'delete', null, id); }} />;
      
      case 'users': 
        return <UserManager users={users} clubs={clubs} userPasswords={userPasswords} onAddUser={(u, p) => { const n = {...u, id:`u_${Date.now()}`}; setUsers(prev=>[...prev, n as User]); if(p) setUserPasswords(prev=>({...prev, [n.id as string]: p})); syncOperation('users', 'insert', n); }} onEditUser={(u, p) => { setUsers(prev=>prev.map(x=>x.id===u.id?u:x)); if(p) setUserPasswords(prev=>({...prev, [u.id]: p})); syncOperation('users', 'update', u); }} onDeleteUser={(id) => { setUsers(prev=>prev.filter(x=>x.id!==id)); syncOperation('users', 'delete', null, id); }} />;
      
      case 'recycle_bin': 
        return <RecycleBin deletedTickets={trashTickets} deletedChecks={trashChecks} deletedMaintenance={trashMaintenance} deletedPlanning={trashPlanning} currentUser={currentUser} onRestoreTicket={()=>{}} onRestoreCheck={()=>{}} onRestoreMaintenance={()=>{}} onRestorePlanning={()=>{}} onPermanentDeleteTicket={(id) => syncOperation('trash_tickets', 'delete', null, id)} onPermanentDeleteCheck={(id) => syncOperation('trash_checks', 'delete', null, id)} onPermanentDeleteMaintenance={(id) => syncOperation('trash_maintenance', 'delete', null, id)} onPermanentDeletePlanning={(id) => syncOperation('trash_planning', 'delete', null, id)} />;
      
      case 'settings': 
        return <SettingsManager clubs={clubs} failureTypes={failureTypes} onAddClub={(c) => syncOperation('clubs', 'insert', c)} onDeleteClub={(id) => syncOperation('clubs', 'delete', null, id)} onUpdateClubSpaces={(id, spaces) => syncOperation('clubs', 'update', { spaces }, id)} onUpdateFailureTypes={() => {}} />;
      
      default: 
        return <Dashboard {...commonProps} tickets={tickets} />;
    }
  };

  if (isAuthenticated && !currentUser) return <div className="min-h-screen bg-brand-dark flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-brand-yellow"></div></div>;

  if (!isAuthenticated || !currentUser) return <Login onLogin={handleLogin} />;

  return (
    <Layout user={currentUser} onLogout={handleLogout} activeTab={activeTab} onTabChange={setActiveTab}>
      <div className={`mb-6 p-4 rounded-2xl border flex flex-col md:flex-row items-center justify-between gap-4 shadow-lg backdrop-blur-md ${dbStatus === 'CONNECTED' ? 'bg-green-500/10 border-green-500/30' : 'bg-brand-yellow/10 border-brand-yellow/30'}`}>
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-full ${dbStatus === 'CONNECTED' ? 'bg-green-500/20 text-green-400' : 'bg-brand-yellow/20 text-brand-yellow'}`}><ShieldCheck size={24} /></div>
          <div>
            <h3 className="text-sm font-black uppercase tracking-widest text-white">{dbStatus === 'CONNECTED' ? 'Système Synchronisé' : 'Mode Démo / Hors-ligne'}</h3>
            <p className="text-xs text-gray-400 font-medium">Navigation persistante ({activeTab}) active.</p>
          </div>
        </div>
      </div>
      {renderContent()}
    </Layout>
  );
};

export default App;
