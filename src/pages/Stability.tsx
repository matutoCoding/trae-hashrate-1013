import { useMemo, useState } from 'react';
import { AlertTriangle, Crosshair, AlertOctagon, Zap, TrendingUp, Activity, Gauge } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import RatingBadge from '@/components/RatingBadge';
import { useAppStore } from '@/store';
import { calculateLoads, calculateStability, generateWarnings, calculateSafetyRating } from '@/utils/physics';
import type { WarningItem } from '@/types';

export default function Stability() {
  const { actors, formations, currentFormationId, addTrainingRecord } = useAppStore();
  const formation = formations.find((f) => f.id === currentFormationId) || null;
  const [impactMode, setImpactMode] = useState(false);
  const [shaking, setShaking] = useState(false);

  const { stability, loads, rating } = useMemo(() => {
    if (!formation) return { stability: null, loads: [], rating: null };
    const L = calculateLoads(formation, actors);
    const S = calculateStability(formation, actors);
    const W = generateWarnings(L, S, formation, actors);
    const R = calculateSafetyRating(L, S, W, formation.difficulty);
    return { stability: S, loads: L, rating: R };
  }, [formation, actors, impactMode]);

  const warningLevelColor = (level: WarningItem['level']) => {
    if (level === 'danger') return { bg: 'rgba(230, 57, 70, 0.15)', border: '#E63946', text: '#E63946', icon: AlertOctagon };
    if (level === 'warning') return { bg: 'rgba(244, 162, 97, 0.15)', border: '#F4A261', text: '#F4A261', icon: AlertTriangle };
    return { bg: 'rgba(42, 157, 143, 0.15)', border: '#2A9D8F', text: '#2A9D8F', icon: Activity };
  };

  const handleRecordTraining = () => {
    if (!formation || !rating) return;
    addTrainingRecord({
      formationId: formation.id,
      formationSnapshot: JSON.parse(JSON.stringify(formation)),
      trainingDate: new Date().toISOString(),
      durationMinutes: 0,
      actualWarnings: rating.warnings,
      safetyRating: rating,
    });
    alert('训练记录已保存到方案库');
  };

  const triggerShake = () => {
    setShaking(true);
    setImpactMode(true);
    setTimeout(() => setShaking(false), 800);
  };

  return (
    <div className="p-8">
      <PageHeader
        title="失稳预警"
        subtitle="重心计算、支撑多边形校验、冲击荷载模拟与风险分级告警"
        icon={<AlertTriangle className="w-6 h-6 text-safety-gold" />}
        actions={
          formation && (
            <div className="flex gap-2">
              <button
                onClick={triggerShake}
                className={`btn-ghost flex items-center gap-2 ${shaking ? 'animate-pulse bg-safety-red/30' : ''}`}
              >
                <Zap className="w-4 h-4" />
                模拟晃动冲击
              </button>
              <button onClick={handleRecordTraining} className="btn-gold flex items-center gap-2">
                <Activity className="w-4 h-4" />
                记录训练
              </button>
            </div>
          )
        }
      />

      {formation && stability && rating ? (
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 lg:col-span-5 space-y-6">
            <div className="glass-card rounded-xl p-6 text-center">
              <div className="text-sm text-navy-300 mb-3">安全评级</div>
              <div className="mb-4">
                <RatingBadge rating={rating} size="lg" />
              </div>
              <div className="w-full h-3 rounded-full bg-navy-900/60 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${rating.score}%`,
                    background: rating.score >= 85
                      ? 'linear-gradient(90deg, #2A9D8F, #E9C46A)'
                      : rating.score >= 70
                        ? 'linear-gradient(90deg, #E9C46A, #F4A261)'
                        : rating.score >= 55
                          ? 'linear-gradient(90deg, #F4A261, #E63946)'
                          : 'linear-gradient(90deg, #E63946, #c12937)'
                  }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="glass-card rounded-xl p-5">
                <div className="flex items-center gap-2 text-xs text-navy-400 mb-2">
                  <Crosshair className="w-3.5 h-3.5 text-safety-gold" />
                  重心 X 偏移
                </div>
                <div className={`text-2xl font-bold ${Math.abs(stability.centerX) > 0.3 ? 'text-safety-red' : 'text-safety-green'}`}>
                  {(stability.centerX * 100).toFixed(1)}<span className="text-sm font-normal text-navy-400 ml-1">%</span>
                </div>
              </div>
              <div className="glass-card rounded-xl p-5">
                <div className="flex items-center gap-2 text-xs text-navy-400 mb-2">
                  <Gauge className="w-3.5 h-3.5 text-safety-gold" />
                  总重量
                </div>
                <div className="text-2xl font-bold text-navy-50">
                  {stability.totalWeight.toFixed(1)}<span className="text-sm font-normal text-navy-400 ml-1">kg</span>
                </div>
              </div>
              <div className="glass-card rounded-xl p-5">
                <div className="flex items-center gap-2 text-xs text-navy-400 mb-2">
                  <TrendingUp className="w-3.5 h-3.5 text-safety-gold" />
                  头重脚轻比
                </div>
                <div className={`text-2xl font-bold ${stability.topHeavyRatio > 0.9 ? 'text-safety-red' : stability.topHeavyRatio > 0.65 ? 'text-safety-orange' : 'text-safety-green'}`}>
                  {stability.topHeavyRatio.toFixed(2)}
                </div>
              </div>
              <div className="glass-card rounded-xl p-5">
                <div className="flex items-center gap-2 text-xs text-navy-400 mb-2">
                  <Activity className="w-3.5 h-3.5 text-safety-gold" />
                  对称度
                </div>
                <div className={`text-2xl font-bold ${stability.symmetryScore < 60 ? 'text-safety-red' : stability.symmetryScore < 80 ? 'text-safety-orange' : 'text-safety-green'}`}>
                  {stability.symmetryScore.toFixed(0)}<span className="text-sm font-normal text-navy-400 ml-1">分</span>
                </div>
              </div>
            </div>

            <div className="glass-card rounded-xl p-5">
              <h3 className="font-semibold text-navy-50 mb-4 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-safety-gold" />
                风险告警列表
              </h3>
              {rating.warnings.length === 0 ? (
                <div className="text-center py-8 text-navy-400">
                  <div className="w-12 h-12 rounded-full bg-safety-green/15 flex items-center justify-center mx-auto mb-3">
                    <Activity className="w-6 h-6 text-safety-green" />
                  </div>
                  <div>当前队形安全，无告警</div>
                </div>
              ) : (
                <div className="space-y-2 max-h-72 overflow-auto">
                  {rating.warnings.map((w) => {
                    const c = warningLevelColor(w.level);
                    const Icon = c.icon;
                    return (
                      <div
                        key={w.id}
                        className={`rounded-lg p-3 flex items-start gap-3 transition-all ${w.level === 'danger' && shaking ? 'animate-pulse' : ''}`}
                        style={{ background: c.bg, border: `1px solid ${c.border}55` }}
                      >
                        <Icon className="w-5 h-5 shrink-0 mt-0.5" style={{ color: c.text }} />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium" style={{ color: c.text }}>{w.message}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="col-span-12 lg:col-span-7 space-y-6">
            <div className="glass-card rounded-xl p-6 grid-bg overflow-hidden">
              <h3 className="font-semibold text-navy-50 mb-4 flex items-center gap-2">
                <Crosshair className="w-4 h-4 text-safety-gold" />
                支撑多边形与重心投影（俯视图）
              </h3>
              <div className="relative aspect-[4/3] bg-navy-950/60 rounded-xl border border-navy-700/40 overflow-hidden">
                <svg viewBox="-1.4 -0.9 2.8 1.8" className="w-full h-full">
                  <defs>
                    <pattern id="miniGrid" width="0.1" height="0.1" patternUnits="userSpaceOnUse">
                      <path d="M 0.1 0 L 0 0 0 0.1" fill="none" stroke="rgba(135,162,200,0.08)" strokeWidth="0.005" />
                    </pattern>
                  </defs>
                  <rect x="-1.4" y="-0.9" width="2.8" height="1.8" fill="url(#miniGrid)" />
                  <line x1="-1.3" y1="0" x2="1.3" y2="0" stroke="rgba(135,162,200,0.15)" strokeWidth="0.01" strokeDasharray="0.04 0.02" />
                  <line x1="0" y1="-0.8" x2="0" y2="0.8" stroke="rgba(135,162,200,0.15)" strokeWidth="0.01" strokeDasharray="0.04 0.02" />

                  {stability.polygonVertices.length > 2 && (
                    <polygon
                      points={stability.polygonVertices.map((p) => `${p.x},${p.y - 0.5}`).join(' ')}
                      fill={stability.isWithinPolygon ? 'rgba(42, 157, 143, 0.1)' : 'rgba(230, 57, 70, 0.12)'}
                      stroke={stability.isWithinPolygon ? '#2A9D8F' : '#E63946'}
                      strokeWidth="0.02"
                      strokeDasharray={stability.isWithinPolygon ? 'none' : '0.06 0.03'}
                      className={!stability.isWithinPolygon && shaking ? 'animate-pulse' : ''}
                    />
                  )}

                  {stability.polygonVertices.map((v, i) => (
                    <circle key={i} cx={v.x} cy={v.y - 0.5} r="0.045" fill="#1f395e" stroke="#E9C46A" strokeWidth="0.015" />
                  ))}

                  <g className={shaking ? 'animate-pulse' : ''}>
                    <circle
                      cx={stability.centerX}
                      cy={-stability.centerY / 400 - 0.5}
                      r="0.07"
                      fill={stability.isWithinPolygon ? 'rgba(233, 196, 106, 0.2)' : 'rgba(230, 57, 70, 0.25)'}
                    />
                    <circle
                      cx={stability.centerX}
                      cy={-stability.centerY / 400 - 0.5}
                      r="0.035"
                      fill={stability.isWithinPolygon ? '#E9C46A' : '#E63946'}
                      className={!stability.isWithinPolygon ? 'danger-glow' : ''}
                      style={{ filter: stability.isWithinPolygon ? 'drop-shadow(0 0 0.06px #E9C46A)' : 'drop-shadow(0 0 0.1px #E63946)' }}
                    />
                    <line
                      x1={stability.centerX}
                      y1={-stability.centerY / 400 - 0.5}
                      x2={stability.centerX}
                      y2={-0.5}
                      stroke={stability.isWithinPolygon ? 'rgba(233, 196, 106, 0.4)' : 'rgba(230, 57, 70, 0.5)'}
                      strokeWidth="0.01"
                      strokeDasharray="0.03 0.02"
                    />
                    <circle cx={stability.centerX} cy={-0.5} r="0.02" fill={stability.isWithinPolygon ? '#E9C46A' : '#E63946'} />
                  </g>

                  <text x="-1.25" y="-0.75" fontSize="0.06" fill="#87a2c8">重心 G</text>
                  <text x="0.9" y="-0.75" fontSize="0.06" fill="#87a2c8">支撑区域</text>
                </svg>
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-safety-gold" />
                      <span className="text-navy-300">重心投影</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full border-2 border-safety-gold bg-navy-800" />
                      <span className="text-navy-300">支撑点</span>
                    </span>
                  </div>
                  <span className={`font-semibold ${stability.isWithinPolygon ? 'text-safety-green' : 'text-safety-red'}`}>
                    {stability.isWithinPolygon ? '✓ 重心在支撑区域内' : '✗ 重心偏移出支撑区域!'}
                  </span>
                </div>
              </div>
            </div>

            <div className="glass-card rounded-xl p-6">
              <h3 className="font-semibold text-navy-50 mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-safety-gold" />
                各层重量分布
              </h3>
              <div className="space-y-3">
                {[...stability.layerWeights].reverse().map((lw, idx) => {
                  const maxW = Math.max(...stability.layerWeights.map((l) => l.weight), 1);
                  const pct = (lw.weight / maxW) * 100;
                  const layerDisplay = stability.layerWeights.length - idx;
                  return (
                    <div key={lw.layer} className="flex items-center gap-3">
                      <div className="w-16 text-sm text-navy-300">第 {layerDisplay} 层</div>
                      <div className="flex-1 h-7 bg-navy-900/60 rounded-lg overflow-hidden relative">
                        <div
                          className="h-full rounded-lg transition-all duration-500"
                          style={{
                            width: `${pct}%`,
                            background: layerDisplay === 1
                              ? 'linear-gradient(90deg, #2A9D8F, #5579ab)'
                              : layerDisplay <= 2
                                ? 'linear-gradient(90deg, #5579ab, #355a90)'
                                : 'linear-gradient(90deg, #E9C46A, #F4A261)'
                          }}
                        />
                        <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-navy-50">
                          {lw.weight.toFixed(1)} kg
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 pt-4 border-t border-navy-700/40 text-sm text-navy-300 flex items-center justify-between">
                <span>头重脚轻评估：</span>
                <span className={stability.topHeavyRatio > 0.9 ? 'text-safety-red font-semibold' : stability.topHeavyRatio > 0.65 ? 'text-safety-orange font-semibold' : 'text-safety-green font-semibold'}>
                  {stability.topHeavyRatio > 0.9 ? '严重头重脚轻' : stability.topHeavyRatio > 0.65 ? '上部偏重' : '分布合理'}
                </span>
              </div>
            </div>

            {impactMode && (
              <div className="glass-card rounded-xl p-5 border border-safety-orange/40 animate-pulse">
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="w-5 h-5 text-safety-orange" />
                  <h3 className="font-semibold text-safety-orange">冲击荷载模拟结果</h3>
                </div>
                <p className="text-sm text-navy-300 mb-2">当演员发生晃动或脱手时，瞬时冲击荷载约为静态荷载的 1.35 倍。</p>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="bg-navy-900/40 rounded-lg p-3">
                    <div className="text-xs text-navy-400">静态总承重</div>
                    <div className="text-lg font-bold text-navy-50">
                      {loads.filter(l => l.layer === 0).reduce((s, l) => s + l.cumulativeLoad, 0).toFixed(1)} kg
                    </div>
                  </div>
                  <div className="bg-navy-900/40 rounded-lg p-3">
                    <div className="text-xs text-navy-400">冲击总承重</div>
                    <div className="text-lg font-bold text-safety-orange">
                      {loads.filter(l => l.layer === 0).reduce((s, l) => s + l.impactLoad, 0).toFixed(1)} kg
                    </div>
                  </div>
                  <div className="bg-navy-900/40 rounded-lg p-3">
                    <div className="text-xs text-navy-400">放大系数</div>
                    <div className="text-lg font-bold text-safety-gold">×1.35</div>
                  </div>
                </div>
                <button onClick={() => setImpactMode(false)} className="btn-ghost mt-4 text-xs py-1.5">关闭模拟</button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="glass-card rounded-xl p-16 text-center">
          <AlertTriangle className="w-16 h-16 mx-auto text-navy-600 mb-4" />
          <p className="text-navy-300">请先在「队形搭建」中创建或选择队形</p>
        </div>
      )}
    </div>
  );
}
