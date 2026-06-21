export const STORAGE_KEY = 'homelab_roi_app';

export const subscriptionTypes = [
  { value: 'replaced', label: 'Replaced' },
  { value: 'homelab_cost', label: 'Homelab Cost' },
  { value: 'opportunistic', label: 'Opportunistic' },
];

export function uid(prefix) {
  return `${prefix}_${crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36)}`;
}

export function defaultPolicies() {
  return [
    { id: uid('policy'), name: 'Always On', hoursPerDay: 24, daysPerWeek: 7 },
    { id: uid('policy'), name: 'Night Shutdown', hoursPerDay: 16, daysPerWeek: 7 },
    { id: uid('policy'), name: 'Weekend Only', hoursPerDay: 24, daysPerWeek: 2 },
  ];
}

export function createProfile(name = 'Main Homelab') {
  const policies = defaultPolicies();
  const now = new Date().toISOString();
  return {
    id: uid('profile'),
    name,
    createdAt: now,
    updatedAt: now,
    currency: 'EUR',
    electricityPricePerKwh: 0.35,
    defaultGraphRange: 24,
    includeOpportunisticByDefault: true,
    hardware: [],
    subscriptions: [],
    powerPolicies: policies,
    labourCost: { hours: 0, period: 'week', hourlySalary: 0 },
    plans: [],
  };
}

export function createStore() {
  const profile = createProfile();
  return { activeProfileId: profile.id, profiles: { [profile.id]: profile } };
}
