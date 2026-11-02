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

describe('layout v2: accounts, wallet and paying (UI-16, UI-21 to UI-25)', () => {
  let t = new Date('2026-11-07T07:00:00Z');
  const p = loadMockProvider(new URL('../data/', import.meta.url), { now: () => t });
  const srv = buildServer(p, { logger: false });
  const json = async (method: 'GET' | 'POST', url: string, payload?: object, uid?: string) => {
    const r = await srv.inject({ method, url, payload, headers: uid ? { 'x-user-id': uid } : {} });
    return { status: r.statusCode, body: r.json() };
  };
  afterAll(() => srv.close());

  it('signs up and logs in with email; rejects bad input and wrong passwords', async () => {
    expect((await json('POST', '/auth/signup', { email: 'nope', password: 'secret1', display_name: 'A' })).body).toEqual({ error: 'invalid_email' });
    expect((await json('POST', '/auth/signup', { email: 'a@b.co', password: '123', display_name: 'A' })).status).toBe(400);
    const made = await json('POST', '/auth/signup', { email: 'Asia@Example.com', password: 'secret1', display_name: 'Asia' });
    expect(made.status).toBe(201);
    expect(made.body).not.toHaveProperty('password_hash');
    expect((await json('POST', '/auth/signup', { email: 'asia@example.com', password: 'secret2', display_name: 'B' })).status).toBe(409);
    expect((await json('POST', '/auth/login', { email: 'asia@example.com', password: 'wrong!' })).status).toBe(401);
    expect((await json('POST', '/auth/login', { email: ' ASIA@example.com ', password: 'secret1' })).body.id).toBe(made.body.id);
  });

  it('tops up within 20–5,000 THB, pays a ticket from the wallet, and refuses when the balance is too low', async () => {
    const acc = await p.signUp('pay@example.com', 'secret1', 'Payer');
    expect((await json('POST', '/wallet/topup', { amount_thb: 10, method: 'card' }, acc.id)).status).toBe(400);
    expect((await json('POST', '/wallet/topup', { amount_thb: 5001, method: 'card' }, acc.id)).status).toBe(400);
    expect((await json('POST', '/wallet/topup', { amount_thb: 50, method: 'bitcoin' }, acc.id)).status).toBe(400);

    const plate = await p.registerPlate(acc.id, '2ขข 2222', 'กรุงเทพมหานคร', { car_model: 'Honda City', car_color: '#1E64C8' });
    expect(plate.car_model).toBe('Honda City');
    await expect(p.registerPlate(acc.id, '3คค 3', 'กรุงเทพมหานคร', { car_color: 'blue' })).rejects.toMatchObject({ code: 'invalid_car' });

    const ticket = (await json('POST', '/demo/ticket', { plate_id: plate.id, mall_id: 'siam-paragon', minutes_ago: 135 }, acc.id)).body;
    expect(ticket.fee_thb).toBe(40); // 135 min − 15 free = 2 started hours × 20

    expect((await json('POST', `/tickets/${ticket.id}/pay`, undefined, acc.id))).toMatchObject({ status: 402, body: { error: 'insufficient_balance' } });
    expect((await json('POST', '/wallet/topup', { amount_thb: 100, method: 'promptpay' }, acc.id)).body.balance_thb).toBe(100);
    const paid = (await json('POST', `/tickets/${ticket.id}/pay`, undefined, acc.id)).body;
    expect(paid).toMatchObject({ status: 'open', paid_thb: 40, paid_from: 'wallet' });
    expect((await json('POST', `/tickets/${ticket.id}/pay`, undefined, acc.id)).status).toBe(409); // nothing due now

    // 50 minutes later the fee has grown by one hour; the exit gate takes the difference from the wallet
    t = new Date(t.getTime() + 50 * 60000);
    const exit = await p.gateEvent({ mall_id: 'siam-paragon', plate_number: '2ขข2222', province: 'กรุงเทพมหานคร', direction: 'exit' });
    expect(exit.action === 'open_gate' && exit.ticket).toMatchObject({ status: 'closed', fee_thb: 60, paid_thb: 60, paid_from: 'wallet' });

    const wallet = (await json('GET', '/wallet', undefined, acc.id)).body;
    expect(wallet.balance_thb).toBe(40);
    expect(wallet.transactions.map((x: { type: string; amount_thb: number }) => `${x.type}:${x.amount_thb}`)).toEqual(['payment:20', 'payment:40', 'topup:100']);
  });

  it('falls back to the ticket machine at exit when the wallet cannot cover the fee', async () => {
    const acc = await p.signUp('poor@example.com', 'secret1', 'Poor');
    const plate = await p.registerPlate(acc.id, 'กข 77', 'ชลบุรี');
    await p.addDemoTicket(acc.id, plate.id, 'iconsiam', 300);
    const exit = await p.gateEvent({ mall_id: 'iconsiam', plate_number: 'กข77', province: 'ชลบุรี', direction: 'exit' });
    expect(exit.action === 'open_gate' && exit.ticket.paid_from).toBe('gate');
    expect((await p.getWallet(acc.id)).balance_thb).toBe(0);
  });

  it('reset clears accounts, plates, tickets and wallet; restore keeps them', async () => {
    const snap = p.snapshot();
    expect(snap.accounts!.length).toBeGreaterThan(0);
    p.reset();
    await expect(p.logIn('asia@example.com', 'secret1')).rejects.toMatchObject({ code: 'bad_credentials' });
    p.restore(snap);
    expect((await p.logIn('asia@example.com', 'secret1')).email).toBe('asia@example.com');
  });
});
