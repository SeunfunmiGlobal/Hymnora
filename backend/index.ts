import { router, json, error, db, ai, requireAuth, invites, isInviteError, increment } from '@appdeploy/sdk';

type Role = 'owner' | 'admin' | 'editor' | 'worship_leader' | 'viewer';
type Membership = { workspaceId: string; role: Role };
type Song = { title: string; artist?: string; language?: string; lyrics: string; rights?: string };
type EventRecord = { title: string; date: string; time?: string; venue?: string; description?: string };
const table = (prefix: string, workspaceId: string) => `${prefix}_${workspaceId}`;
const can = (role: Role, allowed: Role[]) => allowed.includes(role);
function hash(value: string) {
  let h = 2166136261;
  for (let i = 0; i < value.length; i++) { h ^= value.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (h >>> 0).toString(36);
}
async function getMembership(user: { userId: string; email?: string; name?: string }): Promise<Membership> {
  const [saved] = await db.get<Membership>('hymnora_user_workspace', [user.userId]);
  if (saved) return saved;
  const workspaceId = `w_${user.userId.replace(/[^a-zA-Z0-9_-]/g, '')}`;
  await db.tx.add('hymnora_workspaces', [{ id: workspaceId, name: user.name ? `${user.name}'s Church` : 'My Church', ownerId: user.userId, createdAt: new Date().toISOString() }]);
  await db.tx.add('hymnora_user_workspace', [{ id: user.userId, workspaceId, role: 'owner', email: user.email || '', joinedAt: new Date().toISOString() }]);
  const [created] = await db.get<Membership>('hymnora_user_workspace', [user.userId], { consistent: true });
  if (!created) throw new Error('Workspace setup could not be completed');
  return created;
}
async function registrationRateLimit(ip: string) {
  const id = `reg_${hash(ip)}_${Math.floor(Date.now() / 3600000)}`;
  await db.tx.add('hymnora_rate_limits', [{ id, count: 0 }]);
  const [updated] = await db.tx.update('hymnora_rate_limits', [{ id, record: { count: increment(1) } }], { patch: true });
  if (!updated) return false;
  const [saved] = await db.get<{ count: number }>('hymnora_rate_limits', [id], { consistent: true });
  return (saved?.count || 0) <= 5;
}
export const handler = router({
  'GET /api/_healthcheck': [async () => json({ ok: true, app: 'Hymnora' })],
  'GET /api/me': [requireAuth(), async ({ user }) => {
    const m = await getMembership(user!);
    const [workspace] = await db.get<{ name: string }>('hymnora_workspaces', [m.workspaceId]);
    return json({ user: { userId: user!.userId, email: user!.email, name: user!.name }, workspaceId: m.workspaceId, workspaceName: workspace?.name || 'Church workspace', role: m.role });
  }],
  'GET /api/songs': [requireAuth(), async ({ user }) => {
    const m = await getMembership(user!);
    const result = await db.list<Song>(table('hymnora_songs', m.workspaceId), { limit: 100 });
    return json({ songs: result.items });
  }],
  'POST /api/songs': [requireAuth(), async ({ body, user }) => {
    const m = await getMembership(user!);
    if (!can(m.role, ['owner', 'admin', 'editor', 'worship_leader'])) return error('You do not have permission to manage worship songs', 403);
    const song = (body || {}) as Song;
    if (!song.title?.trim() || !song.lyrics?.trim()) return error('Song title and authorized lyrics are required', 400);
    if (song.lyrics.length > 50000) return error('Lyrics are too long', 413);
    const [id] = await db.add(table('hymnora_songs', m.workspaceId), [{ ...song, createdBy: user!.userId, createdAt: new Date().toISOString() }]);
    if (!id) return error('Unable to save song', 503);
    return json({ song: { ...song, id } }, 201);
  }],
  'GET /api/events': [requireAuth(), async ({ user }) => {
    const m = await getMembership(user!);
    const result = await db.list<EventRecord>(table('hymnora_events', m.workspaceId), { limit: 100 });
    return json({ events: result.items.map(e => ({ ...e, id: `${m.workspaceId}__${e.id}` })) });
  }],
  'POST /api/events': [requireAuth(), async ({ body, user }) => {
    const m = await getMembership(user!);
    if (!can(m.role, ['owner', 'admin', 'editor'])) return error('You do not have permission to publish events', 403);
    const event = (body || {}) as EventRecord;
    if (!event.title?.trim() || !event.date) return error('Event title and date are required', 400);
    const [id] = await db.add(table('hymnora_events', m.workspaceId), [{ ...event, createdBy: user!.userId, createdAt: new Date().toISOString() }]);
    if (!id) return error('Unable to save event', 503);
    return json({ event: { ...event, id: `${m.workspaceId}__${id}` } }, 201);
  }],
  'GET /api/registrations': [requireAuth(), async ({ user }) => {
    const m = await getMembership(user!);
    if (!can(m.role, ['owner', 'admin'])) return error('Only workspace owners and administrators can view attendee contact records', 403);
    const result = await db.list(table('hymnora_registrations', m.workspaceId), { limit: 200 });
    return json({ registrations: result.items });
  }],
  'POST /api/registrations': [async ({ body, event }) => {
    const r = (body || {}) as { fullName?: string; email?: string; phone?: string; whatsapp?: string; location?: string; busStop?: string; source?: string; eventId?: string; consent?: boolean; website?: string };
    if (r.website) return json({ received: true }, 201);
    if (!r.fullName?.trim() || !r.email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(r.email) || !r.phone?.trim() || !r.eventId || r.consent !== true) return error('Name, valid email, phone, event and contact consent are required', 400);
    if (r.fullName.length > 160 || r.email.length > 254 || r.phone.length > 40 || (r.whatsapp || '').length > 40 || (r.location || '').length > 180 || (r.busStop || '').length > 180 || (r.source || '').length > 100) return error('One or more fields exceed the allowed length', 400);
    const parts = r.eventId.split('__');
    if (parts.length !== 2 || !/^w_[a-zA-Z0-9_-]{8,100}$/.test(parts[0])) return error('Please select a valid published event', 400);
    const [workspaceId, eventId] = parts;
    const [published] = await db.get<EventRecord>(table('hymnora_events', workspaceId), [eventId]);
    if (!published) return error('This event is no longer available for registration', 404);
    const headers = event?.headers || {};
    const ip = headers['x-forwarded-for'] || headers['X-Forwarded-For'] || headers['x-real-ip'] || 'unknown';
    if (!(await registrationRateLimit(String(ip).split(',')[0].trim()))) return error('Too many registration attempts. Please try again later.', 429);
    const [id] = await db.add(table('hymnora_registrations', workspaceId), [{
      fullName: r.fullName.trim(), email: r.email.trim().toLowerCase(), phone: r.phone.trim(), whatsapp: r.whatsapp?.trim() || '',
      location: r.location?.trim() || '', busStop: r.busStop?.trim() || '', source: r.source?.trim() || '', eventId: r.eventId,
      eventTitle: published.title, consent: true, consentAt: new Date().toISOString(), consentPolicy: 'hymnora-contact-v1', createdAt: new Date().toISOString(),
    }]);
    if (!id) return error('Unable to save registration. Please try again.', 503);
    return json({ received: true, reference: id }, 201);
  }],
  'POST /api/scripture/suggest': [requireAuth(), async ({ body }) => {
    const { text } = (body || {}) as { text?: string };
    if (!text?.trim()) return error('Please provide sermon notes or keywords', 400);
    if (text.length > 12000) return error('Please limit sermon notes to 12,000 characters', 413);
    try {
      const result = await ai.extract({
        prompt: 'Identify relevant Bible passages for the sermon material. Return accurate canonical book names and chapter/verse references. Do not invent verses or quote copyrighted Bible translation text. Provide concise reasons tied to the input theme. Prefer 4 to 6 references and distinguish direct topical relevance from supporting cross-references.',
        content: text,
        schema: { type: 'object', properties: { passages: { type: 'array', items: { type: 'object', properties: { reference: { type: 'string' }, theme: { type: 'string' }, reason: { type: 'string' } }, required: ['reference', 'theme', 'reason'] } } }, required: ['passages'] },
        maxTokens: 1400, thinkingMode: 'FAST',
      });
      const data = result.data as { passages?: Array<{ reference: string; theme: string; reason: string }> };
      return json({ passages: (data.passages || []).slice(0, 8) });
    } catch { return error('Scripture analysis is temporarily unavailable. Please try again.', 502); }
  }],
  'GET /api/privacy/export': [requireAuth(), async ({ user }) => {
    const m = await getMembership(user!);
    if (!can(m.role, ['owner', 'admin'])) return error('Only workspace owners and administrators can export workspace data', 403);
    const [songs, events, registrations] = await Promise.all([
      db.list(table('hymnora_songs', m.workspaceId), { limit: 200 }),
      db.list(table('hymnora_events', m.workspaceId), { limit: 200 }),
      db.list(table('hymnora_registrations', m.workspaceId), { limit: 200 }),
    ]);
    return json({ exportedAt: new Date().toISOString(), workspaceId: m.workspaceId, songs: songs.items, events: events.items, registrations: registrations.items });
  }],
  'DELETE /api/privacy/registrations/:id': [requireAuth(), async ({ params, user }) => {
    const m = await getMembership(user!);
    if (!can(m.role, ['owner', 'admin'])) return error('Only workspace owners and administrators can delete attendee records', 403);
    const [deleted] = await db.delete(table('hymnora_registrations', m.workspaceId), [params.id]);
    return deleted ? json({ deleted: true }) : error('Registration not found', 404);
  }],
  'POST /api/team/invites': [requireAuth(), async ({ body, user }) => {
    const m = await getMembership(user!);
    if (!can(m.role, ['owner', 'admin'])) return error('Only workspace owners and administrators can invite team members', 403);
    const input = (body || {}) as { email?: string; role?: Role };
    const role = input.role || 'editor';
    if (!input.email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)) return error('Enter a valid team member email address', 400);
    if (!['admin', 'editor', 'worship_leader', 'viewer'].includes(role)) return error('That role cannot be assigned through an invitation', 400);
    try {
      const created = await invites.create({ resourceType: 'hymnora_workspace', authMode: 'required', actor: user!, allowList: [input.email.trim().toLowerCase()], expiresInSec: 604800, context: { workspaceId: m.workspaceId, role } });
      return json({ code: created.code, role, expiresInDays: 7 }, 201);
    } catch (err) { if (isInviteError(err)) return error(err.code, 400); throw err; }
  }],
  'POST /api/team/join': [requireAuth(), async ({ body, user }) => {
    const input = (body || {}) as { code?: string };
    if (!input.code) return error('Invitation code is required', 400);
    try {
      const joined = await invites.join({ code: input.code, actor: user! });
      const c = joined.context as { workspaceId?: string; role?: Role } | undefined;
      if (joined.resourceType !== 'hymnora_workspace' || !c?.workspaceId || !c.role || !['admin', 'editor', 'worship_leader', 'viewer'].includes(c.role)) return error('This invitation is not valid for a Hymnora workspace', 400);
      const [existing] = await db.get<Membership>('hymnora_user_workspace', [user!.userId]);
      if (existing && existing.workspaceId !== c.workspaceId) return error('This account is already assigned to another church workspace', 409);
      await db.tx.add('hymnora_user_workspace', [{ id: user!.userId, workspaceId: c.workspaceId, role: c.role, email: user!.email || '', joinedAt: new Date().toISOString() }]);
      return json({ joined: true, workspaceId: c.workspaceId, role: c.role });
    } catch (err) { if (isInviteError(err)) return error(err.code, 400); throw err; }
  }],
});