import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Actor, Formation, TrainingRecord, SafeScheme, SafetyRating } from '@/types';
import { generateId, buildPyramidFormation } from '@/utils/physics';

interface AppState {
  actors: Actor[];
  formations: Formation[];
  safeSchemes: SafeScheme[];
  trainingRecords: TrainingRecord[];
  currentFormationId: string | null;

  addActor: (data: Omit<Actor, 'id' | 'createdAt'>) => void;
  updateActor: (id: string, data: Partial<Actor>) => void;
  deleteActor: (id: string) => void;

  createFormation: (name: string, layers: number, difficulty: Formation['difficulty']) => Formation;
  updateFormation: (id: string, data: Partial<Formation>) => void;
  deleteFormation: (id: string) => void;
  setCurrentFormation: (id: string | null) => void;
  assignActorToPosition: (formationId: string, positionId: string, actorId: string | null) => void;

  addSafeScheme: (scheme: Omit<SafeScheme, 'id' | 'verifiedAt'>) => void;
  deleteSafeScheme: (id: string) => void;

  addTrainingRecord: (record: Omit<TrainingRecord, 'id'>) => void;
  deleteTrainingRecord: (id: string) => void;

  importData: (data: { actors?: Actor[]; formations?: Formation[]; safeSchemes?: SafeScheme[]; trainingRecords?: TrainingRecord[] }) => void;
  clearAllData: () => void;
}

const sampleActors: Actor[] = [
  { id: generateId(), name: '张大勇', code: 'A001', gender: 'male', age: 28, heightCm: 178, weightKg: 72, maxLoadKg: 150, shoulderWidthCm: 44, createdAt: new Date().toISOString() },
  { id: generateId(), name: '李志强', code: 'A002', gender: 'male', age: 30, heightCm: 180, weightKg: 75, maxLoadKg: 160, shoulderWidthCm: 45, createdAt: new Date().toISOString() },
  { id: generateId(), name: '王铁柱', code: 'A003', gender: 'male', age: 26, heightCm: 175, weightKg: 70, maxLoadKg: 140, shoulderWidthCm: 43, createdAt: new Date().toISOString() },
  { id: generateId(), name: '陈小梅', code: 'A004', gender: 'female', age: 22, heightCm: 165, weightKg: 52, maxLoadKg: 80, shoulderWidthCm: 38, createdAt: new Date().toISOString() },
  { id: generateId(), name: '赵小云', code: 'A005', gender: 'female', age: 21, heightCm: 162, weightKg: 48, maxLoadKg: 70, shoulderWidthCm: 37, createdAt: new Date().toISOString() },
  { id: generateId(), name: '刘鹏飞', code: 'A006', gender: 'male', age: 24, heightCm: 170, weightKg: 62, maxLoadKg: 100, shoulderWidthCm: 41, createdAt: new Date().toISOString() },
];

const defaultFormation: Formation = {
  id: generateId(),
  name: '三层基础塔',
  layers: 3,
  difficulty: 'normal',
  positions: buildPyramidFormation(3),
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      actors: sampleActors,
      formations: [defaultFormation],
      safeSchemes: [],
      trainingRecords: [],
      currentFormationId: defaultFormation.id,

      addActor: (data) =>
        set((s) => {
          const actor: Actor = { ...data, id: generateId(), createdAt: new Date().toISOString() };
          return { actors: [...s.actors, actor] };
        }),

      updateActor: (id, data) =>
        set((s) => ({
          actors: s.actors.map((a) => (a.id === id ? { ...a, ...data } : a)),
        })),

      deleteActor: (id) =>
        set((s) => ({
          actors: s.actors.filter((a) => a.id !== id),
        })),

      createFormation: (name, layers, difficulty) => {
        const f: Formation = {
          id: generateId(),
          name,
          layers,
          difficulty,
          positions: buildPyramidFormation(layers),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set((s) => ({ formations: [...s.formations, f], currentFormationId: f.id }));
        return f;
      },

      updateFormation: (id, data) =>
        set((s) => ({
          formations: s.formations.map((f) => (f.id === id ? { ...f, ...data, updatedAt: new Date().toISOString() } : f)),
        })),

      deleteFormation: (id) =>
        set((s) => {
          const formations = s.formations.filter((f) => f.id !== id);
          return {
            formations,
            currentFormationId: s.currentFormationId === id ? formations[0]?.id ?? null : s.currentFormationId,
          };
        }),

      setCurrentFormation: (id) => set({ currentFormationId: id }),

      assignActorToPosition: (formationId, positionId, actorId) =>
        set((s) => ({
          formations: s.formations.map((f) => {
            if (f.id !== formationId) return f;
            return {
              ...f,
              positions: f.positions.map((p) => (p.id === positionId ? { ...p, actorId: actorId ?? undefined } : p)),
              updatedAt: new Date().toISOString(),
            };
          }),
        })),

      addSafeScheme: (scheme) =>
        set((s) => ({
          safeSchemes: [
            { ...scheme, id: generateId(), verifiedAt: new Date().toISOString() },
            ...s.safeSchemes,
          ],
        })),

      deleteSafeScheme: (id) =>
        set((s) => ({
          safeSchemes: s.safeSchemes.filter((sc) => sc.id !== id),
        })),

      addTrainingRecord: (record) =>
        set((s) => ({
          trainingRecords: [
            { ...record, id: generateId() },
            ...s.trainingRecords,
          ],
        })),

      deleteTrainingRecord: (id) =>
        set((s) => ({
          trainingRecords: s.trainingRecords.filter((r) => r.id !== id),
        })),

      importData: (data) =>
        set((s) => ({
          actors: data.actors ?? s.actors,
          formations: data.formations ?? s.formations,
          safeSchemes: data.safeSchemes ?? s.safeSchemes,
          trainingRecords: data.trainingRecords ?? s.trainingRecords,
        })),

      clearAllData: () => set({ actors: [], formations: [], safeSchemes: [], trainingRecords: [], currentFormationId: null }),
    }),
    {
      name: 'acrobat-safety-app-storage',
    },
  ),
);

export function getCurrentFormation(state: AppState): Formation | null {
  if (!state.currentFormationId) return null;
  return state.formations.find((f) => f.id === state.currentFormationId) ?? null;
}
