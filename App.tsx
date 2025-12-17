
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
import { Database, WifiOff, AlertTriangle, ShieldCheck, DatabaseZap } from 'lucide-react';
import { supabase } from './services/supabase';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dbStatus, setDbStatus] = useState<'CONNECTED' | 'DEMO' | 'ERROR'>('DEMO');
  
  // États des données
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
  const [clubs, setClubs] = useState<Club[]>([]);
  const [failureTypes, setFailureTypes] = useState<Record<TradeType, string[]>>(MOCK_FAILURE_TYPES);

  // --- CHARGEMENT DES DONNÉES ---
  const fetchData = async () => {
    if (!supabase) return;
    try {
      const results = await Promise.all([
        supabase.from('clubs').select('*'),
        supabase.from('tickets').select('*'),
        supabase.from('checks').select('*'),
        supabase.from('maintenance').select('*'),
        supabase.from('planning').select('*'),
        supabase.from('documents').select('*'),
        supabase.from('specifications').select('*'),
        supabase.from('artisans').select('*'),
        supabase.from('users').select('*')
      ]);

      const errors = results.filter(r => r.error);
      if (errors.length > 0) throw errors[0].error;

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
      console.error("Erreur Supabase:", e);
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
      const channels = ['tickets', 'checks', 'maintenance', 'planning', 'artisans', 'users'].map(table => 
        supabase.channel(`public:${table}`).on('postgres_changes', { event: '*', schema: 'public', table }, () => fetchData()).subscribe()
      );
      return () => { channels.forEach(c => supabase.removeChannel(c)); };
    }
  }, []);

  // --- HANDLERS ACTIONS ---
  const handleAddEvent = async (event: Partial<PlanningEvent>) => {
    if (supabase) await supabase.from('planning').insert([event]);
    else setPlanningEvents(prev => [...prev, { ...event, id: `temp_${Date.now()}` } as PlanningEvent]);
    fetchData();
  };

  const handleDeleteTicket = async (id: string) => {
    if (!window.confirm("Supprimer DÉFINITIVEMENT de la base ?")) return;
    if (supabase) await supabase.from('tickets').delete().eq('id', id);
    else setTickets(prev => prev.filter(t => t.id !== id));
    fetchData();
  };

  const handleLogin = async (email: string, password: string): Promise<boolean> => {
    const userList = users.length > 0 ? users : MOCK_USERS;
    const foundUser = userList.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (foundUser) {
      const storedPass = userPasswords[foundUser.id] || (foundUser.id === 'admin_fixed' ? 'Marielis1338!' : '123456');
      if (storedPass === password) { 
        setCurrentUser(foundUser); 
        setIsAuthenticated(true); 
        return true; 
      }
    }
    return false;
  };

  const handleLogout = () => { setIsAuthenticated(false); setCurrentUser(null); };

  // --- RENDU DU CONTENU ---
  const renderContent = () => {
    if (!currentUser) return null;
    const commonProps = { currentUser, tickets, checks, clubs, users };

    switch (activeTab) {
      case 'dashboard': return <Dashboard {...commonProps} maintenanceEvents={maintenanceEvents} />;
      case 'planning': return <GeneralPlanning events={planningEvents} currentUser={currentUser} onAddEvent={handleAddEvent} onEditEvent={() => {}} onDeleteEvent={() => {}} />;
      case 'tickets': return <TicketManager {...commonProps} failureTypes={failureTypes} onCreateTicket={handleDeleteTicket} onEditTicket={() => {}} onDeleteTicket={handleDeleteTicket} onUpdateStatus={() => {}} />;
      case 'checks': return <CheckManager checks={checks} clubs={clubs} user={currentUser} onUpdateCheck={() => {}} onCreateCheck={() => {}} onEditCheck={() => {}} onDeleteCheck={() => {}} />;
      case 'maintenance': return <MaintenanceSchedule {...commonProps} maintenanceEvents={maintenanceEvents} onAddEvent={() => {}} onEditEvent={() => {}} onDeleteEvent={() => {}} />;
      case 'users': return <UserManager users={users} clubs={clubs} userPasswords={userPasswords} onAddUser={() => {}} onEditUser={() => {}} onDeleteUser={() => {}} />;
      case 'specs': return <SpecificationsManager specifications={specifications} currentUser={currentUser} onAddSpecification={() => {}} onDeleteSpecification={() => {}} onEditSpecification={() => {}} />;
      case 'contact': return <ContactBook artisans={artisans} currentUser={currentUser} onAddArtisan={() => {}} onDeleteArtisan={() => {}} onEditArtisan={() => {}} />;
      case 'financial': return <FinancialManager documents={docs} clubs={clubs} currentUser={currentUser} onAddDocument={() => {}} onDeleteDocument={() => {}} />;
      case 'documents': return <DocumentManager documents={docs} clubs={clubs} currentUser={currentUser} onAddDocument={() => {}} onDeleteDocument={() => {}} />;
      case 'settings': return <SettingsManager clubs={clubs} failureTypes={failureTypes} onAddClub={() => {}} onDeleteClub={() => {}} onUpdateClubSpaces={() => {}} onUpdateFailureTypes={() => {}} />;
      case 'recycle_bin': return <RecycleBin deletedTickets={[]} deletedChecks={[]} deletedMaintenance={[]} deletedPlanning={[]} currentUser={currentUser} onRestoreTicket={() => {}} onRestoreCheck={() => {}} onRestoreMaintenance={() => {}} onRestorePlanning={() => {}} onPermanentDeleteTicket={() => {}} onPermanentDeleteCheck={() => {}} onPermanentDeleteMaintenance={() => {}} onPermanentDeletePlanning={() => {}} />;
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
            {dbStatus === 'CONNECTED' ? <ShieldCheck size={24} /> : <WifiOff size={24} />}
          </div>
          <div>
            <h3 className="text-sm font-black uppercase tracking-widest text-white">
              {dbStatus === 'CONNECTED' ? 'Connecté à Supabase' : 'Mode Démonstration'}
            </h3>
            <p className="text-xs text-gray-400 font-medium">
              {dbStatus === 'CONNECTED' ? 'Données réelles actives.' : 'Fichiers locaux (Pas de sauvegarde définitive).'}
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
