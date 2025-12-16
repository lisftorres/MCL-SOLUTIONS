
import React, { useState } from 'react';
import { Ticket, PeriodicCheck, MaintenanceEvent, PlanningEvent, TicketStatus, User } from '../types';
import { Trash2, RefreshCw, Ticket as TicketIcon, ClipboardCheck, Wrench, Calendar, AlertTriangle } from 'lucide-react';

interface RecycleBinProps {
  deletedTickets: Ticket[];
  deletedChecks: PeriodicCheck[];
  deletedMaintenance: MaintenanceEvent[];
  deletedPlanning: PlanningEvent[];
  currentUser: User;
  onRestoreTicket: (id: string) => void;
  onRestoreCheck: (id: string) => void;
  onRestoreMaintenance: (id: string) => void;
  onRestorePlanning: (id: string) => void;
  onPermanentDeleteTicket: (id: string) => void;
  onPermanentDeleteCheck: (id: string) => void;
  onPermanentDeleteMaintenance: (id: string) => void;
  onPermanentDeletePlanning: (id: string) => void;
}

const RecycleBin: React.FC<RecycleBinProps> = ({
  deletedTickets,
  deletedChecks,
  deletedMaintenance,
  deletedPlanning,
  currentUser,
  onRestoreTicket,
  onRestoreCheck,
  onRestoreMaintenance,
  onRestorePlanning,
  onPermanentDeleteTicket,
  onPermanentDeleteCheck,
  onPermanentDeleteMaintenance,
  onPermanentDeletePlanning
}) => {
  const [activeTab, setActiveTab] = useState<'TICKETS' | 'CHECKS' | 'MAINTENANCE' | 'PLANNING'>('TICKETS');

  const handleDelete = (type: string, id: string, deleteFn: (id: string) => void) => {
    if (window.confirm("ATTENTION : Cette suppression est définitive et irréversible. Continuer ?")) {
      deleteFn(id);
    }
  };

  const renderEmpty = () => (
    <div className="flex flex-col items-center justify-center py-20 text-gray-500">
      <Trash2 size={48} className="mb-4 opacity-30" />
      <p>La corbeille est vide pour cette section.</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="bg-gym-light p-6 rounded-lg shadow-lg flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Trash2 className="text-red-500" />
            Corbeille
          </h2>
          <p className="text-gray-400 text-sm mt-1">
            Gérez les éléments supprimés. Restaurez-les si nécessaire ou supprimez-les définitivement.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 border-b border-gray-700 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('TICKETS')}
          className={`flex items-center gap-2 px-4 py-2 rounded-t-lg transition-colors whitespace-nowrap ${
            activeTab === 'TICKETS' ? 'bg-gym-yellow text-gym-dark font-bold' : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <TicketIcon size={18} /> Tickets ({deletedTickets.length})
        </button>
        <button
          onClick={() => setActiveTab('CHECKS')}
          className={`flex items-center gap-2 px-4 py-2 rounded-t-lg transition-colors whitespace-nowrap ${
            activeTab === 'CHECKS' ? 'bg-gym-yellow text-gym-dark font-bold' : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <ClipboardCheck size={18} /> Vérifications ({deletedChecks.length})
        </button>
        <button
          onClick={() => setActiveTab('MAINTENANCE')}
          className={`flex items-center gap-2 px-4 py-2 rounded-t-lg transition-colors whitespace-nowrap ${
            activeTab === 'MAINTENANCE' ? 'bg-gym-yellow text-gym-dark font-bold' : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Wrench size={18} /> Maintenance ({deletedMaintenance.length})
        </button>
        <button
          onClick={() => setActiveTab('PLANNING')}
          className={`flex items-center gap-2 px-4 py-2 rounded-t-lg transition-colors whitespace-nowrap ${
            activeTab === 'PLANNING' ? 'bg-gym-yellow text-gym-dark font-bold' : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Calendar size={18} /> Planning ({deletedPlanning.length})
        </button>
      </div>

      {/* Content */}
      <div className="bg-gym-light rounded-xl border border-gray-700 p-4">
        
        {/* TICKETS LIST */}
        {activeTab === 'TICKETS' && (
          <div className="space-y-3">
            {deletedTickets.length === 0 && renderEmpty()}
            {deletedTickets.map(item => (
              <div key={item.id} className="bg-gym-dark p-4 rounded-lg border border-gray-600 flex justify-between items-center group">
                <div>
                  <h4 className="font-bold text-white flex items-center gap-2">
                    {item.trade} <span className="text-xs font-normal text-gray-500 bg-black/30 px-2 py-0.5 rounded">{item.id}</span>
                  </h4>
                  <p className="text-sm text-gray-400">{item.description}</p>
                  <p className="text-xs text-gray-500 mt-1">Supprimé (Annulé) - Club: {item.clubId}</p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => onRestoreTicket(item.id)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-green-500/10 text-green-400 border border-green-500/30 rounded hover:bg-green-500/20 transition"
                    title="Restaurer"
                  >
                    <RefreshCw size={16} /> Restaurer
                  </button>
                  <button 
                    onClick={() => handleDelete('Ticket', item.id, onPermanentDeleteTicket)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-red-500/10 text-red-400 border border-red-500/30 rounded hover:bg-red-500/20 transition"
                    title="Supprimer définitivement"
                  >
                    <Trash2 size={16} /> Supprimer
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* CHECKS LIST */}
        {activeTab === 'CHECKS' && (
          <div className="space-y-3">
             {deletedChecks.length === 0 && renderEmpty()}
             {deletedChecks.map(item => (
              <div key={item.id} className="bg-gym-dark p-4 rounded-lg border border-gray-600 flex justify-between items-center">
                <div>
                  <h4 className="font-bold text-white">{item.title}</h4>
                  <p className="text-sm text-gray-400">{item.space} • {item.trade}</p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => onRestoreCheck(item.id)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-green-500/10 text-green-400 border border-green-500/30 rounded hover:bg-green-500/20 transition"
                  >
                    <RefreshCw size={16} /> Restaurer
                  </button>
                  <button 
                    onClick={() => handleDelete('Check', item.id, onPermanentDeleteCheck)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-red-500/10 text-red-400 border border-red-500/30 rounded hover:bg-red-500/20 transition"
                  >
                    <Trash2 size={16} /> Supprimer
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* MAINTENANCE LIST */}
        {activeTab === 'MAINTENANCE' && (
          <div className="space-y-3">
             {deletedMaintenance.length === 0 && renderEmpty()}
             {deletedMaintenance.map(item => (
              <div key={item.id} className="bg-gym-dark p-4 rounded-lg border border-gray-600 flex justify-between items-center">
                <div>
                  <h4 className="font-bold text-white">{item.title}</h4>
                  <p className="text-sm text-gray-400">Prévu le: {item.date}</p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => onRestoreMaintenance(item.id)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-green-500/10 text-green-400 border border-green-500/30 rounded hover:bg-green-500/20 transition"
                  >
                    <RefreshCw size={16} /> Restaurer
                  </button>
                  <button 
                    onClick={() => handleDelete('Maintenance', item.id, onPermanentDeleteMaintenance)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-red-500/10 text-red-400 border border-red-500/30 rounded hover:bg-red-500/20 transition"
                  >
                    <Trash2 size={16} /> Supprimer
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* PLANNING LIST */}
        {activeTab === 'PLANNING' && (
          <div className="space-y-3">
             {deletedPlanning.length === 0 && renderEmpty()}
             {deletedPlanning.map(item => (
              <div key={item.id} className="bg-gym-dark p-4 rounded-lg border border-gray-600 flex justify-between items-center">
                <div>
                  <h4 className="font-bold text-white">{item.title}</h4>
                  <p className="text-sm text-gray-400">{item.date} à {item.startTime} ({item.type})</p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => onRestorePlanning(item.id)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-green-500/10 text-green-400 border border-green-500/30 rounded hover:bg-green-500/20 transition"
                  >
                    <RefreshCw size={16} /> Restaurer
                  </button>
                  <button 
                    onClick={() => handleDelete('Event', item.id, onPermanentDeletePlanning)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-red-500/10 text-red-400 border border-red-500/30 rounded hover:bg-red-500/20 transition"
                  >
                    <Trash2 size={16} /> Supprimer
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
};

export default RecycleBin;
