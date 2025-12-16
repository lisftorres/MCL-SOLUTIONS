

export enum UserRole {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER', // Responsable Club
  TECHNICIAN = 'TECHNICIAN'
}

export enum TicketStatus {
  OPEN = 'OUVERT',
  IN_PROGRESS = 'EN_COURS',
  RESOLVED = 'RESOLU',
  CANCELLED = 'ANNULE'
}

export enum Urgency {
  LOW = 'BASSE',
  MEDIUM = 'MOYENNE',
  HIGH = 'HAUTE',
  CRITICAL = 'CRITIQUE'
}

export enum CheckStatus {
  UPCOMING = 'A_VENIR',
  WARNING_MONTH = 'ALERTE_1_MOIS',
  WARNING_WEEK = 'ALERTE_7_JOURS',
  LATE = 'EN_RETARD',
  COMPLETED = 'TERMINE'
}

export enum TradeType {
  ELECTRICITY = 'Électricité',
  LIGHTING = 'Éclairage',
  PLUMBING = 'Plomberie',
  LOCKSMITH = 'Serrurerie',
  HVAC = 'Ventilation / Climatisation',
  DRYWALL_PAINT = 'Placo / Peinture',
  FLOORING = 'Carrelage / Sols',
  CARPENTRY = 'Menuiserie',
  MASONRY = 'Maçonnerie',
  SEALING = 'Étanchéité',
  SIGNAGE = 'Signalétique',
  CLEANING = 'Nettoyage technique'
}

export interface NotificationPreferences {
  tickets: boolean; // Alerte sur tickets urgents
  checks: boolean; // Alerte sur vérifications en retard
  maintenance: boolean; // Alerte sur nouvelles maintenances
  browserPush: boolean; // Autorisation push navigateur
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  clubIds: string[]; // Access to specific clubs
  avatar?: string;
  preferences: NotificationPreferences;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'TICKET' | 'CHECK' | 'MAINTENANCE' | 'PLANNING';
  date: string;
  read: boolean;
  linkTo?: string; // ID de l'élément concerné
}

export interface Club {
  id: string;
  name: string;
  address: string;
  spaces: string[]; // e.g., ["Accueil", "Vestiaires H", "Cardio"]
}

export interface TicketHistory {
  date: string;
  user: string; // Nom de l'utilisateur
  action: 'CREATION' | 'MODIFICATION' | 'STATUS_CHANGE' | 'DELETION' | 'RESTORATION';
  details?: string; // Ex: "Changement priorité: BASSE -> HAUTE"
}

export interface Ticket {
  id: string;
  clubId: string;
  space: string;
  trade: TradeType;
  description: string;
  status: TicketStatus;
  urgency: Urgency;
  createdAt: string;
  assignedTo?: string; // User ID (Technician)
  createdBy: string;
  images: string[];
  technicalReport?: string; // Filled by technician
  history?: TicketHistory[]; // Log des modifications
  deleted?: boolean; // Soft delete flag
}

export interface CheckHistory {
  date: string;
  technicianName: string;
  status: CheckStatus;
  notes?: string;
}

export interface PeriodicCheck {
  id: string;
  clubId: string;
  space: string;
  trade: TradeType;
  title: string;
  frequencyMonths: number;
  lastChecked?: string;
  nextDueDate: string;
  status: CheckStatus;
  checklistItems: { label: string; checked: boolean }[];
  technicianSignature?: string;
  history?: CheckHistory[]; // New: Log of past checks
  deleted?: boolean; // Soft delete flag
}

export interface MaintenanceEvent {
  id: string;
  title: string;
  date: string;
  description: string;
  notifyOnDashboard: boolean;
  clubId?: string; // New: Link to a club
  checklist?: { space: string; checked: boolean }[]; // New: Work done per space
  signatures?: { // New: Validation
    technician?: { name: string; date: string };
    manager?: { name: string; date: string };
  };
  deleted?: boolean; // Soft delete flag
}

export interface PlanningEvent {
  id: string;
  title: string;
  date: string; // ISO Date YYYY-MM-DD
  startTime: string; // HH:MM
  type: 'RDV' | 'LIVRAISON' | 'AUTRE';
  description?: string;
  location?: string;
  alert: boolean; // Si vrai, envoie une notif
  createdBy: string;
  deleted?: boolean;
}

export interface DocumentFile {
  id: string;
  name: string;
  type: 'PDF' | 'IMAGE' | 'PLAN' | 'INVOICE' | 'QUOTE';
  url: string;
  clubId: string;
  date: string;
}

export interface Artisan {
  id: string;
  companyName: string;
  contactName: string;
  trade: TradeType;
  phone: string;
  email: string;
  address: string;
  notes?: string;
}

export interface Specification {
  id: string;
  category: string; // Le nom du dossier (ex: Plomberie, Luminaire)
  title: string; // Nom de l'élément
  brand: string; // Marque
  partType: string; // Type de pièce (référence)
  installationType: string; // Type de pose / Instructions
  imageUrl: string; // Photo principale
  documentUrl?: string; // Lien vers un fichier joint (PDF, Doc)
  documentName?: string; // Nom du fichier joint
}