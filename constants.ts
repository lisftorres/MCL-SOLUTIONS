
import { Club, Ticket, PeriodicCheck, User, UserRole, TradeType, TicketStatus, Urgency, CheckStatus, DocumentFile, MaintenanceEvent, Artisan, Specification, PlanningEvent } from './types';

export const MOCK_CLUBS: Club[] = [
  { 
    id: 'c_comboire', 
    name: 'FP COMBOIRE', 
    address: 'Espace Comboire, 38130 Échirolles', 
    spaces: ['Accueil', 'Cardio', 'Musculation Guidée', 'Poids Libres', 'Crossfit', 'Studio Bike', 'Vestiaires H', 'Vestiaires F', 'Sauna', 'Local Technique'] 
  },
  { 
    id: 'c_grenoble', 
    name: 'FP GRENOBLE CENTRE', 
    address: 'Grenoble Centre', 
    spaces: ['Accueil', 'Cardio', 'Musculation', 'Zone Functional', 'Vestiaires H', 'Vestiaires F', 'Bureaux', 'Local Technique'] 
  },
  { 
    id: 'c_meylan', 
    name: 'FP MEYLAN', 
    address: 'Meylan', 
    spaces: ['Accueil', 'Cardio', 'Musculation', 'Cross Training', 'Vestiaires H', 'Vestiaires F', 'Salle de Cours', 'Local Technique'] 
  },
  { 
    id: 'c_neyrpic', 
    name: 'FP NEYRPIC', 
    address: 'Centre Commercial Neyrpic', 
    spaces: ['Accueil', 'Cardio', 'Musculation', 'Fight Park', 'Cycle Park', 'Vestiaires H', 'Vestiaires F', 'Local Technique'] 
  },
];

const ALL_CLUB_IDS = MOCK_CLUBS.map(c => c.id);

export const MOCK_USERS: User[] = [
  { 
    id: 'admin_fixed', 
    name: 'FELICIO TORRES Lisandro', 
    email: 'lisftorres@gmail.com', 
    role: UserRole.ADMIN, 
    clubIds: ALL_CLUB_IDS, 
    avatar: 'https://ui-avatars.com/api/?name=FELICIO+TORRES+Lisandro&background=F7CE3E&color=373F47',
    preferences: { tickets: true, checks: true, maintenance: true, browserPush: true }
  },
  { 
    id: 'user_marie', 
    name: 'MARIE CIAPPA', 
    email: 'mariea.ciappa@gmail.com', 
    role: UserRole.ADMIN, 
    clubIds: ALL_CLUB_IDS, 
    avatar: 'https://ui-avatars.com/api/?name=MARIE+CIAPPA&background=random&color=373F47',
    preferences: { tickets: true, checks: true, maintenance: true, browserPush: true }
  },
  {
    id: 'u_jonas',
    name: 'JONAS',
    email: 'manager.fpneyrpic@gmail.com',
    role: UserRole.MANAGER,
    clubIds: ['c_neyrpic'],
    avatar: 'https://ui-avatars.com/api/?name=Jonas&background=random',
    preferences: { tickets: true, checks: true, maintenance: true, browserPush: false }
  },
  {
    id: 'u_leanne',
    name: 'LEANNE',
    email: 'manager.grenoble@fitnessparkgrenoble.fr',
    role: UserRole.MANAGER,
    clubIds: ['c_grenoble'],
    avatar: 'https://ui-avatars.com/api/?name=Leanne&background=random',
    preferences: { tickets: true, checks: true, maintenance: true, browserPush: false }
  },
  {
    id: 'u_brian',
    name: 'BRIAN',
    email: 'manager.fpmeylan@gmail.com',
    role: UserRole.MANAGER,
    clubIds: ['c_meylan'],
    avatar: 'https://ui-avatars.com/api/?name=Brian&background=random',
    preferences: { tickets: true, checks: true, maintenance: true, browserPush: false }
  },
  {
    id: 'u_julien',
    name: 'JULIEN',
    email: 'manager.fpechirolles@gmail.com',
    role: UserRole.MANAGER,
    clubIds: ['c_comboire'],
    avatar: 'https://ui-avatars.com/api/?name=Julien&background=random',
    preferences: { tickets: true, checks: true, maintenance: true, browserPush: false }
  }
];

export const MOCK_FAILURE_TYPES: Record<TradeType, string[]> = {
  [TradeType.ELECTRICITY]: ['Coupure générale', 'Prise défectueuse', 'Disjoncteur saute', 'Câble dénudé'],
  [TradeType.LIGHTING]: ['Ampoule grillée', 'Néon clignote', 'Interrupteur HS', 'Détecteur mouvement HS'],
  [TradeType.PLUMBING]: ['Fuite d\'eau', 'Chasse d\'eau cassée', 'Canalisation bouchée', 'Plus d\'eau chaude', 'Robinetterie cassée'],
  [TradeType.LOCKSMITH]: ['Porte bloquée', 'Clé cassée dans serrure', 'Poignée détachée', 'Gond grinçant'],
  [TradeType.HVAC]: ['Clim ne refroidit plus', 'Bruit anormal ventilation', 'Fuite eau climatiseur', 'Filtre encrassé'],
  [TradeType.DRYWALL_PAINT]: ['Trou dans le mur', 'Peinture écaillée', 'Traces d\'humidité', 'Fissure apparente'],
  [TradeType.FLOORING]: ['Carrelage cassé', 'Lame parquet soulevée', 'Sol glissant/humide', 'Tapis décollé'],
  [TradeType.CARPENTRY]: ['Porte placard dégondée', 'Etagère instable', 'Banc vestiaire cassé'],
  [TradeType.MASONRY]: ['Joints effrités', 'Mur abîmé'],
  [TradeType.SEALING]: ['Infiltration toiture', 'Joint silicone usé'],
  [TradeType.SIGNAGE]: ['Panneau tombé', 'Affichage manquant'],
  [TradeType.CLEANING]: ['Sol sale', 'Poubelles pleines', 'Miroirs sales', 'Distributeur savon vide']
};

export const MOCK_TICKETS: Ticket[] = [
  {
    id: 't1',
    clubId: 'c_comboire',
    space: 'Vestiaires H',
    trade: TradeType.PLUMBING,
    description: 'Fuite sous le lavabo n°3, flaque d\'eau importante.',
    status: TicketStatus.OPEN,
    urgency: Urgency.HIGH,
    createdAt: '2023-10-25T09:00:00Z',
    createdBy: 'admin_fixed',
    images: ['https://picsum.photos/300/200'],
    history: [
      { date: '2023-10-25T09:00:00Z', user: 'Lis Torres', action: 'CREATION' }
    ]
  },
  {
    id: 't2',
    clubId: 'c_meylan',
    space: 'Cardio',
    trade: TradeType.HVAC,
    description: 'La climatisation fait un bruit de claquement.',
    status: TicketStatus.IN_PROGRESS,
    urgency: Urgency.MEDIUM,
    createdAt: '2023-10-24T14:30:00Z',
    assignedTo: 'admin_fixed',
    createdBy: 'admin_fixed',
    images: [],
    history: [
      { date: '2023-10-24T14:30:00Z', user: 'Lis Torres', action: 'CREATION' },
      { date: '2023-10-25T10:00:00Z', user: 'Lis Torres', action: 'STATUS_CHANGE', details: 'Pris en charge' }
    ]
  },
  {
    id: 't3',
    clubId: 'c_neyrpic',
    space: 'Accueil',
    trade: TradeType.LIGHTING,
    description: 'Ampoule grillée au dessus du comptoir.',
    status: TicketStatus.RESOLVED,
    urgency: Urgency.LOW,
    createdAt: '2023-10-20T10:00:00Z',
    assignedTo: 'admin_fixed',
    createdBy: 'admin_fixed',
    technicalReport: 'Ampoule LED remplacée par modèle E27 10W.',
    images: [],
    history: [
      { date: '2023-10-20T10:00:00Z', user: 'Lis Torres', action: 'CREATION' },
      { date: '2023-10-21T09:00:00Z', user: 'Lis Torres', action: 'STATUS_CHANGE', details: 'Clôturé' }
    ]
  }
];

export const MOCK_CHECKS: PeriodicCheck[] = [
  {
    id: 'ch1',
    clubId: 'c_comboire',
    space: 'Local Technique',
    trade: TradeType.ELECTRICITY,
    title: 'Vérification Tableau TGBT',
    frequencyMonths: 6,
    lastChecked: '2023-05-01T10:00:00Z',
    nextDueDate: '2023-11-01T00:00:00Z',
    status: CheckStatus.WARNING_WEEK,
    checklistItems: [
      { label: 'Serrage des borniers', checked: false },
      { label: 'Test différentiels', checked: false },
      { label: 'Dépoussiérage', checked: false }
    ],
    history: [
      { date: '2023-05-01T10:00:00Z', technicianName: 'Lis Torres', status: CheckStatus.COMPLETED, notes: 'RAS, dépoussiérage effectué.' },
      { date: '2022-11-02T14:30:00Z', technicianName: 'Lis Torres', status: CheckStatus.COMPLETED, notes: 'Remplacement fusible F4.' }
    ]
  },
  {
    id: 'ch2',
    clubId: 'c_grenoble',
    space: 'Vestiaires F',
    trade: TradeType.PLUMBING,
    title: 'Contrôle légionelle douches',
    frequencyMonths: 1,
    nextDueDate: '2023-10-15T00:00:00Z',
    status: CheckStatus.LATE,
    checklistItems: [
      { label: 'Relevé température eau chaude', checked: false },
      { label: 'Purge des points bas', checked: false }
    ],
    history: [
      { date: '2023-09-14T09:00:00Z', technicianName: 'Lis Torres', status: CheckStatus.COMPLETED },
      { date: '2023-08-15T10:00:00Z', technicianName: 'Lis Torres', status: CheckStatus.COMPLETED }
    ]
  }
];

export const MOCK_MAINTENANCE: MaintenanceEvent[] = [
  {
    id: 'm1',
    title: 'Remplacement des filtres CTA',
    date: new Date().toISOString().split('T')[0],
    description: 'Intervention prévue par prestataire externe.',
    notifyOnDashboard: true,
    clubId: 'c_comboire'
  },
  {
    id: 'm2',
    title: 'Peinture mur entrée',
    date: '2023-11-15',
    description: 'Rafraîchissement peinture suite dégâts des eaux.',
    notifyOnDashboard: false,
    clubId: 'c_grenoble'
  }
];

export const MOCK_DOCS: DocumentFile[] = [
  { id: 'd1', name: 'Plan Évacuation RDC', type: 'PLAN', url: 'https://picsum.photos/600/800', clubId: 'c_comboire', date: '2023-01-15' },
  { id: 'd2', name: 'Facture Maintenance CTA', type: 'INVOICE', url: 'https://picsum.photos/600/800', clubId: 'c_comboire', date: '2023-09-30' },
  { id: 'd3', name: 'Manuel Tapis Course', type: 'PDF', url: 'https://picsum.photos/600/800', clubId: 'c_meylan', date: '2022-11-20' },
  { id: 'd4', name: 'Devis Réfection Toiture', type: 'QUOTE', url: 'https://picsum.photos/600/800', clubId: 'c_grenoble', date: '2023-10-05' },
];

export const MOCK_ARTISANS: Artisan[] = [
  {
    id: 'a1',
    companyName: 'Elec Express',
    contactName: 'Jean Dupont',
    trade: TradeType.ELECTRICITY,
    phone: '06 12 34 56 78',
    email: 'contact@elecexpress.fr',
    address: '15 Rue de la Lumière, 75012 Paris',
    notes: 'Intervention rapide, tarif de nuit majoré.'
  },
  {
    id: 'a2',
    companyName: 'Plomberie Durand',
    contactName: 'Michel Durand',
    trade: TradeType.PLUMBING,
    phone: '06 98 76 54 32',
    email: 'm.durand@plomberie.com',
    address: '3 Avenue de l\'Eau, 69003 Lyon',
    notes: 'Contrat annuel pour les chauffe-eaux.'
  },
  {
    id: 'a3',
    companyName: 'Clim & Froid',
    contactName: 'Sarah Connor',
    trade: TradeType.HVAC,
    phone: '07 55 44 33 22',
    email: 'sarah@climfroid.fr',
    address: 'Zone Industrielle Nord, 69000 Lyon',
    notes: 'Spécialiste Daikin et Mitsubishi.'
  }
];

export const MOCK_SPECS: Specification[] = [
  {
    id: 's1',
    category: 'Plomberie',
    title: 'Mitigeur Lavabo Standard',
    brand: 'Grohe',
    partType: 'Eurosmart Cosmopolitan',
    installationType: 'Montage monotrou sur plage. Raccordement flexibles 3/8". Serrage par étrier sous vasque.',
    imageUrl: 'https://picsum.photos/300/300'
  },
  {
    id: 's2',
    category: 'Plomberie',
    title: 'Siphon de sol Douche',
    brand: 'Nicoll',
    partType: 'Docia Sol',
    installationType: 'Scellement dans la chape. Vérifier l\'étanchéité de la natte avant carrelage.',
    imageUrl: 'https://picsum.photos/301/301'
  },
  {
    id: 's3',
    category: 'Électricité',
    title: 'Spot LED Encastré',
    brand: 'Philips',
    partType: 'CoreLine SlimDownlight',
    installationType: 'Perçage scie cloche 150mm. Raccordement wago dans boîte de dérivation déportée. Clips ressort.',
    imageUrl: 'https://picsum.photos/302/302'
  },
  {
    id: 's4',
    category: 'Serrurerie',
    title: 'Ferme-porte hydraulique',
    brand: 'Geze',
    partType: 'TS 5000',
    installationType: 'Pose en applique sur dormant. Réglage vitesse de fermeture et à-coup final par vis latérales.',
    imageUrl: 'https://picsum.photos/303/303'
  }
];

export const MOCK_PLANNING_EVENTS: PlanningEvent[] = [
  {
    id: 'pe1',
    title: 'Livraison Matériel Muscu',
    date: new Date().toISOString().split('T')[0],
    startTime: '10:00',
    type: 'LIVRAISON',
    description: 'Livraison TechnoGym, palette à réceptionner à l\'entrée.',
    alert: true,
    createdBy: 'admin_fixed'
  },
  {
    id: 'pe2',
    title: 'RDV Société Nettoyage',
    date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    startTime: '14:00',
    type: 'RDV',
    description: 'Point mensuel sur la qualité du nettoyage.',
    alert: false,
    createdBy: 'admin_fixed'
  }
];
