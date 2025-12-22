
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
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dbStatus, setDbStatus] = useState<'CONNECTED' | 'DEMO' | 'ERROR'>('DEMO');
  
  const [users, setUsers] = useState<User[]>(MOCK_USERS);
  const [userPasswords, setUserPasswords] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem('mcl_passwords');
    return saved ? JSON.parse(saved) : { 'admin_fixed': '10121986' };
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
      if (results[0].data) setClubs(results[0].data);
      if (results[1].data) setTickets(results[1].data);
      if (results[2].data) setChecks(results[2].data);
      if (results[3].data) setMaintenanceEvents(results[3].data);
      if (results[4].data) setPlanningEvents(results[4].data);
      if (results[5].data) setDocs(results[5].data);
      if (results[6].data) setSpecifications(results[6].data);
      if (results[7].data) setArtisans(results[7].data);
      if (results[8].data) setUsers(results[8].data);
    } catch (e: any) {
      console.error("Erreur sync:", e);
      setDbStatus('ERROR');
    }
  };

  useEffect(() => {
    if (supabase) fetchData();
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

  // --- HANDLERS (CRUD) ---
  const handleTicketCreate = (t: Partial<Ticket>) => {
    const newTicket = { ...t, id: `t_${Date.now()}`, createdAt: new Date().toISOString(), deleted: false } as Ticket;
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

  const handleArtisanAdd = (a: Partial<Artisan>) => {
    const newArtisan = { ...a, id: `a_${Date.now()}` } as Artisan;
    setArtisans(prev => [...prev, newArtisan]);
    syncOperation('artisans', 'insert', newArtisan);
  };

  const handleArtisanEdit = (a: Artisan) => {
    setArtisans(prev => prev.map(item => item.id === a.id ? a : item));
    syncOperation('artisans', 'update', a);
  };

  const handleArtisanDelete = (id: string) => {
    setArtisans(prev => prev.filter(a => a.id !== id));
    syncOperation('artisans', 'delete', null, id);
  };

  const handleDocumentAdd = (d: Partial<DocumentFile>) => {
    const newDoc = { ...d, id: `d_${Date.now()}` } as DocumentFile;
    setDocs(prev => [...prev, newDoc]);
    syncOperation('documents', 'insert', newDoc);
  };

  const handleDocumentDelete = (id: string) => {
    setDocs(prev => prev.filter(d => d.id !== id));
    syncOperation('documents', 'delete', null, id);
  };

  const handleSpecAdd = (s: Partial<Specification>) => {
    const newSpec = { ...s, id: `s_${Date.now()}` } as Specification;
    setSpecifications(prev => [...prev, newSpec]);
    syncOperation('specifications', 'insert', newSpec);
  };

  const handleSpecEdit = (s: Specification) => {
    setSpecifications(prev => prev.map(item => item.id === s.id ? s : item));
    syncOperation('specifications', 'update', s);
  };

  const handleSpecDelete = (id: string) => {
    setSpecifications(prev => prev.filter(s => s.id !== id));
    syncOperation('specifications', 'delete', null, id);
  };

  const handleLogin = async (email: string, password: string): Promise<boolean> => {
    const foundUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (foundUser) {
      const storedPass = userPasswords[foundUser.id] || "123456";
      if (storedPass === password) { setCurrentUser(foundUser); setIsAuthenticated(true); return true; }
    }
    return false;
  };

  const renderContent = () => {
    if (!currentUser) return null;
    const commonProps = { currentUser, tickets, checks, clubs, users };

    switch (activeTab) {
      case 'dashboard': return <Dashboard {...commonProps} maintenanceEvents={maintenanceEvents} />;
      case 'tickets': return <TicketManager {...commonProps} failureTypes={failureTypes} onCreateTicket={handleTicketCreate} onEditTicket={handleTicketEdit} onDeleteTicket={handleTicketDelete} onUpdateStatus={(id, status) => syncOperation('tickets', 'update', { status }, id)} />;
      case 'specs': return <SpecificationsManager specifications={specifications} currentUser={currentUser} onAddSpecification={handleSpecAdd} onEditSpecification={handleSpecEdit} onDeleteSpecification={handleSpecDelete} />;
      case 'contact': return <ContactBook artisans={artisans} currentUser={currentUser} onAddArtisan={handleArtisanAdd} onEditArtisan={handleArtisanEdit} onDeleteArtisan={handleArtisanDelete} />;
      case 'financial': return <FinancialManager documents={docs} clubs={clubs} currentUser={currentUser} onAddDocument={handleDocumentAdd} onDeleteDocument={handleDocumentDelete} />;
      case 'documents': return <DocumentManager documents={docs} clubs={clubs} currentUser={currentUser} onAddDocument={handleDocumentAdd} onDeleteDocument={handleDocumentDelete} />;
      case 'settings': return <SettingsManager clubs={clubs} failureTypes={failureTypes} onAddClub={(c) => syncOperation('clubs', 'insert', c)} onDeleteClub={(id) => syncOperation('clubs', 'delete', null, id)} onUpdateClubSpaces={(id, spaces) => syncOperation('clubs', 'update', { spaces }, id)} onUpdateFailureTypes={() => {}} />;
      default: return <Dashboard {...commonProps} maintenanceEvents={maintenanceEvents} />;
    }
  };

  if (!isAuthenticated || !currentUser) return <Login onLogin={handleLogin} />;

  return (
    <Layout user={currentUser} onLogout={() => setIsAuthenticated(false)} activeTab={activeTab} onTabChange={setActiveTab}>
      <div className={`mb-6 p-4 rounded-2xl border flex flex-col md:flex-row items-center justify-between gap-4 shadow-lg backdrop-blur-md animate-fade-in ${dbStatus === 'CONNECTED' ? 'bg-green-500/10 border-green-500/30' : 'bg-brand-yellow/10 border-brand-yellow/30'}`}>
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-full ${dbStatus === 'CONNECTED' ? 'bg-green-500/20 text-green-400' : 'bg-brand-yellow/20 text-brand-yellow'}`}><ShieldCheck size={24} /></div>
          <div>
            <h3 className="text-sm font-black uppercase tracking-widest text-white">{dbStatus === 'CONNECTED' ? 'Supabase Connecté' : 'Mode Démonstration'}</h3>
            <p className="text-xs text-gray-400 font-medium">Gestion du matériel et des documents active.</p>
          </div>
        </div>
      </div>
      {renderContent()}
    </Layout>
  );
};

export default App;
