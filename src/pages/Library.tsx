import { useMemo, useState, useRef } from 'react';
import { Database, Trash2, Download, Upload, FileText, Calendar, Users, Layers, ChevronRight, Eye, X, ClipboardList } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import RatingBadge from '@/components/RatingBadge';
import { useAppStore } from '@/store';
import { calculateLoads, calculateStability, generateWarnings, calculateSafetyRating } from '@/utils/physics';
import type { Formation, Position } from '@/types';

type Tab = 'formations' | 'records';

const difficultyLabels: Record<Formation['difficulty'], { label: string; color: string }> = {
  easy: { label: '简单', color: '#2A9D8F' },
  normal: { label: '普通', color: '#E9C46A' },
  hard: { label: '困难', color: '#F4A261' },
  extreme: { label: '极限', color: '#E63946' },
};

function MiniFormationPreview({ formation }: { formation: Formation }) {
  const layers: Position[][] = [];
  const maxLayer = formation.positions.reduce((m, p) => Math.max(m, p.layer), 0);
  for (let l = 0; l <= maxLayer; l++) {
    layers.push(formation.positions.filter((p) => p.layer === l).sort((a, b) => a.index - b.index));
  }
  return (
    <svg viewBox="-60 -60 120 110" className="w-full h-full">
      {[...layers].reverse().map((layer, li) => {
        const layerIdx = layers.length - 1 - li;
        const y = layerIdx * 22 - 45;
        const startX = -((layer.length - 1) * 14);
        return layer.map((_, i) => {
          const hasActor = formation.positions.find(p => p.layer === layerIdx && p.index === i)?.actorId;
          return (
            <rect
              key={`${layerIdx}-${i}`}
              x={startX + i * 28 - 10}
              y={y}
              width="20" height="18" rx="3"
              fill={hasActor ? '#355a90' : '#1a2f4d'}
              stroke={hasActor ? '#87a2c8' : '#264775'}
              strokeWidth="0.8"
              opacity={hasActor ? 1 : 0.6}
            />
          );
        });
      })}
    </svg>
  );
}

export default function Library() {
  const { actors, formations, trainingRecords, setCurrentFormation, deleteFormation, deleteTrainingRecord, importData } = useAppStore();
  const [tab, setTab] = useState<Tab>('formations');
  const [detailId, setDetailId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const formationRatings = useMemo(() => {
    const map = new Map<string, ReturnType<typeof calculateSafetyRating>>();
    for (const f of formations) {
      const L = calculateLoads(f, actors);
      const S = calculateStability(f, actors);
      const W = generateWarnings(L, S, f, actors);
      map.set(f.id, calculateSafetyRating(L, S, W, f.difficulty));
    }
    return map;
  }, [formations, actors]);

  const handleExport = () => {
    const data = { actors, formations, trainingRecords, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `acrobat-safety-data-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        importData(data);
        alert('导入成功');
      } catch {
        alert('文件格式错误');
      }
    };
    reader.readAsText(file);
    if (fileRef.current) fileRef.current.value = '';
  };

  const detailFormation = detailId && tab === 'formations' ? formations.find((f) => f.id === detailId) : null;
  const detailRecord = detailId && tab === 'records' ? trainingRecords.find((r) => r.id === detailId) : null;
  const detailRating = detailFormation ? formationRatings.get(detailFormation.id) : detailRecord?.safetyRating;

  return (
    <div className="p-8">
      <PageHeader
        title="方案库"
        subtitle="已验证安全队形方案存档与训练历史记录"
        icon={<Database className="w-6 h-6 text-safety-gold" />}
        actions={
          <div className="flex gap-2">
            <input ref={fileRef} type="file" accept="application/json" onChange={handleImport} className="hidden" />
            <button onClick={() => fileRef.current?.click()} className="btn-ghost flex items-center gap-2">
              <Upload className="w-4 h-4" />导入
            </button>
            <button onClick={handleExport} className="btn-primary flex items-center gap-2">
              <Download className="w-4 h-4" />导出全部数据
            </button>
          </div>
        }
      />

      <div className="flex gap-1 mb-6 bg-navy-900/50 p-1 rounded-xl w-fit border border-navy-700/40">
        <button
          onClick={() => { setTab('formations'); setDetailId(null); }}
          className={`px-5 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${tab === 'formations' ? 'bg-gradient-to-r from-navy-500 to-navy-600 text-white shadow-md' : 'text-navy-300 hover:text-navy-100'}`}
        >
          <Layers className="w-4 h-4" />
          队形方案 ({formations.length})
        </button>
        <button
          onClick={() => { setTab('records'); setDetailId(null); }}
          className={`px-5 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${tab === 'records' ? 'bg-gradient-to-r from-navy-500 to-navy-600 text-white shadow-md' : 'text-navy-300 hover:text-navy-100'}`}
        >
          <ClipboardList className="w-4 h-4" />
          训练档案 ({trainingRecords.length})
        </button>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-7">
          {tab === 'formations' && (
            formations.length === 0 ? (
              <div className="glass-card rounded-xl p-16 text-center">
                <Layers className="w-16 h-16 mx-auto text-navy-600 mb-4" />
                <p className="text-navy-300">暂无队形方案，请到「队形搭建」中创建</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {formations.map((f) => {
                  const rating = formationRatings.get(f.id)!;
                  const diff = difficultyLabels[f.difficulty];
                  const assignedCount = f.positions.filter(p => p.actorId).length;
                  return (
                    <div
                      key={f.id}
                      className={`glass-card rounded-xl p-4 cursor-pointer transition-all hover:border-safety-gold/40 ${detailId === f.id ? 'gold-border' : ''}`}
                      onClick={() => setDetailId(f.id)}
                    >
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="w-16 h-16 shrink-0 bg-navy-900/60 rounded-lg border border-navy-700/40 overflow-hidden">
                          <MiniFormationPreview formation={f} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-navy-50 truncate">{f.name}</div>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className="badge" style={{ background: `${diff.color}22`, color: diff.color, border: `1px solid ${diff.color}55` }}>
                              {diff.label}
                            </span>
                            <span className="badge bg-navy-700/50 text-navy-200 border border-navy-600/40">
                              {f.layers}层
                            </span>
                            <span className="badge bg-navy-700/50 text-navy-200 border border-navy-600/40">
                              <Users className="w-3 h-3" />{assignedCount}/{f.positions.length}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <RatingBadge rating={rating} size="sm" />
                        <div className="flex items-center gap-1 text-navy-400 text-xs">
                          <Calendar className="w-3 h-3" />
                          {new Date(f.createdAt).toLocaleDateString('zh-CN')}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          )}

          {tab === 'records' && (
            trainingRecords.length === 0 ? (
              <div className="glass-card rounded-xl p-16 text-center">
                <ClipboardList className="w-16 h-16 mx-auto text-navy-600 mb-4" />
                <p className="text-navy-300">暂无训练记录，可在「失稳预警」中记录训练</p>
              </div>
            ) : (
              <div className="space-y-3">
                {trainingRecords.map((r) => {
                  const f = r.formationSnapshot;
                  return (
                    <div
                      key={r.id}
                      className={`glass-card rounded-xl p-4 cursor-pointer transition-all hover:border-safety-gold/40 ${detailId === r.id ? 'gold-border' : ''}`}
                      onClick={() => setDetailId(r.id)}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 shrink-0 rounded-lg bg-navy-800/60 border border-navy-700/40 flex items-center justify-center">
                          <FileText className="w-6 h-6 text-safety-gold" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-navy-50">{f.name}</div>
                          <div className="text-xs text-navy-400 flex items-center gap-2 mt-0.5">
                            <Calendar className="w-3 h-3" />
                            {new Date(r.trainingDate).toLocaleString('zh-CN')}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <RatingBadge rating={r.safetyRating} size="sm" />
                          <ChevronRight className="w-4 h-4 text-navy-500" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          )}
        </div>

        <div className="col-span-12 lg:col-span-5">
          {(detailFormation || detailRecord) && detailRating ? (
            <div className="glass-card rounded-xl p-6 sticky top-8">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-display text-lg text-navy-50">
                    {tab === 'formations' ? detailFormation!.name : detailRecord!.formationSnapshot.name}
                  </h3>
                  <p className="text-xs text-navy-400 mt-0.5">
                    {tab === 'formations'
                      ? `创建于 ${new Date(detailFormation!.createdAt).toLocaleString('zh-CN')}`
                      : `训练于 ${new Date(detailRecord!.trainingDate).toLocaleString('zh-CN')}`}
                  </p>
                </div>
                <div className="flex gap-1">
                  {tab === 'formations' && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setCurrentFormation(detailFormation!.id); }}
                      className="p-2 rounded-lg hover:bg-navy-700/50 text-navy-300 hover:text-safety-gold transition-colors"
                      title="应用此方案"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm('确定删除?')) {
                        if (tab === 'formations') deleteFormation(detailFormation!.id);
                        else deleteTrainingRecord(detailRecord!.id);
                        setDetailId(null);
                      }
                    }}
                    className="p-2 rounded-lg hover:bg-navy-700/50 text-navy-300 hover:text-safety-red transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setDetailId(null); }}
                    className="p-2 rounded-lg hover:bg-navy-700/50 text-navy-300 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="mb-4">
                <RatingBadge rating={detailRating} size="md" />
              </div>

              {tab === 'formations' && (
                <div className="text-sm text-navy-300 space-y-1.5 mb-4 pb-4 border-b border-navy-700/40">
                  <div className="flex justify-between"><span>层数</span><span className="text-navy-100 font-medium">{detailFormation!.layers}</span></div>
                  <div className="flex justify-between"><span>难度</span><span style={{ color: difficultyLabels[detailFormation!.difficulty].color }} className="font-medium">{difficultyLabels[detailFormation!.difficulty].label}</span></div>
                  <div className="flex justify-between"><span>位置数</span><span className="text-navy-100 font-medium">{detailFormation!.positions.length}</span></div>
                  <div className="flex justify-between"><span>已分配演员</span><span className="text-navy-100 font-medium">{detailFormation!.positions.filter(p => p.actorId).length}</span></div>
                </div>
              )}

              <div>
                <h4 className="text-sm font-semibold text-navy-200 mb-3">
                  风险告警 ({detailRating.warnings.length})
                </h4>
                {detailRating.warnings.length === 0 ? (
                  <div className="text-sm text-navy-400 text-center py-6 bg-navy-900/40 rounded-lg">无告警，队形安全</div>
                ) : (
                  <div className="space-y-2 max-h-80 overflow-auto">
                    {detailRating.warnings.map((w) => {
                      const colors = {
                        danger: { bg: 'rgba(230, 57, 70, 0.12)', text: '#E63946', border: 'rgba(230, 57, 70, 0.3)' },
                        warning: { bg: 'rgba(244, 162, 97, 0.12)', text: '#F4A261', border: 'rgba(244, 162, 97, 0.3)' },
                        info: { bg: 'rgba(42, 157, 143, 0.12)', text: '#2A9D8F', border: 'rgba(42, 157, 143, 0.3)' },
                      }[w.level];
                      return (
                        <div key={w.id} className="rounded-lg p-3 text-sm" style={{ background: colors.bg, border: `1px solid ${colors.border}`, color: colors.text }}>
                          {w.message}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="glass-card rounded-xl p-12 text-center">
              <Database className="w-12 h-12 mx-auto text-navy-600 mb-3" />
              <p className="text-navy-400 text-sm">点击左侧卡片查看详情</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
