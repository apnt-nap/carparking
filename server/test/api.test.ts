import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import WebSocket from 'ws';
import { loadMockProvider } from '../src/loadMock.js';
import { buildServer } from '../src/server.js';
import { mulberry32 } from '../src/simulator.js';

let clock = new Date('2026-11-07T07:00:00Z'); // Saturday 14:00 in Bangkok
const provider = loadMockProvider(new URL('../data/', import.meta.url), { now: () => clock, rng: mulberry32(7) });
const app = buildServer(provider, { logger: false });
const user = { 'x-user-id': 'test-user' };

beforeAll(() => app.ready());
afterAll(() => app.close());

describe('API §6', () => {
  it('GET /malls sorts by distance when a location is given (FR-4)', async () => {
    const res = await app.inject('/malls?lat=13.7466&lng=100.5393'); // at CentralWorld
    const malls = res.json();
    expect(malls).toHaveLength(5);
    expect(malls[0].id).toBe('centralworld');
    expect(malls[0].distance_km).toBe(0);
    for (const m of malls) expect(['green', 'amber', 'red', 'grey']).toContain(m.availability);
  });

  it('GET /malls rejects a bad location', async () => {
    expect((await app.inject('/malls?lat=abc&lng=1')).statusCode).toBe(400);
  });

  it('GET /malls/:id sorts floors by free spaces and tags one best choice (FR-5 to FR-7)', async () => {
    const mall = (await app.inject('/malls/siam-paragon')).json();
    const free = mall.floors.map((f: { free: number }) => f.free);
    expect(free).toEqual([...free].sort((a, b) => b - a));
    expect(mall.floors.filter((f: { best_choice: boolean }) => f.best_choice)).toHaveLength(1);
    expect(mall.floors[0].best_choice).toBe(true);
    expect(mall.floors[0].special.ev.total).toBeGreaterThan(0);
    expect(mall.fees.summary_en).toContain('sample data');
    expect((await app.inject('/malls/nope')).statusCode).toBe(404);
  });

  it('GET /floors/:id returns geometry and bay statuses', async () => {
    const floor = (await app.inject('/floors/iconsiam-b1')).json();
    expect(floor.plan.edges.length).toBeGreaterThan(0);
    expect(floor.bays[0]).toHaveProperty('status');
  });

  it('GET /search handles Thai and English', async () => {
    expect((await app.inject(`/search?q=${encodeURIComponent('พารากอน')}&lang=th`)).json()[0].id).toBe('siam-paragon');
    expect((await app.inject('/search?q=icon%20siam&lang=en')).json()[0].id).toBe('iconsiam');
  });

  it('WS /live pushes bay changes for the requested floor (FR-11)', async () => {
    const address = await app.listen({ port: 0, host: '127.0.0.1' });
    const ws = new WebSocket(`${address.replace('http', 'ws')}/live?floor=centralworld-p1`);
    const msg = await new Promise<{ type: string; changes: { floor_id: string }[] }>((resolve, reject) => {
      ws.on('message', (raw) => {
        const m = JSON.parse(String(raw));
        if (m.type === 'hello') { for (let i = 0; i < 50; i++) provider.tick(); }
        else resolve(m);
      });
      ws.on('error', reject);
    });
    ws.close();
    expect(msg.type).toBe('bay_changes');
    expect(msg.changes.every((c) => c.floor_id === 'centralworld-p1')).toBe(true);
  });

  it('plate entry and exit flow (FR-21 to FR-24)', async () => {
    const noConsent = await app.inject({ method: 'POST', url: '/plates', headers: user, payload: { number: '1กก 1234', province: 'กรุงเทพมหานคร' } });
    expect(noConsent.statusCode).toBe(400);
    const badPlate = await app.inject({ method: 'POST', url: '/plates', headers: user, payload: { number: 'ABC123', province: 'กรุงเทพมหานคร', consent: true } });
    expect(badPlate.statusCode).toBe(400);
    expect((await app.inject({ method: 'POST', url: '/plates', payload: {} })).statusCode).toBe(401);

    const reg = await app.inject({ method: 'POST', url: '/plates', headers: user, payload: { number: '1กก 1234', province: 'กรุงเทพมหานคร', consent: true } });
    expect(reg.statusCode).toBe(201);
    const plate = reg.json();

    const gate = (direction: string, extra = {}) => app.inject({
      method: 'POST', url: '/sim/gate',
      payload: { mall_id: 'siam-paragon', plate_number: '1กก1234', province: 'กรุงเทพมหานคร', direction, ...extra },
    }).then((r) => r.json());

    expect((await gate('exit')).action).toBe('fallback_ticket'); // no open ticket yet
    const entry = await gate('entry');
    expect(entry.action).toBe('open_gate');
    expect(entry.ticket.status).toBe('open');

    clock = new Date(clock.getTime() + 150 * 60000); // 2.5 hours later
    expect((await app.inject({ url: '/tickets', headers: user })).json()[0].fee_thb).toBe(60); // running fee, no purchase

    const exit = await gate('exit', { validated: true });
    expect(exit.ticket.status).toBe('closed');
    expect(exit.ticket.fee_thb).toBe(20); // 150 min − 120 free = 1 started hour

    const unknown = await app.inject({ method: 'POST', url: '/sim/gate', payload: { mall_id: 'siam-paragon', plate_number: 'กข 9', province: 'ชลบุรี', direction: 'entry' } });
    expect(unknown.json()).toEqual({ action: 'fallback_ticket', reason: 'unregistered' });

    expect((await app.inject({ method: 'DELETE', url: `/plates/${plate.id}`, headers: user })).statusCode).toBe(204);
    expect((await app.inject({ url: '/tickets', headers: user })).json()).toEqual([]);
  });
});

describe('MockParkingProvider state (used by the app demo mode)', () => {
  it('snapshot and restore keep plates and tickets', async () => {
    const a = loadMockProvider(new URL('../data/', import.meta.url), { newId: (() => { let n = 0; return () => `id${++n}`; })() });
    const plate = await a.registerPlate('u1', 'กข 12', 'ชลบุรี');
    await a.gateEvent({ mall_id: 'iconsiam', plate_number: 'กข12', province: 'ชลบุรี', direction: 'entry' });
    expect(plate.id).toBe('id1');

    const b = loadMockProvider(new URL('../data/', import.meta.url));
    b.restore(a.snapshot());
    expect(await b.listPlates('u1')).toEqual([plate]);
    expect((await b.listTickets('u1'))[0]).toMatchObject({ id: 'id2', status: 'open', mall_id: 'iconsiam' });
  });
});
