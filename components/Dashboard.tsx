

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Ticket, PeriodicCheck, TicketStatus, CheckStatus, Club, Urgency, MaintenanceEvent, User, UserRole } from '../types';
import { AlertTriangle, CheckCircle, Clock, AlertOctagon, MapPin, BellRing, Calendar, ChevronRight } from 'lucide-react';

interface DashboardProps {
  tickets: Ticket[];
  checks: PeriodicCheck[];
  clubs: Club[];
  maintenanceEvents?: MaintenanceEvent[];
  currentUser?: User;
}

const Dashboard: React.FC<DashboardProps> = ({ tickets, checks, clubs, maintenanceEvents = [], currentUser }) => {
  
  // Filtering based on User Permissions
  // MODIFICATION: Technicians also see ALL clubs, like Admins.
  const allowedClubs = (currentUser?.role === UserRole.ADMIN || currentUser?.role === UserRole.TECHNICIAN)
    ? clubs 
    : clubs.filter(c => currentUser?.clubIds.includes(c.id));
    
  const allowedClubIds = allowedClubs.map(c => c.id);

  const filteredTickets = tickets.filter(t => allowedClubIds.includes(t.clubId));
  const filteredChecks = checks.filter(c => allowedClubIds.includes(c.clubId));
  const filteredEvents = maintenanceEvents.filter(m => !m.clubId || allowedClubIds.includes(m.clubId));

  // Stats Calculation
  // EXCLUSION STRICTE DES TICKETS 'ANNULÉ'
  const validTickets = filteredTickets.filter(t => t.status !== TicketStatus.CANCELLED);
  
  const openTickets = validTickets.filter(t => t.status === TicketStatus.OPEN).length;
  const criticalTickets = validTickets.filter(t => t.urgency === 'CRITIQUE' || t.urgency === 'HAUTE').length;
  const lateChecks = filteredChecks.filter(c => c.status === CheckStatus.LATE || c.status === CheckStatus.WARNING_WEEK).length;
  const resolvedTickets = validTickets.filter(t => t.status === TicketStatus.RESOLVED).length;

  // Filter Active Maintenance Reminders (Future or Today)
  const activeReminders = filteredEvents.filter(m => {
    const today = new Date();
    today.setHours(0,0,0,0);
    const eventDate = new Date(m.date);
    return m.notifyOnDashboard && eventDate >= today;
  });

  // Filter Periodic Check Alerts (Late, Warning Week, Warning Month)
  const alertChecks = filteredChecks.filter(c => 
    [CheckStatus.LATE, CheckStatus.WARNING_WEEK, CheckStatus.WARNING_MONTH].includes(c.status)
  ).sort((a, b) => new Date(a.nextDueDate).getTime() - new Date(b.nextDueDate).getTime());

  // Chart Data - Status (Using validTickets to exclude cancelled)
  const ticketStatusData = [
    { name: 'Ouvert', value: openTickets, color: '#EF4444' },
    { name: 'En Cours', value: validTickets.filter(t => t.status === TicketStatus.IN_PROGRESS).length, color: '#F59E0B' },
    { name: 'Résolu', value: resolvedTickets, color: '#10B981' },
  ];

  // Chart Data - Periodic Checks
  const checksData = [
    { name: 'À venir', value: filteredChecks.filter(c => c.status === CheckStatus.UPCOMING).length },
    { name: 'Alerte', value: filteredChecks.filter(c => c.status.includes('ALERTE')).length },
    { name: 'Retard', value: filteredChecks.filter(c => c.status === CheckStatus.LATE).length },
    { name: 'Terminé', value: filteredChecks.filter(c => c.status === CheckStatus.COMPLETED).length },
  ];

  // Chart Data - Trades Distribution (Top 5)
  const tradeCounts: Record<string, number> = {};
  validTickets.forEach(ticket => {
    tradeCounts[ticket.trade] = (tradeCounts[ticket.trade] || 0) + 1;
  });
  
  const tradeData = Object.entries(tradeCounts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5); // Top 5

  // Recent Tickets (Top 5) - Exclude Cancelled
  const recentTickets = [...validTickets]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const StatCard = ({ title, value, icon: Icon, color, subtext }: any) => (
    <div className="bg-gym-light p-6 rounded-xl shadow-lg border-l-4" style={{ borderColor: color }}>
      <div className="flex justify-between items-start">
        <div>
          <p className="text-gray-300 text-sm uppercase tracking-wide">{title}</p>
          <h3 className="text-4xl font-bold text-white mt-1">{value}</h3>
          {subtext && <p className="text-xs text-gray-400 mt-2">{subtext}</p>}
        </div>
        <div className={`p-3 rounded-full bg-opacity-20`} style={{ backgroundColor: color }}>
          <Icon size={24} style={{ color: color }} />
        </div>
      </div>
    </div>
  );

  const getStatusBadge = (status: TicketStatus) => {
    switch (status) {
      case TicketStatus.OPEN: return <span className="bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-1 rounded text-xs">Ouvert</span>;
      case TicketStatus.IN_PROGRESS: return <span className="bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 px-2 py-1 rounded text-xs">En cours</span>;
      case TicketStatus.RESOLVED: return <span className="bg-green-500/20 text-green-400 border border-green-500/30 px-2 py-1 rounded text-xs">Résolu</span>;
    }
  };

  const getUrgencyDot = (urgency: Urgency) => {
    switch (urgency) {
      case Urgency.CRITICAL: return <span title="Critique" className="w-3 h-3 rounded-full bg-red-600 animate-pulse shadow-red-500/50 shadow-lg"></span>;
      case Urgency.HIGH: return <span title="Haute" className="w-3 h-3 rounded-full bg-orange-500"></span>;
      case Urgency.MEDIUM: return <span title="Moyenne" className="w-3 h-3 rounded-full bg-yellow-400"></span>;
      case Urgency.LOW: return <span title="Basse" className="w-3 h-3 rounded-full bg-blue-400"></span>;
    }
  };

  const getCheckAlertStyle = (status: CheckStatus) => {
    switch (status) {
      case CheckStatus.LATE: return { borderColor: 'border-red-500', bgColor: 'bg-red-500/10', textColor: 'text-red-400', icon: AlertOctagon, label: 'En retard' };
      case CheckStatus.WARNING_WEEK: return { borderColor: 'border-orange-500', bgColor: 'bg-orange-500/10', textColor: 'text-orange-400', icon: AlertTriangle, label: 'J-7' };
      case CheckStatus.WARNING_MONTH: return { borderColor: 'border-yellow-500', bgColor: 'bg-yellow-500/10', textColor: 'text-yellow-400', icon: Clock, label: 'J-30' };
      default: return { borderColor: 'border-gray-500', bgColor: 'bg-gray-500/10', textColor: 'text-gray-400', icon: Clock, label: '' };
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Maintenance Reminders */}
        {activeReminders.length > 0 && (
          <div className="bg-purple-900/20 border border-purple-500/30 rounded-xl p-4 flex flex-col items-start gap-4 shadow-lg">
            <div className="flex items-center gap-3 mb-2">
               <div className="bg-purple-500/20 p-2 rounded-full">
                <BellRing className="text-purple-400" size={20} />
               </div>
               <h3 className="text-lg font-bold text-white">Rappels Maintenance</h3>
            </div>
            <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-3">
              {activeReminders.map(event => (
                <div key={event.id} className="bg-gym-dark/50 p-3 rounded border border-purple-500/20 flex items-center gap-3 hover:bg-gym-dark transition">
                  <Calendar size={18} className="text-purple-400 shrink-0" />
                  <div className="overflow-hidden">
                    <p className="font-semibold text-sm text-white truncate">{event.title}</p>
                    <p className="text-xs text-gray-400 truncate">{new Date(event.date).toLocaleDateString('fr-FR')} - {event.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Periodic Check Alerts */}
        {alertChecks.length > 0 && (
          <div className="bg-orange-900/10 border border-orange-500/30 rounded-xl p-4 flex flex-col items-start gap-4 shadow-lg">
             <div className="flex items-center gap-3 mb-2">
               <div className="bg-orange-500/20 p-2 rounded-full">
                <AlertTriangle className="text-orange-400" size={20} />
               </div>
               <h3 className="text-lg font-bold text-white">Alertes Vérifications ({alertChecks.length})</h3>
            </div>
            <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto custom-scrollbar pr-1">
              {alertChecks.map(check => {
                const style = getCheckAlertStyle(check.status);
                const CheckIcon = style.icon;
                return (
                  <div key={check.id} className={`bg-gym-dark/50 p-3 rounded border-l-4 ${style.borderColor} flex justify-between items-center gap-2 hover:bg-gym-dark transition`}>
                    <div className="overflow-hidden">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${style.bgColor} ${style.textColor}`}>
                           {style.label}
                        </span>
                        <span className="text-xs text-gray-500">{new Date(check.nextDueDate).toLocaleDateString('fr-FR')}</span>
                      </div>
                      <p className="font-semibold text-sm text-white truncate">{check.title}</p>
                      <p className="text-xs text-gray-400 truncate">{check.space} • {check.trade}</p>
                    </div>
                    <CheckIcon size={18} className={`${style.textColor} shrink-0`} />
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Tickets Ouverts" 
          value={openTickets} 
          icon={AlertCircle} 
          color="#EF4444" 
          subtext="Total"
        />
        <StatCard 
          title="Interventions" 
          value={validTickets.filter(t => t.status === TicketStatus.IN_PROGRESS).length} 
          icon={Clock} 
          color="#F7CE3E" 
          subtext="En cours"
        />
        <StatCard 
          title="Vérifications Retard" 
          value={lateChecks} 
          icon={AlertOctagon} 
          color="#F97316" 
          subtext="Action requise"
        />
        <StatCard 
          title="Taux Résolution" 
          value="94%" 
          icon={CheckCircle} 
          color="#10B981" 
          subtext="Mois dernier"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ticket Status */}
        <div className="bg-gym-light p-6 rounded-xl shadow-lg">
          <h3 className="text-lg font-bold text-white mb-4">État des Tickets</h3>
          <div className="h-64">
             <ResponsiveContainer width="100%" height="100%">
               <PieChart>
                 <Pie
                   data={ticketStatusData}
                   cx="50%"
                   cy="50%"
                   innerRadius={60}
                   outerRadius={80}
                   paddingAngle={5}
                   dataKey="value"
                 >
                   {ticketStatusData.map((entry, index) => (
                     <Cell key={`cell-${index}`} fill={entry.color} />
                   ))}
                 </Pie>
                 <Tooltip contentStyle={{ backgroundColor: '#2A3036', borderColor: '#4B5560', color: '#FFF' }} />
               </PieChart>
             </ResponsiveContainer>
          </div>
          <div className="flex justify-center space-x-4 mt-4">
             {ticketStatusData.map((entry, i) => (
               <div key={i} className="flex items-center text-sm text-gray-300">
                 <span className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: entry.color }}></span>
                 {entry.name}: {entry.value}
               </div>
             ))}
          </div>
        </div>

        {/* Trade Distribution Chart */}
        <div className="bg-gym-light p-6 rounded-xl shadow-lg">
          <h3 className="text-lg font-bold text-white mb-4">Top 5 Interventions par Métier</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={tradeData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#373F47" horizontal={false} />
                <XAxis type="number" stroke="#9CA3AF" hide />
                <YAxis dataKey="name" type="category" stroke="#9CA3AF" width={100} tick={{fontSize: 12}} />
                <Tooltip 
                  cursor={{fill: '#373F47'}} 
                  contentStyle={{ backgroundColor: '#2A3036', borderColor: '#4B5560', color: '#FFF' }} 
                />
                <Bar dataKey="value" fill="#F7CE3E" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Tickets Table */}
      <div className="bg-gym-light rounded-xl shadow-lg border border-gray-700 overflow-hidden">
        <div className="p-6 border-b border-gray-700 flex justify-between items-center">
            <h3 className="text-lg font-bold text-white">Derniers Tickets Signalés</h3>
            <button className="text-sm text-gym-yellow hover:underline flex items-center gap-1">
              Voir tout <ChevronRight size={14} />
            </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gym-darker text-gray-400 text-xs uppercase tracking-wider">
                <th className="p-4 font-semibold">Urg.</th>
                <th className="p-4 font-semibold">Métier / Description</th>
                <th className="p-4 font-semibold">Lieu</th>
                <th className="p-4 font-semibold">Date</th>
                <th className="p-4 font-semibold text-right">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {recentTickets.map(ticket => {
                const clubName = clubs.find(c => c.id === ticket.clubId)?.name || 'Club inconnu';
                return (
                  <tr key={ticket.id} className="hover:bg-white/5 transition duration-150">
                    <td className="p-4">
                      {getUrgencyDot(ticket.urgency)}
                    </td>
                    <td className="p-4">
                      <div className="font-medium text-white">{ticket.trade}</div>
                      <div className="text-xs text-gray-400 truncate max-w-[200px] md:max-w-xs">{ticket.description}</div>
                    </td>
                    <td className="p-4 text-sm text-gray-300">
                      <div className="flex items-center gap-1">
                        <MapPin size={12} className="text-gym-yellow"/>
                        <span>{clubName}</span>
                      </div>
                      <span className="text-xs text-gray-500 pl-4 block">{ticket.space}</span>
                    </td>
                    <td className="p-4 text-sm text-gray-400">
                      {new Date(ticket.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-right">
                      {getStatusBadge(ticket.status)}
                    </td>
                  </tr>
                );
              })}
              {recentTickets.length === 0 && (
                 <tr>
                    <td colSpan={5} className="p-8 text-center text-gray-500">Aucun ticket récent</td>
                 </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Simple icon wrapper to fix Lucide import issue in StatCard
const AlertCircle = (props: any) => <AlertTriangle {...props} />;

export default Dashboard;
