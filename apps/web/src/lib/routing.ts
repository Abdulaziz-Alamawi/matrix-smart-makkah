// ───────────────────────────────────────────────────────────────────────────
// Collection route optimization — greedy nearest-neighbour over geo points.
// Approximates the vehicle-routing problem for waste collection: prioritize
// high-fill bins and minimize travel distance. Author: Abdulaziz AlAmawi
// ───────────────────────────────────────────────────────────────────────────

import type { WasteBin, CollectionRoute, GeoPoint } from "./types";
import { MAKKAH_CENTER } from "./districts";

// Haversine distance in km.
export function haversine(a: GeoPoint, b: GeoPoint): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function nearestNeighbourOrder(depot: GeoPoint, bins: WasteBin[]): WasteBin[] {
  const remaining = [...bins];
  const ordered: WasteBin[] = [];
  let current = depot;
  while (remaining.length) {
    let bestIdx = 0;
    let bestDist = Infinity;
    for (let i = 0; i < remaining.length; i++) {
      const d = haversine(current, remaining[i].location);
      if (d < bestDist) {
        bestDist = d;
        bestIdx = i;
      }
    }
    const next = remaining.splice(bestIdx, 1)[0];
    ordered.push(next);
    current = next.location;
  }
  return ordered;
}

function routeDistance(depot: GeoPoint, ordered: WasteBin[]): number {
  let dist = 0;
  let cur = depot;
  for (const b of ordered) {
    dist += haversine(cur, b.location);
    cur = b.location;
  }
  dist += haversine(cur, depot); // return to depot
  return dist;
}

/**
 * Build optimized collection routes. Bins above `threshold` fill are eligible;
 * they are grouped by district and ordered via nearest-neighbour. Savings are
 * computed against a naive "visit in arbitrary order" baseline.
 */
export function buildCollectionRoutes(
  bins: WasteBin[],
  threshold = 65,
  depot: GeoPoint = MAKKAH_CENTER
): CollectionRoute[] {
  const eligible = bins.filter((b) => b.fillLevel >= threshold && b.status !== "offline");
  const byDistrict = new Map<string, WasteBin[]>();
  for (const b of eligible) {
    const arr = byDistrict.get(b.districtId) ?? [];
    arr.push(b);
    byDistrict.set(b.districtId, arr);
  }

  const routes: CollectionRoute[] = [];
  let idx = 1;
  for (const [districtId, group] of byDistrict) {
    if (group.length === 0) continue;
    const ordered = nearestNeighbourOrder(depot, group);
    const optimized = routeDistance(depot, ordered);
    const naive = routeDistance(depot, group); // unordered baseline
    const savingsPct = naive > 0 ? Math.max(0, Math.round((1 - optimized / naive) * 100)) : 0;
    const avgFill = group.reduce((a, b) => a + b.fillLevel, 0) / group.length;
    const durationMin = Math.round(optimized * 3 + group.length * 4); // ~3min/km + 4min/stop

    routes.push({
      id: `route-${districtId}-${idx++}`,
      name: `${districtId.toUpperCase()} priority sweep`,
      binIds: ordered.map((b) => b.id),
      distanceKm: +optimized.toFixed(1),
      durationMin,
      priorityScore: Math.round(avgFill + group.length * 2),
      savingsPct,
    });
  }

  return routes.sort((a, b) => b.priorityScore - a.priorityScore);
}
