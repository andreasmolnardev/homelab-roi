import { uid } from '../data/defaults.js';

export function downloadProfile(profile) {
  const blob = new Blob([JSON.stringify(profile, null, 2)], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${profile.name.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}-profile.json`;
  link.click();
  URL.revokeObjectURL(link.href);
}

export function parseProfile(text) {
  const profile = JSON.parse(text);
  if (!profile.name || !Array.isArray(profile.hardware) || !Array.isArray(profile.subscriptions)) throw new Error('Invalid profile JSON');
  return { ...profile, id: uid('profile'), name: `${profile.name} (Imported)`, updatedAt: new Date().toISOString() };
}
