
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
import { Database, Copy, AlertTriangle } from 'lucide-react';
import { supabase } from './services/supabase';

const SUPABASE_SCHEMA_SQL = `
-- Script de création des tables pour MCL Solutions
create extension if not exists "uuid-ossp";

create table if not exists public.clubs ( id text primary key, name text not null, address text, spaces text[] );
create table if not exists public.users ( id text primary key, name text, email text, role text, "clubIds" text[], avatar text, preferences jsonb );
create table if not exists public.tickets ( id text primary key default uuid_generate_v4()::text, "clubId" text, space text, trade text, description text, status text, urgency text, "createdAt" timestamp with time zone default now(), "assignedTo" text, "createdBy" text, images text[], "technicalReport" text, history jsonb, deleted boolean default false );
create table if not exists public.checks ( id text primary key default uuid_generate_v4()::text, "clubId" text, space text, trade text, title text, "frequencyMonths" numeric, "lastChecked" timestamp with time zone, "nextDueDate" timestamp with time zone, status text, "checklistItems" jsonb, "technicianSignature" text, history jsonb, deleted boolean default false );
create table if not exists public.maintenance ( id text primary key default uuid_generate_v4()::text, title text, date date, description text, "notifyOnDashboard" boolean, "clubId" text, checklist jsonb, signatures jsonb, deleted boolean default false );
create table if not exists public.planning ( id text primary key default uuid_generate_v4()::text, title text, date date, "startTime" text, type text, description text, location text, alert boolean, "createdBy" text, deleted boolean default false );
create table if not exists public.documents ( id text primary key default uuid_generate_v4()::text, name text, type text, url text, "clubId" text, date date );
create table if not exists public.specifications ( id text primary key default uuid_generate_v4()::text, category text, title text, brand text, "partType" text, "installationType" text, "imageUrl" text, "documentUrl" text, "documentName" text );
create table if not exists public.artisans ( id text primary key default uuid_generate_v4()::text, "companyName" text, "contactName" text, trade text, phone text, email text, address text, notes text );

-- RLS
alter table public.clubs enable row level security; create policy "Public" on public.clubs for all using (true);
alter table public.users enable row level security; create policy "Public" on public.users for all using (true);
alter table public.tickets enable row level security; create policy "Public" on public.tickets for all using (true);
alter table public.checks enable row level security; create policy "Public" on public.checks for all using (true);
alter table public.maintenance enable row level security; create policy "Public" on public.maintenance for all using (true);
alter table public.planning enable row level security; create policy "Public" on public.planning for all using (true);
alter table public.documents enable row level security; create policy "Public" on public.documents for all using (true);
alter table public.specifications enable row level security; create policy "Public" on public.specifications for all using (true);
alter table public.artisans enable row level security; create policy "Public" on public.artisans for all using (true);
`;

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
  const [failureTypes, setFailureTypes] = useState<Record<TradeType, string[]>>(MOCK_FAILURE_TYPES);
  const [setupRequired, setSetupRequired] = useState(false);

  // Synchronisation en temps réel avec Supabase
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

    const subscribe = (table: string, setState: React.Dispatch<React.SetStateAction<any[]>>, fallbackData: any[]) => {
      supabase.from(table).select('*').then(({ data, error }) => {
        if (!error && data) setState(data);
        else {
           if (error && error.code === '42P01') setSetupRequired(true);
           setState(fallbackData);
        }
      });
      
      const channel = supabase.channel(`public:${table}`).on('postgres_changes', { event: '*', schema: 'public', table: table }, () => {
           supabase.from(table).select('*').then(({ data }) => { if (data) setState(data); });
      }).subscribe();
      
      return () => { supabase.removeChannel(channel); };
    };

    const unsubClubs = subscribe('clubs', setClubs, MOCK_CLUBS);
    const unsubTickets = subscribe('tickets', setTickets, MOCK_TICKETS);
    const unsubChecks = subscribe('checks', setChecks, MOCK_CHECKS);
    const unsubMaintenance = subscribe('maintenance', setMaintenanceEvents, MOCK_MAINTENANCE);
    const unsubPlanning = subscribe('planning', setPlanningEvents, MOCK_PLANNING_EVENTS);
    const unsubDocs = subscribe('documents', setDocs, MOCK_DOCS);
    const unsubSpecs = subscribe('specifications', setSpecifications, MOCK_SPECS);
    const unsubArtisans = subscribe('artisans', setArtisans, MOCK_ARTISANS);
    const unsubUsers = subscribe('users', setUsers, MOCK_USERS);

    return () => { 
        unsubClubs(); unsubTickets(); unsubChecks(); unsubMaintenance(); 
        unsubPlanning(); unsubDocs(); unsubSpecs(); unsubArtisans(); unsubUsers(); 
    };
  }, []);

  const seedDatabase = async () => {
    if (!supabase) return;
    if (window.confirm("Charger les données réelles de démonstration dans votre base Supabase ?")) {
        try {
            await supabase.from('clubs').insert(MOCK_CLUBS);
            await supabase.from('users').insert(MOCK_USERS); 
            await supabase.from('tickets').insert(MOCK_TICKETS.map(({id, ...rest}) => ({...rest})));
            await supabase.from('checks').insert(MOCK_CHECKS.map(({id, ...rest}) => rest));
            await supabase.from('maintenance').insert(MOCK_MAINTENANCE.map(({id, ...rest}) => rest));
            await supabase.from('planning').insert(MOCK_PLANNING_EVENTS.map(({id, ...rest}) => rest));
            await supabase.from('specifications').insert(MOCK_SPECS.map(({id, ...rest}) => rest));
            await supabase.from('artisans').insert(MOCK_ARTISANS.map(({id, ...rest}) => rest));
            await supabase.from('documents').insert(MOCK_DOCS.map(({id, ...rest}) => rest));
            alert("Base de données initialisée !");
            window.location.reload();
        } catch (e: any) { alert(`Erreur lors de l'initialisation : ${e.message}`); }
    }
  };

  const copySchemaToClipboard = () => {
    navigator.clipboard.writeText(SUPABASE_SCHEMA_SQL);
    alert("Script SQL complet copié ! Allez dans le 'SQL Editor' de Supabase, collez et exécutez.");
  };

  useEffect(() => {
    const storedSession = localStorage.getItem('mcl_session_user');
    if (storedSession) { try { const user = JSON.parse(storedSession); setCurrentUser(user); setIsAuthenticated(true); } catch (e) { localStorage.removeItem('mcl_session_user'); } }
    const storedPasswords = localStorage.getItem('mcl_passwords'); if (storedPasswords) setUserPasswords(JSON.parse(storedPasswords));
  }, []);

  useEffect(() => localStorage.setItem('mcl_passwords', JSON.stringify(userPasswords)), [userPasswords]);

  const handleLogin = async (email: string, password: string): Promise<boolean> => {
    const userList = users.length > 0 ? users : MOCK_USERS;
    const foundUser = userList.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (foundUser) {
        const storedPass = userPasswords[foundUser.id] || (foundUser.id === 'admin_fixed' ? 'Marielis1338!' : '123456');
        if (storedPass === password) { setCurrentUser(foundUser); setIsAuthenticated(true); localStorage.setItem('mcl_session_user', JSON.stringify(foundUser)); return true; }
    }
    return false;
  };

  const handleLogout = () => { setIsAuthenticated(false); setCurrentUser(null); setActiveTab('dashboard'); localStorage.removeItem('mcl_session_user'); };

  // --- GESTION DES TICKETS ---
  const handleCreateTicket = async (newTicketData: Partial<Ticket>) => {
    if (!currentUser) return;
    const history = [{ date: new Date().toISOString(), user: currentUser.name, action: 'CREATION', details: 'Ticket créé' }];
    
    if (!supabase) {
        const demoTicket = { ...newTicketData, id: `demo_${Date.now()}`, createdAt: new Date().toISOString(), status: TicketStatus.OPEN, deleted: false, history } as Ticket;
        setTickets([demoTicket, ...tickets]);
        return;
    }
    try {
        await supabase.from('tickets').insert([{ 
            ...newTicketData, 
            createdAt: new Date().toISOString(), 
            images: newTicketData.images || [], 
            status: TicketStatus.OPEN, 
            deleted: false, 
            history 
        }]);
    } catch (e) { console.error(e); }
  };

  const handleEditTicket = async (updatedTicketData: Ticket) => {
    if (!currentUser) return;
    if (!supabase) {
        setTickets(tickets.map(t => t.id === updatedTicketData.id ? updatedTicketData : t));
        return;
    }
    try {
        const { id, ...data } = updatedTicketData;
        const newHistory = [...(data.history || []), { date: new Date().toISOString(), user: currentUser.name, action: 'MODIFICATION', details: 'Modification' }];
        await supabase.from('tickets').update({ ...data, history: newHistory }).eq('id', id);
    } catch (e) { console.error(e); }
  };

  const handleDeleteTicket = async (ticketId: string) => {
    if (!currentUser) return;
    const ticket = tickets.find(t => t.id === ticketId);
    if (!ticket) return;

    if (!supabase) {
        setTickets(tickets.map(t => t.id === ticketId ? { ...t, deleted: true, status: TicketStatus.CANCELLED } : t));
        return;
    }
    try {
        const newHistory = [...(ticket.history || []), { date: new Date().toISOString(), user: currentUser.name, action: 'DELETION', details: 'Mis à la corbeille' }];
        await supabase.from('tickets').update({ deleted: true, status: TicketStatus.CANCELLED, history: newHistory }).eq('id', ticketId);
    } catch (e) { console.error(e); }
  };

  const handleUpdateTicketStatus = async (id: string, status: TicketStatus) => {
    if (!currentUser) return;
    const ticket = tickets.find(t => t.id === id);
    if (!ticket) return;

    if (!supabase) {
        setTickets(tickets.map(t => t.id === id ? { ...t, status } : t));
        return;
    }
    try {
        const newHistory = [...(ticket.history || []), { date: new Date().toISOString(), user: currentUser.name, action: 'STATUS_CHANGE', details: `Statut: ${status}` }];
        await supabase.from('tickets').update({ status, history: newHistory }).eq('id', id);
    } catch (e) { console.error(e); }
  };

  const handleRestoreTicket = async (id: string) => {
    if (!currentUser) return;
    const ticket = tickets.find(t => t.id === id);
    if (!ticket) return;

    if (!supabase) {
        setTickets(tickets.map(t => t.id === id ? { ...t, deleted: false, status: TicketStatus.OPEN } : t));
        return;
    }
    try { 
        const newHistory = [...(ticket.history || []), { date: new Date().toISOString(), user: currentUser.name, action: 'RESTORATION', details: 'Restauré depuis la corbeille' }];
        await supabase.from('tickets').update({ deleted: false, status: TicketStatus.OPEN, history: newHistory }).eq('id', id); 
    } catch (e) { console.error(e); }
  };

  const handlePermanentDeleteTicket = async (id: string) => { 
    if (!supabase) { setTickets(tickets.filter(t => t.id !== id)); return; }
    try { await supabase.from('tickets').delete().eq('id', id); } catch (e) { console.error(e); } 
  };

  // --- GESTION DES VERIFICATIONS ---
  const handleCreateCheck = async (newCheckData: Partial<PeriodicCheck>) => { 
    if (!supabase) {
        const demo = { ...newCheckData, id: `demo_${Date.now()}`, status: CheckStatus.UPCOMING, deleted: false } as PeriodicCheck;
        setChecks([demo, ...checks]);
        return;
    }
    try { await supabase.from('checks').insert([{ ...newCheckData, status: CheckStatus.UPCOMING, checklistItems: newCheckData.checklistItems || [], deleted: false }]); } catch (e) { console.error(e); } 
  };

  const handleUpdateCheck = async (id: string, items: any[], status: CheckStatus) => { 
    if (!supabase) {
        setChecks(checks.map(c => c.id === id ? { ...c, checklistItems: items, status } : c));
        return;
    }
    try { await supabase.from('checks').update({ checklistItems: items, status }).eq('id', id); } catch (e) { console.error(e); } 
  };

  const handleDeleteCheck = async (id: string) => { 
    if (!supabase) { setChecks(checks.map(c => c.id === id ? { ...c, deleted: true } : c)); return; }
    try { await supabase.from('checks').update({ deleted: true }).eq('id', id); } catch (e) { console.error(e); } 
  };

  const handleRestoreCheck = async (id: string) => { 
    if (!supabase) { setChecks(checks.map(c => c.id === id ? { ...c, deleted: false } : c)); return; }
    try { await supabase.from('checks').update({ deleted: false }).eq('id', id); } catch (e) { console.error(e); } 
  };

  const handlePermanentDeleteCheck = async (id: string) => { 
    if (!supabase) { setChecks(checks.filter(c => c.id !== id)); return; }
    try { await supabase.from('checks').delete().eq('id', id); } catch (e) { console.error(e); } 
  };

  // --- GESTION DE LA MAINTENANCE ---
  const handleAddMaintenanceEvent = async (event: Partial<MaintenanceEvent>) => {
    if (!supabase) {
      const demo = { ...event, id: `demo_${Date.now()}`, deleted: false } as MaintenanceEvent;
      setMaintenanceEvents([demo, ...maintenanceEvents]);
      return;
    }
    try { await supabase.from('maintenance').insert([{ ...event, deleted: false }]); } catch (e) { console.error(e); }
  };

  const handleEditMaintenanceEvent = async (event: MaintenanceEvent) => {
    if (!supabase) {
      setMaintenanceEvents(maintenanceEvents.map(m => m.id === event.id ? event : m));
      return;
    }
    try {
      const { id, ...data } = event;
      await supabase.from('maintenance').update(data).eq('id', id);
    } catch (e) { console.error(e); }
  };

  const handleDeleteMaintenanceEvent = async (id: string) => {
    if (!supabase) {
      setMaintenanceEvents(maintenanceEvents.map(m => m.id === id ? { ...m, deleted: true } : m));
      return;
    }
    try { await supabase.from('maintenance').update({ deleted: true }).eq('id', id); } catch (e) { console.error(e); }
  };

  const handleRestoreMaintenance = async (id: string) => {
    if (!supabase) {
      setMaintenanceEvents(maintenanceEvents.map(m => m.id === id ? { ...m, deleted: false } : m));
      return;
    }
    try { await supabase.from('maintenance').update({ deleted: false }).eq('id', id); } catch (e) { console.error(e); }
  };

  const handlePermanentDeleteMaintenance = async (id: string) => {
    if (!supabase) {
      setMaintenanceEvents(maintenanceEvents.filter(m => m.id !== id));
      return;
    }
    try { await supabase.from('maintenance').delete().eq('id', id); } catch (e) { console.error(e); }
  };

  // --- GESTION DU PLANNING ---
  const handleAddPlanningEvent = async (event: Partial<PlanningEvent>) => { 
    if (!supabase) {
        const demo = { ...event, id: `demo_${Date.now()}`, deleted: false, createdBy: currentUser?.id } as PlanningEvent;
        setPlanningEvents([demo, ...planningEvents]);
        return;
    }
    try { await supabase.from('planning').insert([{ ...event, deleted: false, createdBy: currentUser?.id }]); } catch (e) { console.error(e); } 
  };

  const handleEditPlanningEvent = async (event: PlanningEvent) => { 
    if (!supabase) { setPlanningEvents(planningEvents.map(p => p.id === event.id ? event : p)); return; }
    try { const { id, ...data } = event; await supabase.from('planning').update(data).eq('id', id); } catch (e) { console.error(e); } 
  };

  const handleDeletePlanningEvent = async (id: string) => { 
    if (!supabase) { setPlanningEvents(planningEvents.map(p => p.id === id ? { ...p, deleted: true } : p)); return; }
    try { await supabase.from('planning').update({ deleted: true }).eq('id', id); } catch (e) { console.error(e); } 
  };

  const handleRestorePlanningEvent = async (id: string) => { 
    if (!supabase) { setPlanningEvents(planningEvents.map(p => p.id === id ? { ...p, deleted: false } : p)); return; }
    try { await supabase.from('planning').update({ deleted: false }).eq('id', id); } catch (e) { console.error(e); } 
  };

  const handlePermanentDeletePlanningEvent = async (id: string) => { 
    if (!supabase) { setPlanningEvents(planningEvents.filter(p => p.id !== id)); return; }
    try { await supabase.from('planning').delete().eq('id', id); } catch (e) { console.error(e); } 
  };

  // --- GESTION DES DOCUMENTS ---
  const handleAddDocument = async (docData: Partial<DocumentFile>) => { 
    if (!supabase) { const demo = { ...docData, id: `demo_${Date.now()}` } as DocumentFile; setDocs([demo, ...docs]); return; }
    try { await supabase.from('documents').insert([{ ...docData }]); } catch (e) { console.error(e); } 
  };

  const handleDeleteDocument = async (id: string) => { 
    if (!supabase) { setDocs(docs.filter(d => d.id !== id)); return; }
    try { await supabase.from('documents').delete().eq('id', id); } catch (e) { console.error(e); } 
  };

  // --- AUTRES GESTIONS (Artisans, Specs, Users) ---
  const handleAddArtisan = async (artisan: Partial<Artisan>) => { 
    if (!supabase) { const demo = { ...artisan, id: `demo_${Date.now()}` } as Artisan; setArtisans([demo, ...artisans]); return; }
    await supabase.from('artisans').insert([artisan]); 
  };

  const handleAddSpecification = async (spec: Partial<Specification>) => { 
    if (!supabase) { const demo = { ...spec, id: `demo_${Date.now()}` } as Specification; setSpecifications([demo, ...specifications]); return; }
    await supabase.from('specifications').insert([spec]); 
  };

  const handleAddUser = async (user: Partial<User>, password?: string) => { 
    if (!supabase) {
        const demo = { ...user, id: `demo_${Date.now()}` } as User;
        setUsers([...users, demo]);
        if (password) setUserPasswords(prev => ({ ...prev, [demo.id]: password }));
        return;
    }
    try { 
        const { data } = await supabase.from('users').insert([{ 
            ...user, 
            id: user.id || `u_${Date.now()}`,
            avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}&background=random`, 
            clubIds: user.clubIds || [], 
            preferences: user.preferences || { tickets: true, checks: true, maintenance: true, browserPush: false } 
        }]).select(); 
        if (data && data.length > 0) { 
            const userId = data[0].id; 
            if (password) setUserPasswords(prev => ({ ...prev, [userId]: password })); 
        } 
    } catch (e) { console.error(e); } 
  };

  const handleMarkNotificationAsRead = (id: string) => setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
  const handleMarkAllNotificationsAsRead = () => setNotifications(notifications.map(n => ({ ...n, read: true })));

  const renderContent = () => {
    if (!currentUser) return null;
    const activeTickets = tickets.filter(t => !t.deleted);
    const activeChecks = checks.filter(c => !c.deleted);
    const activeMaintenance = maintenanceEvents.filter(m => !m.deleted);
    const activePlanning = planningEvents.filter(p => !p.deleted);

    switch (activeTab) {
      case 'dashboard': return <Dashboard tickets={activeTickets} checks={activeChecks} clubs={clubs} maintenanceEvents={activeMaintenance} currentUser={currentUser} />;
      case 'tickets': return <TicketManager tickets={activeTickets} clubs={clubs} users={users} currentUser={currentUser} failureTypes={failureTypes} onCreateTicket={handleCreateTicket} onEditTicket={handleEditTicket} onDeleteTicket={handleDeleteTicket} onUpdateStatus={handleUpdateTicketStatus} />;
      case 'checks': return <CheckManager checks={activeChecks} clubs={clubs} user={currentUser} onUpdateCheck={handleUpdateCheck} onCreateCheck={handleCreateCheck} onEditCheck={(c) => {}} onDeleteCheck={handleDeleteCheck} />;
      case 'specs': return <SpecificationsManager specifications={specifications} currentUser={currentUser} onAddSpecification={handleAddSpecification} onDeleteSpecification={(id) => {}} onEditSpecification={(s) => {}} />;
      case 'planning': return <GeneralPlanning events={activePlanning} currentUser={currentUser} onAddEvent={handleAddPlanningEvent} onEditEvent={handleEditPlanningEvent} onDeleteEvent={handleDeletePlanningEvent} />;
      case 'documents': return <DocumentManager documents={docs.filter(d => d.type !== 'QUOTE' && d.type !== 'INVOICE')} clubs={clubs} currentUser={currentUser} onAddDocument={handleAddDocument} onDeleteDocument={handleDeleteDocument} />;
      case 'financial': return <FinancialManager documents={docs} clubs={clubs} currentUser={currentUser} onAddDocument={handleAddDocument} onDeleteDocument={handleDeleteDocument} />;
      case 'contact': return <ContactBook artisans={artisans} currentUser={currentUser} onAddArtisan={handleAddArtisan} onDeleteArtisan={(id) => {}} onEditArtisan={(a) => {}} />;
      case 'users': return <UserManager users={users} clubs={clubs} userPasswords={userPasswords} onAddUser={handleAddUser} onEditUser={(u, p) => {}} onDeleteUser={(id) => {}} />;
      case 'maintenance': return <MaintenanceSchedule tickets={activeTickets} checks={activeChecks} clubs={clubs} currentUser={currentUser} maintenanceEvents={activeMaintenance} onAddEvent={handleAddMaintenanceEvent} onEditEvent={handleEditMaintenanceEvent} onDeleteEvent={handleDeleteMaintenanceEvent} />;
      case 'recycle_bin': return <RecycleBin deletedTickets={tickets.filter(t => t.deleted)} deletedChecks={checks.filter(c => c.deleted)} deletedMaintenance={maintenanceEvents.filter(m => m.deleted)} deletedPlanning={planningEvents.filter(p => p.deleted)} currentUser={currentUser} onRestoreTicket={handleRestoreTicket} onRestoreCheck={handleRestoreCheck} onRestoreMaintenance={handleRestoreMaintenance} onRestorePlanning={handleRestorePlanningEvent} onPermanentDeleteTicket={handlePermanentDeleteTicket} onPermanentDeleteCheck={handlePermanentDeleteCheck} onPermanentDeleteMaintenance={handlePermanentDeleteMaintenance} onPermanentDeletePlanning={handlePermanentDeletePlanningEvent} />;
      default: return <Dashboard tickets={activeTickets} checks={activeChecks} clubs={clubs} currentUser={currentUser} />;
    }
  };

  if (!isAuthenticated || !currentUser) return <Login onLogin={handleLogin} />;

  return (
    <Layout user={currentUser} onLogout={handleLogout} activeTab={activeTab} onTabChange={setActiveTab} notifications={notifications} onMarkNotificationAsRead={handleMarkNotificationAsRead} onMarkAllNotificationsAsRead={handleMarkAllNotificationsAsRead}>
      {setupRequired && (
        <div className="bg-orange-600 text-white p-4 rounded-lg mb-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-lg animate-fade-in">
            <div className="flex items-start gap-3"><div className="bg-white/20 p-2 rounded-full"><AlertTriangle size={24} /></div><div><p className="font-bold text-lg">Configuration Supabase Requise</p><p className="text-sm text-orange-100">Les tables n'ont pas encore été créées dans votre projet Supabase.</p></div></div>
            <button onClick={copySchemaToClipboard} className="bg-white text-orange-600 px-4 py-3 rounded font-bold hover:bg-gray-100 transition flex items-center gap-2 whitespace-nowrap shadow-md"><Database size={18} />Copier le script SQL complet</button>
        </div>
      )}
      {(!setupRequired && clubs.length === 0 && supabase) && (
        <div className="bg-emerald-600 text-white p-4 rounded-lg mb-4 flex items-center justify-between shadow-lg">
            <p className="font-medium">Votre base de données est vide. Souhaitez-vous charger les données de démonstration ?</p>
            <button onClick={seedDatabase} className="bg-white text-emerald-600 px-4 py-2 rounded font-bold hover:bg-gray-100 transition shadow-md">Initialiser les données</button>
        </div>
      )}
      {renderContent()}
    </Layout>
  );
};

export default App;
