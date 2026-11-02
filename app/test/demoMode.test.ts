import AsyncStorage from '@react-native-async-storage/async-storage';
import { api, ApiError } from '../src/lib/api';
import { getMode } from '../src/lib/dataSource';
import { LocalParkingProvider, localProvider } from '../src/lib/localProvider';
import { sessionStore } from '../src/lib/session';

afterAll(async () => (await localProvider()).stop());

describe('demo mode (on-phone LocalParkingProvider)', () => {
  it('is the default when EXPO_PUBLIC_API_URL is not set', () => {
    expect(process.env.EXPO_PUBLIC_API_URL).toBeUndefined();
    expect(getMode()).toBe('demo');
  });

  it('answers the same calls as the server, with bundled data and prices', async () => {
    const malls = await api.malls({ lat: 13.7466, lng: 100.5393 });
    expect(malls).toHaveLength(5);
    expect(malls[0].id).toBe('centralworld');
    expect(malls[0].fees.hourly_thb).toBeGreaterThan(0);
    const mall = await api.mall('siam-paragon', 'free');
    expect(mall.floors[0].best_choice).toBe(true);
    const floor = await api.floor('iconsiam-b1');
    expect(floor.bays[0]).toHaveProperty('status');
    expect((await api.search('พารากอน', 'th'))[0].id).toBe('siam-paragon');
    await expect(api.mall('nope', 'free')).rejects.toMatchObject({ status: 404 });
  });

  it('ticketless entry and the wallet need login (UI-44)', async () => {
    await sessionStore.set(null);
    await expect(api.plates()).rejects.toMatchObject({ status: 401, code: 'login_required' });
    await expect(api.wallet()).rejects.toBeInstanceOf(ApiError);
  });

  it('demo email sign-up and login (UI-21)', async () => {
    await expect(api.signUp('not-an-email', 'secret1', 'A')).rejects.toMatchObject({ code: 'invalid_email' });
    const acc = await api.signUp('demo@example.com', 'secret1', 'Demo');
    await expect(api.signUp('demo@example.com', 'secret2', 'B')).rejects.toMatchObject({ code: 'email_taken' });
    await expect(api.logIn('demo@example.com', 'wrong!!')).rejects.toMatchObject({ status: 401, code: 'bad_credentials' });
    expect((await api.logIn('DEMO@example.com', 'secret1')).id).toBe(acc.id);
    await sessionStore.set(acc);
  });

  it('rejects bad plates like the server does (400)', async () => {
    await expect(api.addPlate('ABC123', 'กรุงเทพมหานคร')).rejects.toMatchObject({ status: 400 });
    await expect(api.addPlate('1กก 1234', 'Bangkok')).rejects.toMatchObject({ status: 400 });
  });

  it('top-up and paying: insufficient balance, then pay from the wallet (UI-16, UI-23)', async () => {
    const plate = await api.addPlate('2ขข 2222', 'กรุงเทพมหานคร', { car_model: 'Toyota Yaris', car_color: '#C62828' });
    const ticket = await api.addDemoTicket(plate.id, 'siam-paragon', 130); // 115 billable min = 2 hours, away from the hour boundary
    expect(ticket.fee_thb).toBe(40);
    await expect(api.payTicket(ticket.id)).rejects.toMatchObject({ status: 402, code: 'insufficient_balance' });
    await expect(api.topUp(5001, 'card')).rejects.toMatchObject({ code: 'invalid_amount' });
    expect((await api.topUp(100, 'promptpay')).balance_thb).toBe(100);
    const paid = await api.payTicket(ticket.id);
    expect(paid).toMatchObject({ status: 'open', paid_thb: 40, paid_from: 'wallet' });
    expect((await api.wallet()).balance_thb).toBe(60);
    await expect(api.payTicket(ticket.id)).rejects.toMatchObject({ code: 'nothing_due' });
    await api.deletePlate(plate.id);
  });

  it('runs the full gate flow on the phone and saves it across restarts', async () => {
    const plate = await api.addPlate('1กก 1234', 'กรุงเทพมหานคร');
    const entry = await api.gate({ mall_id: 'iconsiam', plate_number: '1กก1234', province: 'กรุงเทพมหานคร', direction: 'entry' });
    expect(entry.action).toBe('open_gate');
    expect((await api.tickets()).find((x) => x.plate_id === plate.id)!.status).toBe('open');
    const exit = await api.gate({ mall_id: 'iconsiam', plate_number: '1กก1234', province: 'กรุงเทพมหานคร', direction: 'exit', validated: true });
    expect(exit.action === 'open_gate' && exit.ticket.status).toBe('closed');
    const stranger = await api.gate({ mall_id: 'iconsiam', plate_number: 'กข 9999', province: 'ชลบุรี', direction: 'entry' });
    expect(stranger).toEqual({ action: 'fallback_ticket', reason: 'unregistered' });

    // Accounts, plates, tickets and wallet survive an app restart (a fresh provider reads AsyncStorage)
    const restarted = await LocalParkingProvider.create();
    expect((await restarted.listPlates(plate.user_id)).map((p) => p.id)).toEqual([plate.id]);
    expect(await restarted.listTickets(plate.user_id)).toHaveLength(1);
    expect((await restarted.getWallet(plate.user_id)).balance_thb).toBe(60);
    expect((await restarted.logIn('demo@example.com', 'secret1')).id).toBe(plate.user_id);

    await api.deletePlate(plate.id);
    expect(await api.plates()).toEqual([]);
    expect(JSON.parse((await AsyncStorage.getItem('app.demoState'))!).plates).toEqual([]);
  });

  it('reset clears demo accounts and wallet (UI-25)', async () => {
    await api.resetDemo();
    await expect(api.logIn('demo@example.com', 'secret1')).rejects.toMatchObject({ code: 'bad_credentials' });
    expect(JSON.parse((await AsyncStorage.getItem('app.demoState'))!).accounts).toEqual([]);
  });

  it('pushes live bay changes from the on-phone simulator (FR-11)', async () => {
    const p = await localProvider();
    const seen: unknown[] = [];
    const off = p.onBayChanges((c) => seen.push(...c));
    for (let i = 0; i < 5; i++) p.tick();
    off();
    expect(seen.length).toBeGreaterThan(0);
  });
});
