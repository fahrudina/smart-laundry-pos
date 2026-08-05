interface PointsEligibleItem {
  service_type: 'unit' | 'kilo' | 'combined';
  quantity: number;
  weight_kg?: number;
}

// 1 point per KG (rounded) for kilo services, 1 point per unit for unit
// services, both for combined. Shared by the online order-creation path
// and the offline sync worker so the two can never silently diverge.
export function computePointsEarned(items: PointsEligibleItem[]): number {
  let total = 0;
  for (const item of items) {
    if (item.service_type === 'kilo' && item.weight_kg) {
      total += Math.round(item.weight_kg);
    } else if (item.service_type === 'unit') {
      total += Math.ceil(item.quantity);
    } else if (item.service_type === 'combined') {
      if (item.weight_kg) total += Math.round(item.weight_kg);
      total += Math.ceil(item.quantity);
    }
  }
  return total;
}
