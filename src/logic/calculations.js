export function currency(value, code = 'EUR') {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: code }).format(Number(value) || 0);
}

export function monthlyKwh(item, policy) {
  if (!policy) return 0;
  return ((Number(item.wattsAverage) || 0) * (Number(policy.hoursPerDay) || 0) * (Number(policy.daysPerWeek) || 0) * 4.345) / 1000;
}

export function monthlyHardwareCost(item, profile) {
  const policy = profile.powerPolicies.find((p) => p.id === item.powerPolicyId) || profile.powerPolicies[0];
  return monthlyKwh(item, policy) * (Number(profile.electricityPricePerKwh) || 0);
}

export function monthlySubscriptionAmount(sub) {
  const amount = Number(sub.monthlyPrice) || 0;
  return sub.billingPeriod === 'yearly' ? amount / 12 : amount;
}

export function applyActivePlans(profile, includePlans) {
  if (!includePlans) return profile;
  return profile.plans.filter((p) => p.active).reduce((next, plan) => {
    const changes = plan.changes || {};
    return {
      ...next,
      electricityPricePerKwh: changes.electricityPricePerKwh ?? next.electricityPricePerKwh,
      hardware: [...next.hardware.filter((h) => !(changes.removeHardwareIds || []).includes(h.id)), ...(changes.addHardware || [])],
      subscriptions: [...next.subscriptions.filter((s) => !(changes.removeSubscriptionIds || []).includes(s.id)), ...(changes.addSubscriptions || [])],
    };
  }, { ...profile, hardware: [...profile.hardware], subscriptions: [...profile.subscriptions] });
}

export function monthlyLabourCost(profile) {
  const lc = profile.labourCost || { hours: 0, period: 'week', hourlySalary: 0 };
  const hours = Number(lc.hours ?? lc.weeklyHours) || 0;
  const period = lc.period || 'week';
  const monthlyHours = period === 'month' ? hours : hours * 4.345;
  return monthlyHours * (Number(lc.hourlySalary) || 0);
}

export function totals(profile, options = {}) {
  const includeOpportunistic = options.includeOpportunistic ?? profile.includeOpportunisticByDefault;
  const includeLabour = options.includeLabour ?? false;
  const effective = applyActivePlans(profile, options.includePlans);
  const electricityCosts = effective.hardware.reduce((sum, item) => sum + monthlyHardwareCost(item, effective), 0);
  const totalHardwareCost = effective.hardware.reduce((sum, item) => sum + (Number(item.purchasePrice) || 0), 0);
  const enabled = effective.subscriptions.filter((s) => s.enabled !== false);
  const subscriptionSavings = enabled.reduce((sum, sub) => {
    if (sub.type === 'replaced') return sum + monthlySubscriptionAmount(sub);
    if (sub.type === 'opportunistic' && includeOpportunistic && sub.includeInDefaultRoi !== false) return sum + monthlySubscriptionAmount(sub);
    return sum;
  }, 0);
  const homelabSubscriptionCosts = enabled.filter((s) => s.type === 'homelab_cost').reduce((sum, sub) => sum + monthlySubscriptionAmount(sub), 0);
  const labourCosts = includeLabour ? monthlyLabourCost(effective) : 0;
  const monthlyDelta = subscriptionSavings - electricityCosts - homelabSubscriptionCosts - labourCosts;
  return { effective, electricityCosts, totalHardwareCost, subscriptionSavings, homelabSubscriptionCosts, labourCosts, monthlyDelta, breakEvenMonths: monthlyDelta > 0 ? totalHardwareCost / monthlyDelta : null };
}

export function chartData(profile, months, options) {
  const t = totals(profile, options);
  return Array.from({ length: months + 1 }, (_, month) => ({
    month,
    roiDelta: -t.totalHardwareCost + t.monthlyDelta * month,
    hardware: t.totalHardwareCost,
    electricity: t.electricityCosts * month,
    labour: t.labourCosts * month,
    recurring: t.homelabSubscriptionCosts * month,
    savings: t.subscriptionSavings * month,
  }));
}
