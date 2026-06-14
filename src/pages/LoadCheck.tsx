import { useMemo } from 'react';
import { Scale, AlertTriangle, CheckCircle2, User as UserIcon, Zap, Activity } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import { useAppStore } from '@/store';
import { calculateLoads } from '@/utils/physics';
import type { Position } from '@/types';

export default function LoadCheck() {
  const { actors, formations, currentFormationId } = useAppStore();
  const formation = formations.find((f) => f.id === currentFormationId) || null;

  const loads = useMemo(() => {
    if (!formation) return [];
    return calculateLoads(formation, actors);
  }, [formation, actors]);

  const layers: Position[][] = [];
  if (formation) {
    const maxLayer = formation.positions.reduce((m, p) => Math.max(m, p.layer), 0);
    for (let l = 0; l <= maxLayer; l++) {
      layers.push(formation.positions.filter((p) => p.layer === l).sort((a, b) => a.index - b.index));
    }
  }

  const getLoad = (posId: string) => loads.find((l) => l.positionId === posId);
  const getActor = (id?: string) => actors.find((a) => a.id === id);

  const overloadedCount = loads.filter((l) => l.isOverloaded).length;
  const warningCount = loads.filter((l) => !l.isOverloaded && l.loadRatio > 0.85 && l.maxCapacity > 0).length;
  const safeCount = loads.filter((l) => l.maxCapacity > 0 && l.loadRatio <= 0.85).length;
  const totalLoad = loads.filter((l) => l.layer === 0).reduce((s, l) => s + l.cumulativeLoad, 0);
  const totalMaxBase = loads.filter((l) => l.layer === 0).reduce((s, l) => s + l.maxCapacity, 0);

  const baseLoads = loads.filter((l) => l.layer === 0);
  const half = Math.ceil(baseLoads.length / 2);
  const leftTotal = baseLoads.slice(0, half).reduce((s, l) => s + l.cumulativeLoad, 0);
  const rightTotal = baseLoads.slice(-half).reduce((s, l) => s + l.cumulativeLoad, 0);
  const symDiff = Math.abs(leftTotal - rightTotal);
  const symScore = leftTotal + rightTotal > 0 ? Math.max(0, 100 - (symDiff / ((leftTotal + rightTotal) / 2)) * 100) : 100;

  const getColor = (ratio: number) => {
    if (ratio > 1) return { text: '#E63946', bg: 'rgba(230, 57, 70, 0.15)', stroke: '#E63946' };
    if (ratio > 0.85) return { text: '#F4A261', bg: 'rgba(244, 162, 97, 0.15)', stroke: '#F4A261' };
    return { text: '#2A9D8F', bg: 'rgba(42, 157, 143, 0.15)', stroke: '#2A9D8F' };
  };

  return (
    <div className="p-8">
      <PageHeader
        title="承重校核"
        subtitle="逐层荷载传递计算与安全阈值校验"
        icon={<Scale className="w-6 h-6 text-safety-gold" />}
      />

      {formation ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="glass-card rounded-xl p-5">
              <div className="flex items-center gap-2 text-sm text-navy-300 mb-2">
                <CheckCircle2 className="w-4 h-4 text-safety-green" />
                安全位置
              </div>
              <div className="text-3xl font-bold text-safety-green font-display">{safeCount}</div>
            </div>
            <div className="glass-card rounded-xl p-5">
              <div className="flex items-center gap-2 text-sm text-navy-300 mb-2">
                <AlertTriangle className="w-4 h-4 text-safety-orange" />
                接近上限
              </div>
              <div className="text-3xl font-bold text-safety-orange font-display">{warningCount}</div>
            </div>
            <div className="glass-card rounded-xl p-5">
              <div className="flex items-center gap-2 text-sm text-navy-300 mb-2">
                <AlertTriangle className="w-4 h-4 text-safety-red" />
                超载危险
              </div>
              <div className={`text-3xl font-bold font-display ${overloadedCount > 0 ? 'text-safety-red danger-glow rounded-lg inline-block px-2' : 'text-navy-500'}`}>{overloadedCount}</div>
            </div>
            <div className="glass-card rounded-xl p-5">
              <div className="flex items-center gap-2 text-sm text-navy-300 mb-2">
                <Activity className="w-4 h-4 text-safety-gold" />
                底座受力对称度
              </div>
              <div className={`text-3xl font-bold font-display ${symScore >= 80 ? 'text-safety-green' : symScore >= 60 ? 'text-safety-orange' : 'text-safety-red'}`}>
                {symScore.toFixed(0)}<span className="text-lg font-normal text-navy-400 ml-1">分</span>
              </div>
            </div>
          </div>

          <div className="glass-card rounded-xl p-8 grid-bg min-h-[560px]">
            <div className="flex flex-col-reverse items-center gap-6">
              {layers.map((layer, layerIdx) => (
                <div key={layerIdx} className="flex gap-4 justify-center items-end">
                  {layer.map((pos) => {
                    const load = getLoad(pos.id);
                    const actor = getActor(pos.actorId);
                    const ratio = load?.loadRatio || 0;
                    const color = getColor(ratio);
                    const isDanger = load?.isOverloaded;
                    const circumference = 2 * Math.PI * 26;
                    const offset = circumference - Math.min(ratio, 1.2) * circumference;

                    return (
                      <div key={pos.id} className="flex flex-col items-center">
                        <div
                          className={`relative w-32 rounded-2xl p-4 transition-all ${
                            isDanger ? 'danger-glow' : ''
                          }`}
                          style={{
                            background: color.bg,
                            border: `1.5px solid ${color.stroke}${isDanger ? '' : '66'}`,
                          }}
                        >
                          <svg className="w-full aspect-square mb-2" viewBox="0 0 64 64">
                            <circle cx="32" cy="32" r="26" stroke="rgba(135,162,200,0.15)" strokeWidth="5" fill="none" />
                            <circle
                              cx="32" cy="32" r="26"
                              stroke={color.stroke}
                              strokeWidth="5"
                              fill="none"
                              strokeDasharray={circumference}
                              strokeDashoffset={offset}
                              strokeLinecap="round"
                              transform="rotate(-90 32 32)"
                              style={{ transition: 'stroke-dashoffset 0.5s ease' }}
                            />
                            <text x="32" y="30" textAnchor="middle" fill={color.text} fontSize="16" fontWeight="700">
                              {load ? (ratio * 100).toFixed(0) : '0'}%
                            </text>
                            <text x="32" y="44" textAnchor="middle" fill="#87a2c8" fontSize="8">
                              荷载比
                            </text>
                          </svg>
                          {actor ? (
                            <div className="flex items-center justify-center gap-1.5 mb-1">
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${actor.gender === 'female' ? 'bg-gradient-to-br from-navy-300 to-navy-500' : 'bg-gradient-to-br from-navy-500 to-navy-700'}`}>
                                <UserIcon className="w-3.5 h-3.5 text-white" />
                              </div>
                              <span className="text-sm font-medium text-navy-50">{actor.name}</span>
                            </div>
                          ) : (
                            <div className="text-center text-xs text-navy-500 mb-1">未分配</div>
                          )}
                          <div className="text-center text-[11px] space-y-0.5">
                            <div style={{ color: color.text }} className="font-semibold">
                              {load?.cumulativeLoad.toFixed(1) || '0'} / {load?.maxCapacity || '0'} kg
                            </div>
                            {load && (
                              <div className="text-navy-400 flex items-center justify-center gap-1">
                                <Zap className="w-3 h-3" />
                                冲击 {load.impactLoad.toFixed(1)}kg
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="mt-2 text-[10px] text-navy-400">L{layerIdx + 1}-{pos.index + 1}</div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="glass-card rounded-xl p-5">
              <h3 className="font-semibold text-navy-50 mb-4 flex items-center gap-2">
                <Scale className="w-4 h-4 text-safety-gold" />
                底座受力统计
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-navy-300">底座总承重</span>
                  <span className="text-xl font-bold text-navy-50">{totalLoad.toFixed(1)} <span className="text-sm font-normal text-navy-400">kg</span></span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-navy-300">底座额定总承重</span>
                  <span className="text-xl font-bold text-safety-green">{totalMaxBase.toFixed(1)} <span className="text-sm font-normal text-navy-400">kg</span></span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-navy-300">整体底座使用率</span>
                  <span className={`text-xl font-bold ${totalMaxBase > 0 && totalLoad / totalMaxBase > 0.85 ? 'text-safety-orange' : 'text-safety-green'}`}>
                    {totalMaxBase > 0 ? ((totalLoad / totalMaxBase) * 100).toFixed(1) : '0'}<span className="text-sm font-normal text-navy-400 ml-1">%</span>
                  </span>
                </div>
                <div className="h-2 rounded-full bg-navy-900/60 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${totalMaxBase > 0 ? Math.min((totalLoad / totalMaxBase) * 100, 120) : 0}%`,
                      background: totalMaxBase > 0 && totalLoad / totalMaxBase > 1
                        ? 'linear-gradient(90deg, #E63946, #F4A261)'
                        : totalMaxBase > 0 && totalLoad / totalMaxBase > 0.85
                          ? 'linear-gradient(90deg, #F4A261, #E9C46A)'
                          : 'linear-gradient(90deg, #2A9D8F, #E9C46A)'
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="glass-card rounded-xl p-5">
              <h3 className="font-semibold text-navy-50 mb-4 flex items-center gap-2">
                <Activity className="w-4 h-4 text-safety-gold" />
                左右对称性分析
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-navy-900/40 rounded-lg p-4 text-center">
                    <div className="text-xs text-navy-400 mb-1">左侧总受力</div>
                    <div className="text-2xl font-bold text-navy-100">{leftTotal.toFixed(1)}<span className="text-sm font-normal text-navy-400 ml-1">kg</span></div>
                  </div>
                  <div className="bg-navy-900/40 rounded-lg p-4 text-center">
                    <div className="text-xs text-navy-400 mb-1">右侧总受力</div>
                    <div className="text-2xl font-bold text-navy-100">{rightTotal.toFixed(1)}<span className="text-sm font-normal text-navy-400 ml-1">kg</span></div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-3 rounded-full bg-navy-900/60 overflow-hidden flex">
                    <div
                      className="h-full transition-all"
                      style={{
                        width: `${leftTotal + rightTotal > 0 ? (leftTotal / (leftTotal + rightTotal)) * 100 : 50}%`,
                        background: 'linear-gradient(90deg, #355a90, #5579ab)'
                      }}
                    />
                    <div
                      className="h-full transition-all"
                      style={{
                        width: `${leftTotal + rightTotal > 0 ? (rightTotal / (leftTotal + rightTotal)) * 100 : 50}%`,
                        background: 'linear-gradient(90deg, #5579ab, #355a90)'
                      }}
                    />
                  </div>
                </div>
                <div className="text-center">
                  {symScore >= 80 ? (
                    <div className="inline-flex items-center gap-2 text-safety-green">
                      <CheckCircle2 className="w-4 h-4" />
                      <span className="text-sm font-medium">左右受力均衡</span>
                    </div>
                  ) : symScore >= 60 ? (
                    <div className="inline-flex items-center gap-2 text-safety-orange">
                      <AlertTriangle className="w-4 h-4" />
                      <span className="text-sm font-medium">存在轻微单侧过载风险</span>
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-2 text-safety-red">
                      <AlertTriangle className="w-4 h-4" />
                      <span className="text-sm font-medium">单侧过载风险较高</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="glass-card rounded-xl p-16 text-center">
          <Scale className="w-16 h-16 mx-auto text-navy-600 mb-4" />
          <p className="text-navy-300">请先在「队形搭建」中创建或选择队形</p>
        </div>
      )}
    </div>
  );
}
