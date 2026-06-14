import { useState, useMemo } from 'react';
import { Layers, Plus, Trash2, ChevronDown, User as UserIcon, X, Settings2, ShieldCheck } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import { useAppStore } from '@/store';
import { calculateLoads, calculateStability, generateWarnings, calculateSafetyRating } from '@/utils/physics';
import type { Formation as FormationType, Position } from '@/types';

const difficultyLabels: Record<FormationType['difficulty'], string> = {
  easy: '简单',
  normal: '普通',
  hard: '困难',
  extreme: '极限',
};

export default function Formation() {
  const { actors, formations, currentFormationId, setCurrentFormation, createFormation, updateFormation, deleteFormation, assignActorToPosition, addSafeScheme } = useAppStore();
  const [selectedPos, setSelectedPos] = useState<string | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newLayers, setNewLayers] = useState(3);
  const [newDiff, setNewDiff] = useState<FormationType['difficulty']>('normal');
  const [showSaveScheme, setShowSaveScheme] = useState(false);
  const [schemeName, setSchemeName] = useState('');
  const [schemeNotes, setSchemeNotes] = useState('');

  const formation = formations.find((f) => f.id === currentFormationId) || null;

  const layers: Position[][] = [];
  if (formation) {
    const maxLayer = formation.positions.reduce((m, p) => Math.max(m, p.layer), 0);
    for (let l = 0; l <= maxLayer; l++) {
      layers.push(formation.positions.filter((p) => p.layer === l).sort((a, b) => a.index - b.index));
    }
  }

  const handleCreate = () => {
    if (!newName.trim()) return;
    createFormation(newName.trim(), newLayers, newDiff);
    setShowNewForm(false);
    setNewName('');
    setNewLayers(3);
    setNewDiff('normal');
  };

  const handleSelectActor = (positionId: string, actorId: string | null) => {
    if (!formation) return;
    assignActorToPosition(formation.id, positionId, actorId);
    setSelectedPos(null);
  };

  const getActor = (id?: string) => actors.find((a) => a.id === id);
  const usedActorIds = new Set(formation?.positions.filter((p) => p.actorId).map((p) => p.actorId!) || []);

  const { canSaveScheme, safetyRating, stability } = useMemo(() => {
    if (!formation) return { canSaveScheme: false, safetyRating: null, stability: null };
    const L = calculateLoads(formation, actors);
    const S = calculateStability(formation, actors);
    const W = generateWarnings(L, S, formation, actors);
    const R = calculateSafetyRating(L, S, W, formation.difficulty);
    const allAssigned = formation.positions.every((p) => p.actorId);
    const noDanger = W.filter((w) => w.level === 'danger').length === 0;
    const gradeOk = R.grade === 'A' || R.grade === 'B';
    return { canSaveScheme: allAssigned && noDanger && gradeOk, safetyRating: R, stability: S };
  }, [formation, actors]);

  const handleSaveScheme = () => {
    if (!formation || !safetyRating || !canSaveScheme) return;
    const name = schemeName.trim() || formation.name;
    const totalActors = formation.positions.filter((p) => p.actorId).length;
    addSafeScheme({
      name,
      formationSnapshot: JSON.parse(JSON.stringify(formation)),
      safetyRating,
      totalActors,
      totalWeight: stability?.totalWeight ?? 0,
      notes: schemeNotes.trim() || undefined,
    });
    setShowSaveScheme(false);
    setSchemeName('');
    setSchemeNotes('');
    alert('安全方案已保存到方案库');
  };

  const openSaveScheme = () => {
    setSchemeName(formation?.name || '');
    setSchemeNotes('');
    setShowSaveScheme(true);
  };

  return (
    <div className="p-8">
      <PageHeader
        title="队形搭建"
        subtitle="可视化金字塔队形编排与演员分配"
        icon={<Layers className="w-6 h-6 text-safety-gold" />}
        actions={
          <div className="flex gap-2">
            <div className="relative">
              <select
                value={currentFormationId || ''}
                onChange={(e) => setCurrentFormation(e.target.value || null)}
                className="input-field pr-10 appearance-none cursor-pointer"
              >
                {formations.map((f) => (
                  <option key={f.id} value={f.id}>{f.name} · {f.layers}层</option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-navy-400 pointer-events-none" />
            </div>
            {formation && (
              <button
                onClick={openSaveScheme}
                disabled={!canSaveScheme}
                className={`flex items-center gap-2 ${canSaveScheme ? 'btn-gold' : 'btn-ghost opacity-50 cursor-not-allowed'}`}
              >
                <ShieldCheck className="w-4 h-4" />
                保存为安全方案
              </button>
            )}
            <button onClick={() => setShowNewForm(true)} className="btn-primary flex items-center gap-2">
              <Plus className="w-4 h-4" />
              <span>新建队形</span>
            </button>
            {formation && formations.length > 1 && (
              <button
                onClick={() => { if (confirm('确定删除该队形?')) deleteFormation(formation.id); }}
                className="btn-danger flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        }
      />

      {formation ? (
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 lg:col-span-4 glass-card rounded-xl p-5 space-y-4">
            <h3 className="font-semibold text-navy-50 flex items-center gap-2">
              <Settings2 className="w-4 h-4 text-safety-gold" />
              队形参数
            </h3>
            <div>
              <label className="label">队形名称</label>
              <input className="input-field" value={formation.name} onChange={(e) => updateFormation(formation.id, { name: e.target.value })} />
            </div>
            <div>
              <label className="label">难度等级</label>
              <select
                className="input-field"
                value={formation.difficulty}
                onChange={(e) => updateFormation(formation.id, { difficulty: e.target.value as FormationType['difficulty'] })}
              >
                <option value="easy">简单</option>
                <option value="normal">普通</option>
                <option value="hard">困难</option>
                <option value="extreme">极限</option>
              </select>
            </div>
            <div className="pt-2 border-t border-navy-700/40 text-sm text-navy-300 space-y-1">
              <div className="flex justify-between"><span>层数</span><span className="text-navy-100 font-medium">{formation.layers}层</span></div>
              <div className="flex justify-between"><span>总位置数</span><span className="text-navy-100 font-medium">{formation.positions.length}个</span></div>
              <div className="flex justify-between"><span>已分配</span><span className="text-safety-green font-medium">{formation.positions.filter(p => p.actorId).length}人</span></div>
              <div className="flex justify-between"><span>难度</span><span className="text-safety-gold font-medium">{difficultyLabels[formation.difficulty]}</span></div>
            </div>
          </div>

          <div className="col-span-12 lg:col-span-8">
            <div className="glass-card rounded-xl p-8 grid-bg min-h-[520px] relative overflow-hidden">
              <div className="flex flex-col-reverse items-center gap-6">
                {layers.map((layer, layerIdx) => (
                  <div key={layerIdx} className="flex gap-3 justify-center">
                    {layer.map((pos) => {
                      const actor = getActor(pos.actorId);
                      const isSelected = selectedPos === pos.id;
                      return (
                        <div
                          key={pos.id}
                          onClick={() => setSelectedPos(isSelected ? null : pos.id)}
                          className={`relative cursor-pointer transition-all duration-300 ${isSelected ? 'scale-105' : ''}`}
                        >
                          <div
                            className={`w-24 h-28 rounded-xl flex flex-col items-center justify-center transition-all ${
                              actor
                                ? isSelected
                                  ? 'gold-border bg-safety-gold/10 shadow-glow-gold'
                                  : 'bg-navy-700/60 border border-navy-500/30 hover:border-safety-gold/40'
                                : isSelected
                                  ? 'gold-border bg-safety-gold/5 border-dashed'
                                  : 'bg-navy-900/40 border border-dashed border-navy-600/40 hover:border-navy-400/60'
                            }`}
                          >
                            {actor ? (
                              <>
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-1 ${actor.gender === 'female' ? 'bg-gradient-to-br from-navy-300 to-navy-500' : 'bg-gradient-to-br from-navy-500 to-navy-700'}`}>
                                  <UserIcon className="w-5 h-5 text-white" />
                                </div>
                                <div className="text-sm font-semibold text-navy-50">{actor.name}</div>
                                <div className="text-[10px] text-navy-300">{actor.weightKg}kg · {actor.maxLoadKg}kg</div>
                              </>
                            ) : (
                              <>
                                <Plus className="w-6 h-6 text-navy-500 mb-1" />
                                <div className="text-xs text-navy-400">空位</div>
                              </>
                            )}
                          </div>
                          <div className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded text-[10px] bg-navy-900/80 text-navy-300 border border-navy-600/40">
                            L{layerIdx + 1}-{pos.index + 1}
                          </div>
                          {isSelected && actor && (
                            <button
                              onClick={(e) => { e.stopPropagation(); handleSelectActor(pos.id, null); }}
                              className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-safety-red flex items-center justify-center hover:scale-110 transition-transform"
                            >
                              <X className="w-3.5 h-3.5 text-white" />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>

              {selectedPos && (
                <div className="absolute bottom-0 left-0 right-0 bg-navy-900/90 backdrop-blur-md border-t border-navy-700/50 p-4 animate-[pageEnter_0.3s_ease-out]">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-sm text-navy-200">选择演员分配到此位置</div>
                    <button onClick={() => setSelectedPos(null)} className="text-navy-400 hover:text-navy-200">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {actors.filter((a) => !usedActorIds.has(a.id) || formation.positions.find((p) => p.id === selectedPos)?.actorId === a.id).map((actor) => (
                      <button
                        key={actor.id}
                        onClick={() => handleSelectActor(selectedPos, actor.id)}
                        className="shrink-0 glass-card rounded-xl p-3 hover:border-safety-gold/50 transition-colors text-left w-40"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center ${actor.gender === 'female' ? 'bg-gradient-to-br from-navy-300 to-navy-500' : 'bg-gradient-to-br from-navy-500 to-navy-700'}`}>
                            <UserIcon className="w-4 h-4 text-white" />
                          </div>
                          <div className="font-medium text-navy-50 text-sm">{actor.name}</div>
                        </div>
                        <div className="text-xs text-navy-400">{actor.code} · {actor.weightKg}kg</div>
                        <div className="text-xs text-safety-gold mt-1">承重上限 {actor.maxLoadKg}kg</div>
                      </button>
                    ))}
                    {actors.length === 0 && (
                      <div className="text-navy-400 text-sm py-4 px-2">请先在「演员录入」中添加演员</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="glass-card rounded-xl p-16 text-center">
          <Layers className="w-16 h-16 mx-auto text-navy-600 mb-4" />
          <p className="text-navy-300 mb-4">暂无队形数据</p>
          <button onClick={() => setShowNewForm(true)} className="btn-gold">点击新建队形</button>
        </div>
      )}

      {showNewForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-card rounded-2xl p-6 w-full max-w-md">
            <h3 className="font-display text-xl text-navy-50 mb-6">新建队形</h3>
            <div className="space-y-4">
              <div>
                <label className="label">队形名称</label>
                <input className="input-field" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="如: 四层经典金字塔" />
              </div>
              <div>
                <label className="label">层数 ({newLayers}层)</label>
                <input type="range" min={2} max={6} value={newLayers} onChange={(e) => setNewLayers(+e.target.value)} className="w-full accent-safety-gold" />
              </div>
              <div>
                <label className="label">难度等级</label>
                <select className="input-field" value={newDiff} onChange={(e) => setNewDiff(e.target.value as FormationType['difficulty'])}>
                  <option value="easy">简单</option>
                  <option value="normal">普通</option>
                  <option value="hard">困难</option>
                  <option value="extreme">极限</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 justify-end mt-6">
              <button onClick={() => setShowNewForm(false)} className="btn-ghost">取消</button>
              <button onClick={handleCreate} className="btn-gold">创建</button>
            </div>
          </div>
        </div>
      )}

      {showSaveScheme && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-card rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-display text-xl text-navy-50">保存为安全方案</h3>
              <button onClick={() => setShowSaveScheme(false)} className="p-2 rounded-lg hover:bg-navy-700/50 text-navy-300">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="label">方案名称</label>
                <input className="input-field" value={schemeName} onChange={(e) => setSchemeName(e.target.value)} />
              </div>
              <div>
                <label className="label">备注（可选）</label>
                <textarea className="input-field h-20 resize-none" value={schemeNotes} onChange={(e) => setSchemeNotes(e.target.value)} />
              </div>
              <div className="bg-safety-green/10 border border-safety-green/30 rounded-lg p-3 text-sm text-safety-green">
                <div className="font-medium mb-1">✓ 符合入库条件</div>
                <div className="text-xs opacity-80">该队形已通过安全校核，将存入方案库</div>
              </div>
            </div>
            <div className="flex gap-3 justify-end mt-6">
              <button onClick={() => setShowSaveScheme(false)} className="btn-ghost">取消</button>
              <button onClick={handleSaveScheme} className="btn-gold">保存方案</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
