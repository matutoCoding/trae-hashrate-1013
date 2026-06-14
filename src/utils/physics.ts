import type { Actor, Formation, Position, LoadResult, StabilityResult, SafetyRating, WarningItem } from '@/types';

function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export function generateId(): string {
  return uid();
}

function getActorById(actors: Actor[], id?: string): Actor | undefined {
  if (!id) return undefined;
  return actors.find((a) => a.id === id);
}

function getPositionsByLayer(formation: Formation): Position[][] {
  const maxLayer = formation.positions.reduce((m, p) => Math.max(m, p.layer), 0);
  const layers: Position[][] = [];
  for (let l = 0; l <= maxLayer; l++) {
    layers.push(formation.positions.filter((p) => p.layer === l).sort((a, b) => a.index - b.index));
  }
  return layers;
}

export function calculateLoads(formation: Formation, actors: Actor[]): LoadResult[] {
  const layers = getPositionsByLayer(formation);
  const results: Map<string, LoadResult> = new Map();

  for (const pos of formation.positions) {
    const actor = getActorById(actors, pos.actorId);
    results.set(pos.id, {
      positionId: pos.id,
      layer: pos.layer,
      index: pos.index,
      selfWeight: actor?.weightKg ?? 0,
      cumulativeLoad: actor?.weightKg ?? 0,
      maxCapacity: actor?.maxLoadKg ?? 0,
      loadRatio: 0,
      isOverloaded: false,
      impactLoad: 0,
    });
  }

  const maxLayer = layers.length - 1;
  for (let l = maxLayer; l >= 1; l--) {
    const currentLayer = layers[l];
    const lowerLayer = layers[l - 1];
    for (const pos of currentLayer) {
      const r = results.get(pos.id)!;
      const transferred = r.cumulativeLoad;
      const leftSupportIdx = pos.index;
      const rightSupportIdx = pos.index + 1;
      let supports = 0;
      if (lowerLayer[leftSupportIdx]) supports++;
      if (lowerLayer[rightSupportIdx]) supports++;
      if (supports === 0) continue;
      const perSupport = transferred / supports;
      if (lowerLayer[leftSupportIdx]) {
        const lr = results.get(lowerLayer[leftSupportIdx].id)!;
        lr.cumulativeLoad += perSupport;
      }
      if (lowerLayer[rightSupportIdx] && rightSupportIdx !== leftSupportIdx) {
        const rr = results.get(lowerLayer[rightSupportIdx].id)!;
        rr.cumulativeLoad += perSupport;
      }
    }
  }

  for (const res of results.values()) {
    res.loadRatio = res.maxCapacity > 0 ? res.cumulativeLoad / res.maxCapacity : 0;
    res.isOverloaded = res.loadRatio > 1;
    res.impactLoad = res.cumulativeLoad * 1.35;
  }

  return Array.from(results.values());
}

export function calculateStability(formation: Formation, actors: Actor[]): StabilityResult {
  const layers = getPositionsByLayer(formation);
  const baseLayer = layers[0] || [];
  let totalW = 0;
  let sumX = 0;
  let sumY = 0;
  const layerWeights: { layer: number; weight: number; height: number }[] = [];

  for (let l = 0; l < layers.length; l++) {
    let layerW = 0;
    const avgHeight = l * 160 + 80;
    for (const pos of layers[l]) {
      const actor = getActorById(actors, pos.actorId);
      const w = actor?.weightKg ?? 0;
      layerW += w;
      totalW += w;
      sumX += w * pos.relativeX;
      sumY += w * avgHeight;
    }
    layerWeights.push({ layer: l, weight: layerW, height: avgHeight });
  }

  const centerX = totalW > 0 ? sumX / totalW : 0;
  const centerY = totalW > 0 ? sumY / totalW : 0;

  const baseCount = baseLayer.length;
  let leftEdge = -1;
  let rightEdge = 1;
  if (baseCount > 1) {
    const spacing = 2 / (baseCount - 1);
    leftEdge = -1 - spacing * 0.4;
    rightEdge = 1 + spacing * 0.4;
  } else if (baseCount === 1) {
    leftEdge = -0.35;
    rightEdge = 0.35;
  }
  const frontEdge = -0.3;
  const backEdge = 0.3;

  const polygonVertices: { x: number; y: number }[] = [
    { x: leftEdge, y: frontEdge },
    { x: rightEdge, y: frontEdge },
    { x: rightEdge, y: backEdge },
    { x: leftEdge, y: backEdge },
  ];

  const isWithin = isPointInPolygon({ x: centerX, y: 0 }, polygonVertices);

  const leftWeights: number[] = [];
  const rightWeights: number[] = [];
  for (const layer of layers) {
    const total = layer.length;
    let lw = 0, rw = 0;
    for (const pos of layer) {
      const actor = getActorById(actors, pos.actorId);
      const w = actor?.weightKg ?? 0;
      const x = total > 1 ? -1 + (2 * pos.index) / (total - 1) : 0;
      if (x < 0) lw += w;
      else if (x > 0) rw += w;
      else { lw += w / 2; rw += w / 2; }
    }
    leftWeights.push(lw);
    rightWeights.push(rw);
  }
  const totalLeft = leftWeights.reduce((a, b) => a + b, 0);
  const totalRight = rightWeights.reduce((a, b) => a + b, 0);
  const diff = Math.abs(totalLeft - totalRight);
  const sumLR = totalLeft + totalRight;
  const symmetryScore = sumLR > 0 ? Math.max(0, 100 - (diff / sumLR) * 200) : 100;

  const topHalf = layerWeights.slice(Math.ceil(layerWeights.length / 2));
  const bottomHalf = layerWeights.slice(0, Math.ceil(layerWeights.length / 2));
  const topW = topHalf.reduce((a, b) => a + b.weight, 0);
  const bottomW = bottomHalf.reduce((a, b) => a + b.weight, 0);
  const topHeavyRatio = bottomW > 0 ? topW / bottomW : 0;

  const halfWidth = (rightEdge - leftEdge) / 2;
  const centerOffsetX = Math.abs(centerX);
  const marginRatioX = 1 - centerOffsetX / halfWidth;
  const halfDepth = (backEdge - frontEdge) / 2;
  const marginRatio = Math.min(marginRatioX, 1);
  const deviation = marginRatio >= 0 ? 1 - marginRatio : Math.abs(marginRatio) + 1;

  const polygonArea = polygonAreaCalc(polygonVertices);

  return {
    centerX,
    centerY,
    totalWeight: totalW,
    isWithinPolygon: isWithin,
    polygonVertices,
    deviationDistance: deviation,
    topHeavyRatio,
    symmetryScore,
    layerWeights,
  };
}

function isPointInPolygon(point: { x: number; y: number }, polygon: { x: number; y: number }[]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x, yi = polygon[i].y;
    const xj = polygon[j].x, yj = polygon[j].y;
    const intersect = yi > point.y !== yj > point.y && point.x < ((xj - xi) * (point.y - yi)) / (yj - yi + 1e-9) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function polygonAreaCalc(polygon: { x: number; y: number }[]): number {
  let area = 0;
  for (let i = 0; i < polygon.length; i++) {
    const j = (i + 1) % polygon.length;
    area += polygon[i].x * polygon[j].y;
    area -= polygon[j].x * polygon[i].y;
  }
  return Math.abs(area) / 2;
}

export function generateWarnings(loads: LoadResult[], stability: StabilityResult, formation: Formation, actors: Actor[]): WarningItem[] {
  const warnings: WarningItem[] = [];

  const missingPositions = formation.positions.filter((p) => !p.actorId);
  if (missingPositions.length > 0) {
    warnings.push({
      id: generateId(),
      level: 'warning',
      type: 'missing',
      message: `有 ${missingPositions.length} 个位置尚未分配演员`,
    });
  }

  for (const load of loads) {
    if (load.isOverloaded) {
      const pos = formation.positions.find((p) => p.id === load.positionId);
      const actor = pos ? getActorById(actors, pos.actorId) : undefined;
      warnings.push({
        id: generateId(),
        level: 'danger',
        type: 'overload',
        message: `第${load.layer + 1}层第${load.index + 1}位${actor ? `(${actor.name})` : ''}超载 ${((load.loadRatio - 1) * 100).toFixed(1)}%`,
        positionId: load.positionId,
      });
    } else if (load.loadRatio > 0.85 && load.maxCapacity > 0) {
      const pos = formation.positions.find((p) => p.id === load.positionId);
      const actor = pos ? getActorById(actors, pos.actorId) : undefined;
      warnings.push({
        id: generateId(),
        level: 'warning',
        type: 'overload',
        message: `第${load.layer + 1}层第${load.index + 1}位${actor ? `(${actor.name})` : ''}荷载接近上限 ${(load.loadRatio * 100).toFixed(0)}%`,
        positionId: load.positionId,
      });
    }
  }

  if (!stability.isWithinPolygon) {
    warnings.push({
      id: generateId(),
      level: 'danger',
      type: 'eccentric',
      message: `整体重心已偏移出底座支撑区域，偏移度 ${(stability.deviationDistance * 100).toFixed(0)}%`,
    });
  } else if (stability.deviationDistance > 0.6) {
    warnings.push({
      id: generateId(),
      level: 'warning',
      type: 'eccentric',
      message: `重心偏移接近边缘，偏移度 ${(stability.deviationDistance * 100).toFixed(0)}%`,
    });
  }

  if (stability.topHeavyRatio > 0.9) {
    warnings.push({
      id: generateId(),
      level: 'danger',
      type: 'top_heavy',
      message: `头重脚轻风险极高，上下重量比 ${stability.topHeavyRatio.toFixed(2)}`,
    });
  } else if (stability.topHeavyRatio > 0.65) {
    warnings.push({
      id: generateId(),
      level: 'warning',
      type: 'top_heavy',
      message: `上部偏重，上下重量比 ${stability.topHeavyRatio.toFixed(2)}`,
    });
  }

  if (stability.symmetryScore < 60) {
    warnings.push({
      id: generateId(),
      level: 'danger',
      type: 'symmetry',
      message: `左右受力严重不对称，对称度 ${stability.symmetryScore.toFixed(0)}`,
    });
  } else if (stability.symmetryScore < 80) {
    warnings.push({
      id: generateId(),
      level: 'warning',
      type: 'symmetry',
      message: `左右受力存在偏差，对称度 ${stability.symmetryScore.toFixed(0)}`,
    });
  }

  return warnings;
}

export function calculateSafetyRating(loads: LoadResult[], stability: StabilityResult, warnings: WarningItem[], difficulty: Formation['difficulty']): SafetyRating {
  let score = 100;

  const maxLoadRatio = Math.max(...loads.map((l) => l.loadRatio), 0);
  if (maxLoadRatio > 1) score -= 40;
  else if (maxLoadRatio > 0.85) score -= 20;
  else if (maxLoadRatio > 0.7) score -= 10;

  if (!stability.isWithinPolygon) score -= 50;
  else if (stability.deviationDistance > 0.6) score -= 15;
  else if (stability.deviationDistance > 0.3) score -= 5;

  if (stability.topHeavyRatio > 0.9) score -= 25;
  else if (stability.topHeavyRatio > 0.65) score -= 10;

  if (stability.symmetryScore < 60) score -= 20;
  else if (stability.symmetryScore < 80) score -= 8;

  const difficultyMultiplier: Record<Formation['difficulty'], number> = { easy: 0, normal: 3, hard: 8, extreme: 15 };
  score -= difficultyMultiplier[difficulty];

  const dangerCount = warnings.filter((w) => w.level === 'danger').length;
  score -= dangerCount * 5;

  score = Math.max(0, Math.min(100, score));

  let grade: SafetyRating['grade'];
  if (score >= 85) grade = 'A';
  else if (score >= 70) grade = 'B';
  else if (score >= 55) grade = 'C';
  else grade = 'D';

  return { grade, score, warnings };
}

export function applyImpactFactor(loads: LoadResult[], factor: number = 1.35): LoadResult[] {
  return loads.map((l) => {
    const impactLoad = l.cumulativeLoad * factor;
    const loadRatio = l.maxCapacity > 0 ? impactLoad / l.maxCapacity : 0;
    return {
      ...l,
      impactLoad,
      loadRatio,
      isOverloaded: loadRatio > 1,
    };
  });
}

export function buildPyramidFormation(layers: number): Position[] {
  const positions: Position[] = [];
  for (let l = 0; l < layers; l++) {
    const countInLayer = layers - l;
    for (let i = 0; i < countInLayer; i++) {
      positions.push({
        id: generateId(),
        layer: l,
        index: i,
        relativeX: countInLayer > 1 ? -1 + (2 * i) / (countInLayer - 1) : 0,
      });
    }
  }
  return positions;
}
