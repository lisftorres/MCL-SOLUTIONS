
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
import { Database, Wifi, WifiOff, AlertTriangle, ShieldCheck } from 'lucide-react';
import { supabase } from './services/supabase';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dbStatus, setDbStatus] = useState<'CONNECTED' | 'DEMO' | 'ERROR'>('DEMO');
  
  // States pour les données
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
  const [failureTypes] = useState<Record<TradeType, string[]>>(MOCK_FAILURE_TYPES);

  // Synchronisation avec Supabase
  useEffect(() => {
    if (!supabase) {
      setDbStatus('DEMO');
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

    const fetchData = async () => {
      try {
        const { data: clubsData, error: clubsError } = await supabase.from('clubs').select('*');
        if (clubsError) throw clubsError;
        
        setDbStatus('CONNECTED');
        setClubs(clubsData || []);
        
        const fetchTable = async (table: string, setter: any) => {
          const { data } = await supabase.from(table).select('*');
          if (data) setter(data);
        };

        fetchTable('tickets', setTickets);
        fetchTable('checks', setChecks);
        fetchTable('maintenance', setMaintenanceEvents);
        fetchTable('planning', setPlanningEvents);
        fetchTable('documents', setDocs);
        fetchTable('specifications', setSpecifications);
        fetchTable('artisans', setArtisans);
        fetchTable('users', setUsers);
      } catch (e) {
        console.error("Erreur de connexion Supabase:", e);
        setDbStatus('ERROR');
        // Fallback démo en cas d'erreur de table manquante
        setClubs(MOCK_CLUBS);
        setTickets(MOCK_TICKETS);
      }
    };

    fetchData();

    // Abonnements temps réel
    const tables = ['tickets', 'checks', 'maintenance', 'planning', 'artisans', 'users'];
    const channels = tables.map(table => 
      supabase.channel(`any_${table}`)
        .on('postgres_changes', { event: '*', schema: 'public', table }, () => fetchData())
        .subscribe()
    );

    return () => { channels.forEach(c => supabase.removeChannel(c)); };
  }, []);

  // --- SUPPRESSION DÉFINITIVE ---
  const handleDeleteTicket = async (id: string) => {
    if (!window.confirm("Supprimer ce ticket DÉFINITIVEMENT de la base de données ?")) return;
    
    // Mise à jour visuelle immédiate
    setTickets(prev => prev.filter(t => t.id !== id));

    if (supabase) {
      const { error } = await supabase.from('tickets').delete().eq('id', id);
      if (error) {
        alert("Erreur Supabase lors de la suppression: " + error.message);
        // Si erreur, on remet le ticket (optionnel pour la cohérence)
      }
    }
  };

  const handleUpdateTicketStatus = async (id: string, status: TicketStatus) => {
    setTickets(prev => prev.map(t => t.id === id ? { ...t, status } : t));
    if (supabase) {
      await supabase.from('tickets').update({ status }).eq('id', id);
    }
  };

  const handleCreateTicket = async (newTicket: Partial<Ticket>) => {
    const tempId = `temp_${Date.now()}`;
    const fullTicket = { ...newTicket, id: tempId, createdAt: new Date().toISOString() } as Ticket;
    setTickets(prev => [fullTicket, ...prev]);

    if (supabase) {
      await supabase.from('tickets').insert([{ ...newTicket, status: TicketStatus.OPEN, createdBy: currentUser?.id }]);
    }
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
    const activeTickets = tickets.filter(t => !t.deleted);
    switch (activeTab) {
      case 'dashboard': return <Dashboard tickets={activeTickets} checks={checks} clubs={clubs} maintenanceEvents={maintenanceEvents} currentUser={currentUser} />;
      case 'tickets': return <TicketManager tickets={activeTickets} clubs={clubs} users={users} currentUser={currentUser} failureTypes={failureTypes} onCreateTicket={handleCreateTicket} onEditTicket={() => {}} onDeleteTicket={handleDeleteTicket} onUpdateStatus={handleUpdateTicketStatus} />;
      case 'checks': return <CheckManager checks={checks} clubs={clubs} user={currentUser} onUpdateCheck={() => {}} onCreateCheck={() => {}} onEditCheck={() => {}} onDeleteCheck={(id) => {}} />;
      default: return <Dashboard tickets={activeTickets} checks={checks} clubs={clubs} currentUser={currentUser} />;
    }
  };

  if (!isAuthenticated || !currentUser) return <Login onLogin={handleLogin} />;

  return (
    <Layout user={currentUser} onLogout={handleLogout} activeTab={activeTab} onTabChange={setActiveTab}>
      {/* Indicateur de Statut de la Base de Données */}
      <div className="mb-6 flex items-center justify-between bg-brand-darker/50 p-3 rounded-xl border border-white/5 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          {dbStatus === 'CONNECTED' ? (
            <div className="flex items-center gap-2 text-green-400 text-xs font-bold uppercase tracking-widest">
              <ShieldCheck size={16} /> Base de données active (Supabase)
            </div>
          ) : dbStatus === 'DEMO' ? (
            <div className="flex items-center gap-2 text-brand-yellow text-xs font-bold uppercase tracking-widest">
              <WifiOff size={16} /> Mode Démo (Données temporaires)
            </div>
          ) : (
            <div className="flex items-center gap-2 text-red-500 text-xs font-bold uppercase tracking-widest">
              <AlertTriangle size={16} /> Erreur de configuration Supabase
            </div>
          )}
        </div>
        {dbStatus !== 'CONNECTED' && (
          <p className="text-[10px] text-gray-500 italic">Vérifiez vos variables VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY</p>
        )}
      </div>

      {renderContent()}
    </Layout>
  );
};

export default App;
