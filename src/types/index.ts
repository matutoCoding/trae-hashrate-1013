export interface Actor {
  id: string;
  name: string;
  code: string;
  gender: 'male' | 'female';
  age: number;
  heightCm: number;
  weightKg: number;
  maxLoadKg: number;
  shoulderWidthCm: number;
  notes?: string;
  createdAt: string;
}

export interface Position {
  id: string;
  layer: number;
  index: number;
  actorId?: string;
  relativeX: number;
}

export interface Formation {
  id: string;
  name: string;
  layers: number;
  difficulty: 'easy' | 'normal' | 'hard' | 'extreme';
  positions: Position[];
  createdAt: string;
  updatedAt: string;
}

export interface LoadResult {
  positionId: string;
  layer: number;
  index: number;
  selfWeight: number;
  cumulativeLoad: number;
  maxCapacity: number;
  loadRatio: number;
  isOverloaded: boolean;
  impactLoad: number;
}

export interface StabilityResult {
  centerX: number;
  centerY: number;
  totalWeight: number;
  isWithinPolygon: boolean;
  polygonVertices: { x: number; y: number }[];
  deviationDistance: number;
  topHeavyRatio: number;
  symmetryScore: number;
  layerWeights: { layer: number; weight: number; height: number }[];
}

export interface WarningItem {
  id: string;
  level: 'info' | 'warning' | 'danger';
  type: 'overload' | 'eccentric' | 'top_heavy' | 'symmetry' | 'impact' | 'missing';
  message: string;
  positionId?: string;
}

export interface SafetyRating {
  grade: 'A' | 'B' | 'C' | 'D';
  score: number;
  warnings: WarningItem[];
}

export interface TrainingRecord {
  id: string;
  formationId: string;
  formationSnapshot: Formation;
  trainingDate: string;
  durationMinutes?: number;
  actualWarnings: WarningItem[];
  notes?: string;
  safetyRating: SafetyRating;
}

export interface SafeScheme {
  id: string;
  name: string;
  formationSnapshot: Formation;
  safetyRating: SafetyRating;
  verifiedAt: string;
  notes?: string;
  totalActors: number;
  totalWeight: number;
}
