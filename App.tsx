
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
import { MOCK_CLUBS, MOCK_TICKETS, MOCK_CHECKS, MOCK_DOCS, MOCK_USERS, MOCK_MAINTENANCE, MOCK_FAILURE_TYPES, MOCK_ARTISANS, MOCK_SPECS } from './constants';
import { Ticket, TicketStatus, PeriodicCheck, CheckStatus, UserRole, MaintenanceEvent, Club, TradeType, User, Artisan, DocumentFile, Specification, PlanningEvent, AppNotification } from './types';
import { ShieldCheck, CloudOff, CheckCircle2 } from 'lucide-react';
import { supabase } from './services/supabase';
import { notificationService } from './services/notificationService';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => localStorage.getItem('mcl_isAuthenticated') === 'true');
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('mcl_currentUser');
    try { return savedUser ? JSON.parse(savedUser) : null; } catch { return null; }
  });
  const [activeTab, setActiveTab] = useState<string>(() => localStorage.getItem('mcl_activeTab') || 'dashboard');
  const [dbStatus, setDbStatus] = useState<'CONNECTED' | 'DEMO' | 'ERROR'>('DEMO');
  
  // App States
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
  const [failureTypes] = useState<Record<TradeType, string[]>>(MOCK_FAILURE_TYPES);
  const [userPasswords] = useState<Record<string, string>>({ 'admin_fixed': '10121986' });
  
  // Notifications State
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [toast, setToast] = useState<{ message: string; visible: boolean }>({ message: '', visible: false });

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
      const { data: specsData } = await supabase.from('specifications').select('*');

      setDbStatus('CONNECTED');
      if (clubsData) setClubs(clubsData);
      if (ticketsData) setTickets(ticketsData.map((t: any) => ({...t, deleted: t.deleted || false})));
      if (checksData) setChecks(checksData);
      if (maintData) setMaintenanceEvents(maintData);
      if (planningData) setPlanningEvents(planningData);
      if (finData) setFinancialDocs(finData);
      if (techData) setTechnicalDocs(techData);
      if (artData) setArtisans(artData);
      if (usersData) setUsers(usersData);
      if (specsData) setSpecifications(specsData);
    } catch (e: any) {
      console.error("Supabase Fetch Error:", e);
      setDbStatus('ERROR');
    }
  };

  useEffect(() => { fetchData(); }, []);

  const syncOperation = async (table: string, method: 'insert' | 'update' | 'delete', data: any, id?: string) => {
    if (!supabase) return true;
    try {
      if (method === 'insert') await supabase.from(table).insert([data]);
      if (method === 'update') await supabase.from(table).update(data).eq('id', id || data.id);
      if (method === 'delete') await supabase.from(table).delete().eq('id', id);
      return true;
    } catch (e) {
      console.error(`Supabase Sync Error (${table}):`, e);
      return false;
    }
  };

  const showToast = (message: string) => {
    setToast({ message, visible: true });
    setTimeout(() => setToast({ message: '', visible: false }), 4000);
  };

  const handleCreateTicket = async (ticketData: Partial<Ticket>) => {
    const newTicket = { 
      ...ticketData, 
      id: `t_${Date.now()}`, 
      createdAt: new Date().toISOString(),
      deleted: false 
    } as Ticket;

    if (await syncOperation('tickets', 'insert', newTicket)) {
      setTickets(prev => [newTicket, ...prev]);
      
      // 1. Notification Interne
      const newNotif: AppNotification = {
        id: `n_${Date.now()}`,
        title: `Nouveau Ticket : ${newTicket.trade}`,
        message: `${newTicket.space} - Urgence ${newTicket.urgency}`,
        type: 'TICKET',
        date: new Date().toISOString(),
        read: false,
        linkTo: newTicket.id
      };
      setNotifications(prev => [newNotif, ...prev]);

      // 2. Envoi E-mail Automatique via Gemini
      const club = clubs.find(c => c.id === newTicket.clubId);
      showToast("Génération de la notification e-mail...");
      
      const emailResult = await notificationService.sendTicketEmail(newTicket, club, currentUser!);
      if (emailResult) {
        showToast("E-mail de notification envoyé aux techniciens !");
      }
    }
  };

  const handleMarkNotifRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const handleMarkAllNotifsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleLogin = async (email: string, password: string): Promise<boolean> => {
    const foundUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (foundUser && (userPasswords[foundUser.id] || "123456") === password) {
      setCurrentUser(foundUser);
      setIsAuthenticated(true);
      return true;
    }
    return false;
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    setActiveTab('dashboard');
    localStorage.clear();
  };

  const renderContent = () => {
    if (!currentUser) return null;
    const commonProps = { currentUser, clubs, users };

    switch (activeTab) {
      case 'dashboard': return <Dashboard {...commonProps} tickets={tickets} checks={checks} maintenanceEvents={maintenanceEvents} />;
      case 'tickets': return <TicketManager {...commonProps} tickets={tickets.filter(t => !t.deleted)} failureTypes={failureTypes} onCreateTicket={handleCreateTicket} onEditTicket={async (t) => { if(await syncOperation('tickets', 'update', t)) setTickets(p => p.map(x => x.id === t.id ? t : x)); }} onDeleteTicket={async (id) => { if(await syncOperation('tickets', 'update', { deleted: true }, id)) setTickets(p => p.map(x => x.id === id ? { ...x, deleted: true } : x)); }} onUpdateStatus={async (id, status) => { if(await syncOperation('tickets', 'update', { status }, id)) setTickets(p => p.map(t => t.id === id ? { ...t, status } : t)); }} />;
      case 'checks': return <CheckManager checks={checks.filter(c => !c.deleted)} clubs={clubs} user={currentUser} onUpdateCheck={async (id, items, status) => { if(await syncOperation('checks','update',{checklistItems:items, status},id)) setChecks(p=>p.map(x=>x.id===id?{...x, checklistItems:items, status}:x)); }} onCreateCheck={async (c) => { const n = {...c, id:`c_${Date.now()}`}; if(await syncOperation('checks','insert',n)) setChecks(p=>[...p, n as PeriodicCheck]); }} onEditCheck={async (c) => { if(await syncOperation('checks','update',c)) setChecks(p=>p.map(x=>x.id===c.id?c:x)); }} onDeleteCheck={async (id) => { if(await syncOperation('checks','update',{deleted:true},id)) setChecks(p=>p.map(x=>x.id===id?{...x, deleted:true}:x)); }} />;
      case 'maintenance': return <MaintenanceSchedule {...commonProps} tickets={tickets} checks={checks} maintenanceEvents={maintenanceEvents.filter(m => !m.deleted)} onAddEvent={async (m) => { const n = {...m, id:`m_${Date.now()}`}; if(await syncOperation('maintenance','insert',n)) setMaintenanceEvents(p=>[...p, n as MaintenanceEvent]); }} onEditEvent={async (m) => { if(await syncOperation('maintenance','update',m)) setMaintenanceEvents(p=>p.map(x=>x.id===m.id?m:x)); }} onDeleteEvent={async (id) => { if(await syncOperation('maintenance','update',{deleted:true},id)) setMaintenanceEvents(p=>p.map(x=>x.id===id?{...x, deleted:true}:x)); }} />;
      case 'specs': return <SpecificationsManager specifications={specifications} currentUser={currentUser} onAddSpecification={async (s) => { const n = {...s, id:`s_${Date.now()}`}; if(await syncOperation('specifications','insert',n)) setSpecifications(p=>[...p, n as Specification]); }} onEditSpecification={async (s) => { if(await syncOperation('specifications','update',s)) setSpecifications(p=>p.map(x=>x.id===s.id?s:x)); }} onDeleteSpecification={async (id) => { if(await syncOperation('specifications','delete',null,id)) setSpecifications(p=>p.filter(x=>x.id!==id)); }} />;
      case 'contact': return <ContactBook artisans={artisans} currentUser={currentUser} onAddArtisan={async (a) => { const n = {...a, id:`a_${Date.now()}`}; if(await syncOperation('artisans','insert',n)) setArtisans(p=>[...p, n as Artisan]); }} onEditArtisan={async (a) => { if(await syncOperation('artisans','update',a)) setArtisans(p=>p.map(x=>x.id===a.id?a:x)); }} onDeleteArtisan={async (id) => { if(await syncOperation('artisans','delete',null,id)) setArtisans(p=>p.filter(x=>x.id!==id)); }} />;
      case 'financial': return <FinancialManager documents={financialDocs} clubs={clubs} currentUser={currentUser} onAddDocument={async (d) => { const n = {...d, id:`d_${Date.now()}`}; if(await syncOperation('financial_documents','insert',n)) setFinancialDocs(p=>[...p, n as DocumentFile]); }} onDeleteDocument={async (id) => { if(await syncOperation('financial_documents','delete',null,id)) setFinancialDocs(p=>p.filter(x=>x.id!==id)); }} />;
      case 'documents': return <DocumentManager documents={technicalDocs} clubs={clubs} currentUser={currentUser} onAddDocument={async (d) => { const n = {...d, id:`d_${Date.now()}`}; if(await syncOperation('technical_documents','insert',n)) setTechnicalDocs(p=>[...p, n as DocumentFile]); }} onDeleteDocument={async (id) => { if(await syncOperation('technical_documents','delete',null,id)) setTechnicalDocs(p=>p.filter(x=>x.id!==id)); }} />;
      case 'users': return <UserManager users={users} clubs={clubs} userPasswords={userPasswords} onAddUser={async (u, p) => { const n = {...u, id:`u_${Date.now()}`}; if(await syncOperation('users','insert',n)) { setUsers(prev=>[...prev, n as User]); } }} onEditUser={async (u, p) => { if(await syncOperation('users','update',u)) setUsers(prev=>prev.map(x=>x.id===u.id?u:x)); }} onDeleteUser={async (id) => { if(await syncOperation('users','delete',null,id)) setUsers(prev=>prev.filter(x=>x.id!==id)); }} />;
      case 'recycle_bin': return <RecycleBin currentUser={currentUser} deletedTickets={tickets.filter(t => t.deleted)} deletedChecks={checks.filter(c => c.deleted)} deletedMaintenance={maintenanceEvents.filter(m => m.deleted)} deletedPlanning={planningEvents.filter(p => p.deleted)} onRestoreTicket={async (id) => { if(await syncOperation('tickets', 'update', { deleted: false }, id)) setTickets(p => p.map(x => x.id === id ? { ...x, deleted: false } : x)); }} onRestoreCheck={async (id) => { if(await syncOperation('checks', 'update', { deleted: false }, id)) setChecks(p => p.map(x => x.id === id ? { ...x, deleted: false } : x)); }} onRestoreMaintenance={async (id) => { if(await syncOperation('maintenance', 'update', { deleted: false }, id)) setMaintenanceEvents(p => p.map(x => x.id === id ? { ...x, deleted: false } : x)); }} onRestorePlanning={async (id) => { if(await syncOperation('planning', 'update', { deleted: false }, id)) setPlanningEvents(p => p.map(x => x.id === id ? { ...x, deleted: false } : x)); }} onPermanentDeleteTicket={async (id) => { if(await syncOperation('tickets', 'delete', null, id)) setTickets(p => p.filter(x => x.id !== id)); }} onPermanentDeleteCheck={async (id) => { if(await syncOperation('checks', 'delete', null, id)) setChecks(p => p.filter(x => x.id !== id)); }} onPermanentDeleteMaintenance={async (id) => { if(await syncOperation('maintenance', 'delete', null, id)) setMaintenanceEvents(p => p.filter(x => x.id !== id)); }} onPermanentDeletePlanning={async (id) => { if(await syncOperation('planning', 'delete', null, id)) setPlanningEvents(p => p.filter(x => x.id !== id)); }} />;
      case 'settings': return <SettingsManager clubs={clubs} failureTypes={failureTypes} onAddClub={async (c) => { if(await syncOperation('clubs','insert',c)) setClubs(p=>[...p, c]); }} onDeleteClub={async (id) => { if(await syncOperation('clubs','delete',null,id)) setClubs(p=>p.filter(x=>x.id!==id)); }} onUpdateClubSpaces={async (id, spaces) => { if(await syncOperation('clubs','update',{spaces},id)) setClubs(p=>p.map(x=>x.id===id?{...x, spaces}:x)); }} onUpdateFailureTypes={() => {}} />;
      default: return <Dashboard {...commonProps} tickets={tickets} />;
    }
  };

  if (!isAuthenticated || !currentUser) return <Login onLogin={handleLogin} />;

  return (
    <Layout 
      user={currentUser} 
      onLogout={handleLogout} 
      activeTab={activeTab} 
      onTabChange={setActiveTab}
      notifications={notifications}
      onMarkNotificationAsRead={handleMarkNotifRead}
      onMarkAllNotificationsAsRead={handleMarkAllNotifsRead}
    >
      {/* Toast de Notification E-mail */}
      {toast.visible && (
        <div className="fixed top-6 right-6 z-[100] animate-fade-in-up">
           <div className="bg-brand-darker border border-brand-yellow/50 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 backdrop-blur-md">
              <div className="bg-brand-yellow/20 p-2 rounded-full">
                <CheckCircle2 className="text-brand-yellow" size={20} />
              </div>
              <p className="font-black uppercase text-[10px] tracking-widest">{toast.message}</p>
           </div>
        </div>
      )}

      <div className={`mb-6 p-4 rounded-2xl border flex flex-col md:flex-row items-center justify-between gap-4 shadow-lg backdrop-blur-md transition-all ${dbStatus === 'CONNECTED' ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-full ${dbStatus === 'CONNECTED' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
            {dbStatus === 'CONNECTED' ? <ShieldCheck size={24} /> : <CloudOff size={24} />}
          </div>
          <div>
            <h3 className="text-sm font-black uppercase tracking-widest text-white">
               {dbStatus === 'CONNECTED' ? 'Stockage Cloud Connecté' : 'Mode Démo / Erreur'}
            </h3>
            <p className="text-xs text-gray-400 font-medium">
               {dbStatus === 'CONNECTED' ? 'Synchronisation Supabase active.' : 'Accès limité au stockage local temporaire.'}
            </p>
          </div>
        </div>
        {dbStatus !== 'CONNECTED' && (
           <button onClick={fetchData} className="px-4 py-2 bg-red-500/20 text-red-400 text-[10px] font-black uppercase border border-red-500/40 rounded-lg hover:bg-red-500/30 transition">Réinitialiser Sync</button>
        )}
      </div>
      {renderContent()}
    </Layout>
  );
};

export default App;
