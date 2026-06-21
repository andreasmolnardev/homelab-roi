import { useEffect, useState } from 'react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, LineChart, Line, Legend } from 'recharts';
import { createProfile, uid, subscriptionTypes } from './data/defaults.js';
import { chartData, currency, monthlyHardwareCost, monthlyKwh, monthlyLabourCost, monthlySubscriptionAmount, totals } from './logic/calculations.js';
import { downloadProfile, parseProfile } from './logic/exportImport.js';
import { loadStore, saveStore } from './logic/storage.js';

const tabs = ['Dashboard', 'Hardware', 'Subscriptions', 'Maintenance', 'Plans', 'Settings'];
const ranges = [
  { label: '6 months', value: 6 },
  { label: '1 year', value: 12 },
  { label: '2 years', value: 24 },
  { label: '5 years', value: 60 },
  { label: '10 years', value: 120 },
];

function emptyHardware(profile) {
  return { id: uid('hw'), name: '', purchasePrice: 0, purchaseDate: new Date().toISOString().slice(0, 10), wattsIdle: 0, wattsAverage: 10, wattsPeak: 0, powerPolicyId: profile.powerPolicies[0]?.id || '', notes: '' };
}

function emptySub(type = 'replaced') {
  return { id: uid('sub'), name: '', monthlyPrice: 0, billingPeriod: 'monthly', type, enabled: true, includeInDefaultRoi: true, notes: '' };
}

function emptyPolicy() {
  return { id: uid('policy'), name: '', hoursPerDay: 24, daysPerWeek: 7 };
}

function emptyPlan() {
  return { id: uid('plan'), name: '', active: false, changes: { addHardware: [], removeHardwareIds: [], addSubscriptions: [], removeSubscriptionIds: [], electricityPricePerKwh: null } };
}

export default function App() {
  const [store, setStore] = useState(loadStore);
  const [tab, setTab] = useState('Dashboard');
  const [profileOpen, setProfileOpen] = useState(false);
  const [includeOpportunistic, setIncludeOpportunistic] = useState(true);
  const [includePlans, setIncludePlans] = useState(false);
  const [graphMode, setGraphMode] = useState('roi');
  const [includeLabour, setIncludeLabour] = useState(false);
  const profile = store.profiles[store.activeProfileId] || Object.values(store.profiles)[0];
  const activeTabIndex = tabs.indexOf(tab);

  useEffect(() => saveStore(store), [store]);
  useEffect(() => setIncludeOpportunistic(profile.includeOpportunisticByDefault), [profile.id, profile.includeOpportunisticByDefault]);

  function updateProfile(patch) {
    setStore((prev) => ({ ...prev, profiles: { ...prev.profiles, [profile.id]: { ...profile, ...patch, updatedAt: new Date().toISOString() } } }));
  }

  function setDashboardOpportunistic(next) {
    setIncludeOpportunistic(next);
    updateProfile({ includeOpportunisticByDefault: next });
  }

  function updateList(key, list) {
    updateProfile({ [key]: list });
  }

  function createNewProfile() {
    const next = createProfile(`Profile ${Object.keys(store.profiles).length + 1}`);
    setStore((prev) => ({ activeProfileId: next.id, profiles: { ...prev.profiles, [next.id]: next } }));
  }

  function duplicateProfile() {
    const copy = { ...structuredClone(profile), id: uid('profile'), name: `${profile.name} Copy`, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    setStore((prev) => ({ activeProfileId: copy.id, profiles: { ...prev.profiles, [copy.id]: copy } }));
  }

  function renameProfile() {
    const name = prompt('Rename profile', profile.name);
    if (name && name.trim()) updateProfile({ name: name.trim() });
  }

  function deleteProfile() {
    if (Object.keys(store.profiles).length === 1 || !confirm('Delete this profile?')) return;
    const profiles = { ...store.profiles };
    delete profiles[profile.id];
    setStore({ activeProfileId: Object.keys(profiles)[0], profiles });
  }

  async function importProfile(file) {
    if (!file) return;
    const imported = parseProfile(await file.text());
    setStore((prev) => ({ activeProfileId: imported.id, profiles: { ...prev.profiles, [imported.id]: imported } }));
  }

  const pageProps = { profile, updateProfile, updateList, includeOpportunistic, setIncludeOpportunistic: setDashboardOpportunistic, includePlans, setIncludePlans, graphMode, setGraphMode, includeLabour, setIncludeLabour };

  return <div className="app"><header className="topbar"><div className="brand">Homelab ROI</div><nav className="tabs" aria-label="Primary navigation" style={{ '--active-tab': activeTabIndex, '--tab-count': tabs.length }}><span className="tab-pill" aria-hidden="true" />{tabs.map((t, index) => <button className={tab === t ? 'active' : ''} style={{ '--tab-index': index }} onClick={() => setTab(t)} key={t}>{t}</button>)}</nav><div className="profile-menu"><button className="profile-button" onClick={() => setProfileOpen((open) => !open)} aria-expanded={profileOpen} aria-label="Switch profile"><span>{profile.name.slice(0, 1).toUpperCase()}</span></button>{profileOpen && <div className="profile-switcher" role="dialog" aria-modal="true" aria-labelledby="profile-switcher-title"><button className="profile-switcher-backdrop" aria-label="Close profile switcher" onClick={() => setProfileOpen(false)} /><div className="profile-switcher-panel"><div className="profile-switcher-header"><h2 id="profile-switcher-title">Switch Profile</h2><button className="profile-switcher-close" onClick={() => setProfileOpen(false)}>Close</button></div><div className="profile-grid">{Object.values(store.profiles).map((p) => <button className={p.id === profile.id ? 'profile-card active-profile' : 'profile-card'} key={p.id} onClick={() => { setStore({ ...store, activeProfileId: p.id }); setProfileOpen(false); }}><span>{p.name.slice(0, 1).toUpperCase()}</span><strong>{p.name}</strong></button>)}<button className="profile-card new-profile" onClick={createNewProfile}><span>+</span><strong>New Profile</strong></button></div><div className="profile-actions"><button onClick={renameProfile}>Rename</button><button onClick={() => { const c = prompt('Currency code', profile.currency); if (c && c.trim()) updateProfile({ currency: c.trim().toUpperCase() }); }}>Set currency</button><button onClick={duplicateProfile}>Duplicate</button><button onClick={() => downloadProfile(profile)}>Export</button><label className="button">Import<input hidden type="file" accept="application/json" onChange={(e) => importProfile(e.target.files[0])} /></label><button className="danger" onClick={deleteProfile}>Delete</button></div></div></div>}</div></header><main>{tab === 'Dashboard' && <Dashboard {...pageProps} />}{tab === 'Hardware' && <Hardware {...pageProps} />}{tab === 'Subscriptions' && <Subscriptions {...pageProps} />}{tab === 'Maintenance' && <Maintenance {...pageProps} />}{tab === 'Plans' && <Plans {...pageProps} />}{tab === 'Settings' && <Settings {...pageProps} importProfile={importProfile} />}</main></div>;
}

function Dashboard({ profile, includeOpportunistic, setIncludeOpportunistic, includePlans, setIncludePlans, includeLabour, setIncludeLabour, graphMode, setGraphMode }) {
  const [range, setRange] = useState(profile.defaultGraphRange || 24);
  const t = totals(profile, { includeOpportunistic, includePlans, includeLabour });
  const data = chartData(profile, Number(range), { includeOpportunistic, includePlans, includeLabour });

  return <><Header title="Dashboard" /><div className="summary"><Metric title="Monthly Net Delta" value={currency(t.monthlyDelta, profile.currency)} good={t.monthlyDelta > 0} /><Metric title="Break-even" value={t.breakEvenMonths ? `${Math.ceil(t.breakEvenMonths)} months` : 'No break-even'} /><Metric title="Hardware Investment" value={currency(t.totalHardwareCost, profile.currency)} /><Metric title="Monthly Power Cost" value={currency(t.electricityCosts, profile.currency)} /></div><div className="card"><div className="toolbar"><select value={graphMode} onChange={(e) => setGraphMode(e.target.value)}><option value="roi">ROI Delta</option><option value="cost">Total Cost</option></select><select value={range} onChange={(e) => setRange(e.target.value)}>{ranges.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}</select><label><input type="checkbox" checked={includeOpportunistic} onChange={(e) => setIncludeOpportunistic(e.target.checked)} /> Opportunistic</label><label><input type="checkbox" checked={includePlans} onChange={(e) => setIncludePlans(e.target.checked)} /> Plans</label><label><input type="checkbox" checked={includeLabour} onChange={(e) => setIncludeLabour(e.target.checked)} /> Labour</label></div><div className="chart"><ResponsiveContainer>{graphMode === 'roi' ? <AreaChart data={data}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="month" /><YAxis /><Tooltip /><Area type="monotone" dataKey="roiDelta" stroke="#2563eb" fill="#dbeafe" /></AreaChart> : <LineChart data={data}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="month" /><YAxis /><Tooltip /><Legend /><Line dataKey="hardware" stroke="#111827" /><Line dataKey="electricity" stroke="#dc2626" /><Line dataKey="labour" stroke="#9333ea" /><Line dataKey="recurring" stroke="#f97316" /><Line dataKey="savings" stroke="#16a34a" /></LineChart>}</ResponsiveContainer></div></div></>;
}

function Hardware({ profile, updateList }) {
  return <><Header title="Hardware" /><Crud title="Hardware" items={profile.hardware} empty={emptyHardware(profile)} onSave={(items) => updateList('hardware', items)} render={(item, set) => <><Field label="Name" value={item.name} onChange={(v) => set({ name: v })} /><Field label="Purchase Price" type="number" value={item.purchasePrice} onChange={(v) => set({ purchasePrice: v })} /><Field label="Purchase Date" type="date" value={item.purchaseDate} onChange={(v) => set({ purchaseDate: v })} /><Field label="Average Watts" type="number" value={item.wattsAverage} onChange={(v) => set({ wattsAverage: v })} /><label>Power Policy<select value={item.powerPolicyId} onChange={(e) => set({ powerPolicyId: e.target.value })}>{profile.powerPolicies.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label><Field label="Notes" value={item.notes} onChange={(v) => set({ notes: v })} /></>} badges={(item) => [currency(monthlyHardwareCost(item, profile), profile.currency), `${monthlyKwh(item, profile.powerPolicies.find((p) => p.id === item.powerPolicyId)).toFixed(1)} kWh/mo`]} /></>;
}

function Subscriptions({ profile, updateList }) {
  const [filter, setFilter] = useState('all');
  const shown = filter === 'all' ? profile.subscriptions : profile.subscriptions.filter((s) => s.type === filter);

  return <><Header title="Subscriptions" /><div className="toolbar"><select value={filter} onChange={(e) => setFilter(e.target.value)}><option value="all">All types</option>{subscriptionTypes.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}</select></div><Crud items={shown} source={profile.subscriptions} empty={emptySub()} onSave={(items) => updateList('subscriptions', items)} render={(item, set) => <><Field label="Name" value={item.name} onChange={(v) => set({ name: v })} /><Field label="Price" type="number" value={item.monthlyPrice} onChange={(v) => set({ monthlyPrice: v })} /><label>Billing Period<select value={item.billingPeriod || 'monthly'} onChange={(e) => set({ billingPeriod: e.target.value })}><option value="monthly">Monthly</option><option value="yearly">Yearly</option></select></label><label>Type<select value={item.type} onChange={(e) => set({ type: e.target.value })}>{subscriptionTypes.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}</select></label><label><input type="checkbox" checked={item.enabled} onChange={(e) => set({ enabled: e.target.checked })} /> Enabled</label><label><input type="checkbox" checked={item.includeInDefaultRoi} onChange={(e) => set({ includeInDefaultRoi: e.target.checked })} /> Include in default ROI</label></>} badges={(item) => [item.type.replace('_', ' '), `${currency(monthlySubscriptionAmount(item), profile.currency)}/mo`, item.billingPeriod === 'yearly' ? 'billed yearly' : 'billed monthly']} /></>;
}

function Maintenance({ profile, updateList, updateProfile }) {
  return <><Header title="Maintenance" /><Crud title="Power Policies" items={profile.powerPolicies} empty={emptyPolicy()} onSave={(items) => updateList('powerPolicies', items)} render={(item, set) => <><Field label="Name" value={item.name} onChange={(v) => set({ name: v })} /><Field label="Hours Per Day" type="number" value={item.hoursPerDay} onChange={(v) => set({ hoursPerDay: v })} /><Field label="Days Per Week" type="number" value={item.daysPerWeek} onChange={(v) => set({ daysPerWeek: v })} /></>} badges={(item) => [`${(item.hoursPerDay * item.daysPerWeek * 4.345).toFixed(0)} hrs/mo`]} /><Header title="Labour Costs" /><div className="card form-grid"><Field label="Hours" type="number" value={profile.labourCost?.hours ?? profile.labourCost?.weeklyHours ?? 0} onChange={(v) => updateProfile({ labourCost: { ...profile.labourCost, hours: v } })} /><label>Hours Period<select value={profile.labourCost?.period || 'week'} onChange={(e) => updateProfile({ labourCost: { ...profile.labourCost, period: e.target.value } })}><option value="week">Per week</option><option value="month">Per month</option></select></label><Field label="Hourly Salary" type="number" value={profile.labourCost?.hourlySalary ?? 0} onChange={(v) => updateProfile({ labourCost: { ...profile.labourCost, hourlySalary: v } })} /><p className="hint">Monthly labour cost: {currency(monthlyLabourCost(profile), profile.currency)}</p></div></>;
}

function Plans({ profile, updateList, updateProfile }) {
  function applyPlan(plan) {
    const c = plan.changes;
    updateProfile({ hardware: [...profile.hardware.filter((h) => !(c.removeHardwareIds || []).includes(h.id)), ...(c.addHardware || [])], subscriptions: [...profile.subscriptions.filter((s) => !(c.removeSubscriptionIds || []).includes(s.id)), ...(c.addSubscriptions || [])], electricityPricePerKwh: c.electricityPricePerKwh ?? profile.electricityPricePerKwh, plans: profile.plans.filter((p) => p.id !== plan.id) });
  }

  return <Crud title="Plans" items={profile.plans} empty={emptyPlan()} onSave={(items) => updateList('plans', items)} render={(item, set) => <><Field label="Name" value={item.name} onChange={(v) => set({ name: v })} /><label><input type="checkbox" checked={item.active} onChange={(e) => set({ active: e.target.checked })} /> Include in simulation</label><Field label="New Electricity Price" type="number" value={item.changes.electricityPricePerKwh ?? ''} onChange={(v) => set({ changes: { ...item.changes, electricityPricePerKwh: v === '' ? null : Number(v) } })} /><PlanAdditions profile={profile} item={item} set={set} /><button onClick={() => applyPlan(item)}>Apply Plan</button></>} badges={(item) => [item.active ? 'Active' : 'Inactive', `${(item.changes.addHardware || []).length} hardware`, `${(item.changes.addSubscriptions || []).length} subs`]} />;
}

function PlanAdditions({ profile, item, set }) {
  const changes = item.changes;
  const setChanges = (patch) => set({ changes: { ...changes, ...patch } });
  return <div className="plan-box"><h3>Planned Additions</h3><button onClick={() => setChanges({ addHardware: [...changes.addHardware, emptyHardware(profile)] })}>Add Planned Hardware</button>{changes.addHardware.map((hw, index) => <div className="mini" key={hw.id}><Field label="Hardware Name" value={hw.name} onChange={(v) => setChanges({ addHardware: changes.addHardware.map((x, i) => i === index ? { ...x, name: v } : x) })} /><Field label="Price" type="number" value={hw.purchasePrice} onChange={(v) => setChanges({ addHardware: changes.addHardware.map((x, i) => i === index ? { ...x, purchasePrice: v } : x) })} /><Field label="Average Watts" type="number" value={hw.wattsAverage} onChange={(v) => setChanges({ addHardware: changes.addHardware.map((x, i) => i === index ? { ...x, wattsAverage: v } : x) })} /></div>)}<button onClick={() => setChanges({ addSubscriptions: [...changes.addSubscriptions, emptySub()] })}>Add Planned Subscription</button>{changes.addSubscriptions.map((sub, index) => <div className="mini" key={sub.id}><Field label="Subscription Name" value={sub.name} onChange={(v) => setChanges({ addSubscriptions: changes.addSubscriptions.map((x, i) => i === index ? { ...x, name: v } : x) })} /><Field label="Price" type="number" value={sub.monthlyPrice} onChange={(v) => setChanges({ addSubscriptions: changes.addSubscriptions.map((x, i) => i === index ? { ...x, monthlyPrice: v } : x) })} /><label>Billing Period<select value={sub.billingPeriod || 'monthly'} onChange={(e) => setChanges({ addSubscriptions: changes.addSubscriptions.map((x, i) => i === index ? { ...x, billingPeriod: e.target.value } : x) })}><option value="monthly">Monthly</option><option value="yearly">Yearly</option></select></label><label>Type<select value={sub.type} onChange={(e) => setChanges({ addSubscriptions: changes.addSubscriptions.map((x, i) => i === index ? { ...x, type: e.target.value } : x) })}>{subscriptionTypes.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}</select></label></div>)}<button onClick={() => setChanges({ addSubscriptions: [...changes.addSubscriptions, emptySub('homelab_cost')] })}>Add Planned Subscription</button></div>;
}

function Settings({ profile, updateProfile, importProfile }) {
  return <><Header title="Settings" /><div className="card form-grid"><Field label="Profile Name" value={profile.name} onChange={(v) => updateProfile({ name: v })} /><Field label="Currency" value={profile.currency} onChange={(v) => updateProfile({ currency: v.toUpperCase() })} /><Field label="Electricity Price / kWh" type="number" value={profile.electricityPricePerKwh} onChange={(v) => updateProfile({ electricityPricePerKwh: Number(v) })} /><label>Default Graph Range<select value={profile.defaultGraphRange} onChange={(e) => updateProfile({ defaultGraphRange: Number(e.target.value) })}>{ranges.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}</select></label><label><input type="checkbox" checked={profile.includeOpportunisticByDefault} onChange={(e) => updateProfile({ includeOpportunisticByDefault: e.target.checked })} /> Include opportunistic savings by default</label><button onClick={() => downloadProfile(profile)}>Export Profile</button><label className="button">Import Profile<input hidden type="file" accept="application/json" onChange={(e) => importProfile(e.target.files[0])} /></label></div></>;
}

function Crud({ title, items, source, empty, onSave, render, badges }) {
  const list = source || items;
  const [editing, setEditing] = useState(null);

  function saveItem(item) {
    onSave(list.some((i) => i.id === item.id) ? list.map((i) => i.id === item.id ? item : i) : [...list, item]);
    setEditing(null);
  }

  return <><Header title={title} /><button onClick={() => setEditing(empty)}>Add {title || 'Item'}</button><div className="list">{items.length === 0 && <div className="empty">No items yet.</div>}{items.map((item) => <div className="card row" key={item.id}><div><h3>{item.name || 'Untitled'}</h3><div className="badges">{badges?.(item).map((b) => <span key={b}>{b}</span>)}</div></div><div><button onClick={() => setEditing(structuredClone(item))}>Edit</button><button className="danger" onClick={() => confirm('Delete item?') && onSave(list.filter((i) => i.id !== item.id))}>Delete</button></div></div>)}</div>{editing && <Editor item={editing} setItem={setEditing} onCancel={() => setEditing(null)} onSave={saveItem}>{render}</Editor>}</>;
}

function Editor({ item, setItem, onCancel, onSave, children }) {
  const set = (patch) => setItem({ ...item, ...patch });
  return <div className="modal"><div className="card editor">{children(item, set)}<div className="toolbar"><button onClick={() => onSave(item)}>Save</button><button onClick={onCancel}>Cancel</button></div></div></div>;
}

function Field({ label, value, onChange, type = 'text' }) {
  return <label>{label}<input type={type} value={value} onChange={(e) => onChange(type === 'number' ? Number(e.target.value) : e.target.value)} /></label>;
}

function Header({ title, subtitle }) {
  return <header><h1>{title}</h1>{subtitle && <p>{subtitle}</p>}</header>;
}

function Metric({ title, value, good }) {
  return <div className="card metric"><span>{title}</span><strong className={good ? 'success' : ''}>{value}</strong></div>;
}
